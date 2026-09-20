/**
 * The learner's progress record, per spec S04, and the review schedule per
 * spec S05, as pure functions over a record. Nothing here touches the browser:
 * every function takes the record (and, where a date matters, the day) and
 * returns what it computed. `progress.ts` wraps these with local storage.
 */
export const VERSION = 1;
export const STORAGE_KEY = `ai-training-progress-v${VERSION}`;

export type LessonState = 'read' | 'finished' | 'skipped';
export type CheckpointState = 'passed' | 'skipped' | 'attempted';
export type Comfort = 'less' | 'more';
export type ReviewResult = 'pass' | 'fail';

export interface LessonEntry {
	state: LessonState;
	at: string;
}
export interface CheckpointEntry {
	state: CheckpointState;
	/** Check presses plus Skip presses; a skip counts as an attempt so skip-then-pass is not "first try". */
	attempts: number;
}
export interface ReviewEntry {
	stage: number | 'done';
	due: string;
	last: ReviewResult | null;
	history: ReviewResult[];
	/** The checkpoint's `revision` when scheduled (spec S05 "Content changes"); absent means 1. */
	revision?: number;
}
export interface GoalEntry {
	competency: string;
	level: string;
}
export interface QuizEntry {
	score: number;
	at: string;
}
export interface ProgressRecord {
	version: number;
	comfort?: Comfort;
	goals: GoalEntry[];
	lessons: Record<string, LessonEntry>;
	checkpoints: Record<string, CheckpointEntry>;
	reviews: Record<string, ReviewEntry>;
	quizzes: Record<string, QuizEntry>;
}

/** A checkpoint as the build knows it; what `finishLesson` and `resetOutdatedReviews` need. */
export interface ReviewableCheckpoint {
	/** Progress id: `<lesson id>#<checkpoint id>`. */
	id: string;
	revision: number;
}

/** Review stages in days after the last pass (spec S05 "Schedule"). */
export const STAGE_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 21, 5: 60 };
export const LAST_STAGE = 5;
export const REVIEW_CAP = 12;
export const DEFAULT_REVISION = 1;
/** How many results a review item remembers. */
export const HISTORY_LENGTH = 20;

const pad = (n: number) => String(n).padStart(2, '0');

/** A local calendar day as `YYYY-MM-DD`. */
export function dayOf(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(): string {
	return dayOf(new Date());
}

export function addDays(day: string, n: number): string {
	const [y, m, d] = day.split('-').map(Number);
	return dayOf(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + n));
}

/** Days after a pass at `stage`; the last stage's interval for anything past it. */
export function stageDays(stage: number): number {
	return STAGE_DAYS[stage] ?? STAGE_DAYS[LAST_STAGE] ?? 60;
}

export function emptyRecord(): ProgressRecord {
	return { version: VERSION, goals: [], lessons: {}, checkpoints: {}, reviews: {}, quizzes: {} };
}

// --- Shape validation -------------------------------------------------------

export const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function isLessonEntry(v: unknown): v is LessonEntry {
	return isObject(v) && (v.state === 'read' || v.state === 'finished' || v.state === 'skipped') && isDay(v.at);
}
function isCheckpointEntry(v: unknown): v is CheckpointEntry {
	return (
		isObject(v) &&
		(v.state === 'passed' || v.state === 'skipped' || v.state === 'attempted') &&
		typeof v.attempts === 'number'
	);
}
function isReviewEntry(v: unknown): v is ReviewEntry {
	if (!isObject(v)) return false;
	const stageOk = v.stage === 'done' || (typeof v.stage === 'number' && v.stage >= 1 && v.stage <= LAST_STAGE);
	const lastOk = v.last === null || v.last === 'pass' || v.last === 'fail';
	const historyOk = Array.isArray(v.history) && v.history.every((h) => h === 'pass' || h === 'fail');
	const revisionOk = v.revision === undefined || typeof v.revision === 'number';
	return stageOk && isDay(v.due) && lastOk && historyOk && revisionOk;
}
function isGoalEntry(v: unknown): v is GoalEntry {
	return isObject(v) && typeof v.competency === 'string' && typeof v.level === 'string';
}
function isQuizEntry(v: unknown): v is QuizEntry {
	return isObject(v) && typeof v.score === 'number' && isDay(v.at);
}

/** What `normalize` had to drop, so the caller can say so. */
export interface NormalizeWarning {
	field: string;
	/** `not-object`: the field was not a map at all. `dropped`: `count` entries failed validation. */
	kind: 'not-object' | 'dropped';
	count: number;
}

/** A map field: keep the entries that pass `guard`, drop the rest; a non-object field becomes empty. */
function cleanMap<T>(
	field: string,
	value: unknown,
	guard: (v: unknown) => v is T,
	warnings: NormalizeWarning[],
): Record<string, T> {
	if (!isObject(value)) {
		if (value !== undefined) warnings.push({ field, kind: 'not-object', count: 1 });
		return {};
	}
	const out: Record<string, T> = {};
	let dropped = 0;
	for (const [k, v] of Object.entries(value)) {
		if (guard(v)) out[k] = v;
		else dropped++;
	}
	if (dropped) warnings.push({ field, kind: 'dropped', count: dropped });
	return out;
}

/**
 * Coerce a parsed document into a well-formed record, or `null` when it is not
 * a record of this `VERSION`. Malformed fields fall back to empty, and each
 * one is reported in `warnings` when the caller passes an array.
 */
export function normalize(parsed: unknown, warnings: NormalizeWarning[] = []): ProgressRecord | null {
	if (!isObject(parsed) || parsed.version !== VERSION) return null;
	const record = emptyRecord();
	if (parsed.comfort === 'less' || parsed.comfort === 'more') record.comfort = parsed.comfort;
	record.goals = Array.isArray(parsed.goals) ? parsed.goals.filter(isGoalEntry) : [];
	record.lessons = cleanMap('lessons', parsed.lessons, isLessonEntry, warnings);
	record.checkpoints = cleanMap('checkpoints', parsed.checkpoints, isCheckpointEntry, warnings);
	record.reviews = cleanMap('reviews', parsed.reviews, isReviewEntry, warnings);
	record.quizzes = cleanMap('quizzes', parsed.quizzes, isQuizEntry, warnings);
	return record;
}

export function describeWarning(w: NormalizeWarning): string {
	if (w.kind === 'not-object') return `progress: "${w.field}" is not an object, ignored`;
	return `progress: dropped ${w.count} malformed "${w.field}" entr${w.count === 1 ? 'y' : 'ies'}`;
}

// --- Content changes (spec S04 and S05 "Content changes") --------------------

/**
 * Drop lesson, checkpoint and review entries whose id the build no longer
 * knows. Mutates `r`; returns how many entries went.
 */
export function pruneOrphanEntries(
	r: ProgressRecord,
	knownLessonIds: Iterable<string>,
	knownCheckpointIds: Iterable<string>,
): number {
	const lessons = new Set(knownLessonIds);
	const checkpoints = new Set(knownCheckpointIds);
	let dropped = 0;
	for (const id of Object.keys(r.lessons)) {
		if (lessons.has(id)) continue;
		delete r.lessons[id];
		dropped++;
	}
	for (const id of Object.keys(r.checkpoints)) {
		if (checkpoints.has(id)) continue;
		delete r.checkpoints[id];
		dropped++;
	}
	for (const id of Object.keys(r.reviews)) {
		if (checkpoints.has(id)) continue;
		delete r.reviews[id];
		dropped++;
	}
	return dropped;
}

/**
 * A review item whose stored `revision` differs from the build's resets to
 * stage 1, due on `day` (spec S05 "A checkpoint's answer changes"). Mutates
 * `r`; returns how many items reset.
 */
export function resetOutdatedReviewEntries(r: ProgressRecord, known: ReviewableCheckpoint[], day: string): number {
	let changed = 0;
	for (const cp of known) {
		const item = r.reviews[cp.id];
		if (!item) continue;
		if ((item.revision ?? DEFAULT_REVISION) === cp.revision) continue;
		item.stage = 1;
		item.due = day;
		item.revision = cp.revision;
		changed++;
	}
	return changed;
}

// --- Lessons and checkpoints -------------------------------------------------

/** Marks a lesson read on `day` unless it already has a state. Returns whether anything changed. */
export function applyLessonRead(r: ProgressRecord, lessonId: string, day: string): boolean {
	if (r.lessons[lessonId]) return false;
	r.lessons[lessonId] = { state: 'read', at: day };
	return true;
}

export function applyLessonSkipped(r: ProgressRecord, lessonId: string, day: string): void {
	r.lessons[lessonId] = { state: 'skipped', at: day };
}

/** Where a new review item starts (spec S05 "Lesson finished"): stage 2 for comfort `more`, stage 1 otherwise. */
export function initialStage(comfort: Comfort | undefined): number {
	return comfort === 'more' ? 2 : 1;
}

/** When a new review item is first due: today for comfort `less`, after its stage's interval otherwise. */
export function initialDue(comfort: Comfort | undefined, stage: number, day: string): string {
	return comfort === 'less' ? day : addDays(day, stageDays(stage));
}

/**
 * Finishing a lesson on `day` schedules every reviewable checkpoint that has no
 * review item yet. Items that exist already keep their schedule.
 */
export function applyLessonFinished(
	r: ProgressRecord,
	lessonId: string,
	reviewable: ReviewableCheckpoint[],
	day: string,
): void {
	r.lessons[lessonId] = { state: 'finished', at: day };
	for (const cp of reviewable) {
		if (r.reviews[cp.id]) continue;
		const stage = initialStage(r.comfort);
		r.reviews[cp.id] = {
			stage,
			due: initialDue(r.comfort, stage, day),
			last: null,
			history: [],
			revision: cp.revision,
		};
	}
}

/** A Check press: counts an attempt; a pass sticks, a fail never overrides an earlier pass. */
export function applyCheckpointResult(r: ProgressRecord, id: string, passed: boolean): CheckpointEntry {
	const c = r.checkpoints[id] ?? { state: 'attempted', attempts: 0 };
	c.attempts += 1;
	if (passed) c.state = 'passed';
	else if (c.state !== 'passed') c.state = 'attempted';
	r.checkpoints[id] = c;
	return c;
}

/** Skip counts as an attempt (so a later pass is not first-try) and never overrides a pass. */
export function applyCheckpointSkipped(r: ProgressRecord, id: string): CheckpointEntry {
	const c = r.checkpoints[id] ?? { state: 'skipped', attempts: 0 };
	c.attempts += 1;
	if (c.state !== 'passed') c.state = 'skipped';
	r.checkpoints[id] = c;
	return c;
}

// --- Reviews -----------------------------------------------------------------

/**
 * A review answer on `day`: pass moves up a stage (past the last stage the
 * item retires as `done`), fail drops to stage 1 due tomorrow (spec S05).
 * Returns the item, or `undefined` when there is no such review item.
 */
export function applyReviewResult(
	r: ProgressRecord,
	id: string,
	passed: boolean,
	day: string,
): ReviewEntry | undefined {
	const item = r.reviews[id];
	if (!item) return undefined;
	const result: ReviewResult = passed ? 'pass' : 'fail';
	item.history = [...item.history, result].slice(-HISTORY_LENGTH);
	item.last = result;
	if (passed) {
		const next = typeof item.stage === 'number' ? item.stage + 1 : LAST_STAGE + 1;
		if (next > LAST_STAGE) item.stage = 'done';
		else {
			item.stage = next;
			item.due = addDays(day, stageDays(next));
		}
	} else {
		item.stage = 1;
		item.due = addDays(day, 1);
	}
	return item;
}

/**
 * "See this sooner" (-1) or "See this less often" (+1), clamped to the stage
 * range. Returns the new stage, or `undefined` when nothing changed (no item,
 * a retired item, or already at the edge).
 */
export function applyStageAdjust(r: ProgressRecord, id: string, delta: number, day: string): number | undefined {
	const item = r.reviews[id];
	if (!item || item.stage === 'done') return undefined;
	const stage = Math.min(LAST_STAGE, Math.max(1, item.stage + delta));
	if (stage === item.stage) return undefined;
	item.stage = stage;
	item.due = addDays(day, stageDays(stage));
	return stage;
}

/** Every review item due on or before `day` whose id starts with `prefix`, oldest due first, uncapped. */
export function dueReviewIdsOn(record: ProgressRecord, prefix: string, day: string): string[] {
	return Object.entries(record.reviews)
		.filter(([id, item]) => id.startsWith(prefix) && item.stage !== 'done' && item.due <= day)
		.sort((a, b) => a[1].due.localeCompare(b[1].due))
		.map(([id]) => id);
}

/** The due items for one session: `dueReviewIdsOn` capped at `REVIEW_CAP` (spec S05). */
export function dueReviewsOn(record: ProgressRecord, prefix: string, day: string): string[] {
	return dueReviewIdsOn(record, prefix, day).slice(0, REVIEW_CAP);
}

export function applyComfort(r: ProgressRecord, level: Comfort | undefined): void {
	if (level) r.comfort = level;
	else delete r.comfort;
}

// --- Export and import --------------------------------------------------------

export function exportJson(record: ProgressRecord): string {
	return JSON.stringify(record, null, 2);
}

export type ImportResult = { ok: true; record: ProgressRecord } | { ok: false; message: string };

/** Parse an exported file: same version is accepted (malformed fields fall back to empty); another version is refused. */
export function parseImport(text: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { ok: false, message: 'That file is not valid JSON.' };
	}
	if (!isObject(parsed) || typeof parsed.version !== 'number') {
		return { ok: false, message: 'That file is not a progress record: it has no numeric "version" field.' };
	}
	if (parsed.version !== VERSION) {
		return {
			ok: false,
			message: `That file is version ${parsed.version}; this site stores version ${VERSION} and has no migration for it.`,
		};
	}
	const record = normalize(parsed);
	if (!record) return { ok: false, message: 'That file is not a progress record.' };
	return { ok: true, record };
}
