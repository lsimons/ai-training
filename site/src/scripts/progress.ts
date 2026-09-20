/**
 * The learner's progress record, per spec S04, with the review schedule per
 * spec S05. One JSON document in local storage; nothing leaves the browser.
 */
export const VERSION = 1;
export const STORAGE_KEY = `ai-training-progress-v${VERSION}`;
export const EVENT = 'ai-training:progress';

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
export const REVIEW_CAP = 12;
export const DEFAULT_REVISION = 1;

export function today(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
	const [y, m, d] = day.split('-').map(Number);
	const date = new Date(y, m - 1, d + n);
	const pad = (k: number) => String(k).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function emptyRecord(): ProgressRecord {
	return { version: VERSION, goals: [], lessons: {}, checkpoints: {}, reviews: {}, quizzes: {} };
}

// --- Shape validation -------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function isLessonEntry(v: unknown): v is LessonEntry {
	return isObject(v) && (v.state === 'read' || v.state === 'finished' || v.state === 'skipped') && isDay(v.at);
}
function isCheckpointEntry(v: unknown): v is CheckpointEntry {
	return isObject(v) && (v.state === 'passed' || v.state === 'skipped' || v.state === 'attempted') && typeof v.attempts === 'number';
}
function isReviewEntry(v: unknown): v is ReviewEntry {
	if (!isObject(v)) return false;
	const stageOk = v.stage === 'done' || (typeof v.stage === 'number' && v.stage >= 1 && v.stage <= 5);
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

/** A map field: keep the entries that pass `guard`, drop the rest; a non-object field becomes empty. */
function cleanMap<T>(field: string, value: unknown, guard: (v: unknown) => v is T): Record<string, T> {
	if (!isObject(value)) {
		if (value !== undefined) console.warn(`progress: "${field}" is not an object, ignored`);
		return {};
	}
	const out: Record<string, T> = {};
	let dropped = 0;
	for (const [k, v] of Object.entries(value)) {
		if (guard(v)) out[k] = v;
		else dropped++;
	}
	if (dropped) console.warn(`progress: dropped ${dropped} malformed "${field}" entr${dropped === 1 ? 'y' : 'ies'}`);
	return out;
}

/**
 * Coerce a parsed document into a well-formed record, or `null` when it is not
 * a record of this `VERSION`. Malformed fields fall back to empty.
 */
export function normalise(parsed: unknown): ProgressRecord | null {
	if (!isObject(parsed) || parsed.version !== VERSION) return null;
	const record = emptyRecord();
	if (parsed.comfort === 'less' || parsed.comfort === 'more') record.comfort = parsed.comfort;
	record.goals = Array.isArray(parsed.goals) ? parsed.goals.filter(isGoalEntry) : [];
	record.lessons = cleanMap('lessons', parsed.lessons, isLessonEntry);
	record.checkpoints = cleanMap('checkpoints', parsed.checkpoints, isCheckpointEntry);
	record.reviews = cleanMap('reviews', parsed.reviews, isReviewEntry);
	record.quizzes = cleanMap('quizzes', parsed.quizzes, isQuizEntry);
	return record;
}

// --- Storage -----------------------------------------------------------------

let warnedWrite = false;
function warnWriteOnce(err: unknown) {
	if (warnedWrite) return;
	warnedWrite = true;
	console.warn('progress: could not write to local storage; progress will not persist in this browser', err);
}

/** A stored record of another version starts fresh (spec S04 "Storage"); the old key is left in place. */
export function load(): ProgressRecord {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyRecord();
		return normalise(JSON.parse(raw)) ?? emptyRecord();
	} catch {
		return emptyRecord();
	}
}

/** Writes may fail (private mode, quota); the event still fires so the UI keeps working from memory. */
export function save(record: ProgressRecord): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
	} catch (err) {
		warnWriteOnce(err);
	}
	document.dispatchEvent(new CustomEvent(EVENT));
}

export function reset(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (err) {
		warnWriteOnce(err);
	}
	document.dispatchEvent(new CustomEvent(EVENT));
}

export function update(fn: (r: ProgressRecord) => void): ProgressRecord {
	const r = load();
	fn(r);
	save(r);
	return r;
}

// --- Content changes (spec S04 and S05 "Content changes") --------------------

/**
 * Drop lesson, checkpoint and review entries whose id the build no longer
 * knows. Needs the whole catalog, so it runs where that is available (the
 * progress page), not in `load()`. Saves only when something was dropped.
 */
export function pruneOrphans(knownLessonIds: Iterable<string>, knownCheckpointIds: Iterable<string>): number {
	const lessons = new Set(knownLessonIds);
	const checkpoints = new Set(knownCheckpointIds);
	const r = load();
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
	if (dropped) save(r);
	return dropped;
}

/**
 * A review item whose stored `revision` differs from the build's resets to
 * stage 1, due today (spec S05 "A checkpoint's answer changes"). Saves only
 * when something changed.
 */
export function resetOutdatedReviews(known: ReviewableCheckpoint[]): number {
	const r = load();
	let changed = 0;
	for (const cp of known) {
		const item = r.reviews[cp.id];
		if (!item) continue;
		if ((item.revision ?? DEFAULT_REVISION) === cp.revision) continue;
		item.stage = 1;
		item.due = today();
		item.revision = cp.revision;
		changed++;
	}
	if (changed) save(r);
	return changed;
}

// --- Lessons and checkpoints -------------------------------------------------

export function markLessonRead(lessonId: string): void {
	const r = load();
	if (!r.lessons[lessonId]) update((rec) => (rec.lessons[lessonId] = { state: 'read', at: today() }));
}

export function skipLesson(lessonId: string): void {
	update((r) => (r.lessons[lessonId] = { state: 'skipped', at: today() }));
}

/**
 * Finishing a lesson schedules every reviewable checkpoint (spec S05
 * "Lesson finished"): stage 1 due tomorrow, or stage 2 for comfort `more`,
 * or due today for comfort `less`.
 */
export function finishLesson(lessonId: string, reviewable: ReviewableCheckpoint[]): void {
	update((r) => {
		r.lessons[lessonId] = { state: 'finished', at: today() };
		for (const cp of reviewable) {
			if (r.reviews[cp.id]) continue;
			const stage = r.comfort === 'more' ? 2 : 1;
			const due = r.comfort === 'less' ? today() : addDays(today(), STAGE_DAYS[stage]);
			r.reviews[cp.id] = { stage, due, last: null, history: [], revision: cp.revision };
		}
	});
}

export function recordCheckpoint(id: string, passed: boolean): CheckpointEntry {
	let entry!: CheckpointEntry;
	update((r) => {
		const c = r.checkpoints[id] ?? { state: 'attempted', attempts: 0 };
		c.attempts += 1;
		if (passed) c.state = 'passed';
		else if (c.state !== 'passed') c.state = 'attempted';
		r.checkpoints[id] = c;
		entry = c;
	});
	return entry;
}

/** Skip counts as an attempt (so a later pass is not first-try) and never overrides a pass. */
export function skipCheckpoint(id: string): void {
	update((r) => {
		const c = r.checkpoints[id] ?? { state: 'skipped', attempts: 0 };
		c.attempts += 1;
		if (c.state !== 'passed') c.state = 'skipped';
		r.checkpoints[id] = c;
	});
}

// --- Reviews -----------------------------------------------------------------

/** A review answer: pass moves up a stage, fail drops to stage 1 (spec S05). */
export function recordReview(id: string, passed: boolean): ReviewEntry | undefined {
	let out: ReviewEntry | undefined;
	update((r) => {
		const item = r.reviews[id];
		if (!item) return;
		const result: ReviewResult = passed ? 'pass' : 'fail';
		item.history = [...item.history, result].slice(-20);
		item.last = result;
		if (passed) {
			const next = typeof item.stage === 'number' ? item.stage + 1 : 6;
			if (next > 5) item.stage = 'done';
			else {
				item.stage = next;
				item.due = addDays(today(), STAGE_DAYS[next]);
			}
		} else {
			item.stage = 1;
			item.due = addDays(today(), 1);
		}
		out = item;
	});
	return out;
}

/** "See this sooner" (-1) or "See this less often" (+1). At stage 1 or 5 already, nothing changes. */
export function adjustReviewStage(id: string, delta: number): void {
	update((r) => {
		const item = r.reviews[id];
		if (!item || item.stage === 'done') return;
		const stage = Math.min(5, Math.max(1, item.stage + delta));
		if (stage === item.stage) return;
		item.stage = stage;
		item.due = addDays(today(), STAGE_DAYS[stage]);
	});
}

/** Every due review item whose id starts with `prefix`, oldest due first, uncapped. */
export function dueReviewIds(record: ProgressRecord, prefix: string): string[] {
	const now = today();
	return Object.entries(record.reviews)
		.filter(([id, item]) => id.startsWith(prefix) && item.stage !== 'done' && item.due <= now)
		.sort((a, b) => a[1].due.localeCompare(b[1].due))
		.map(([id]) => id);
}

/** The due items for one session: `dueReviewIds` capped at `REVIEW_CAP` (spec S05). */
export function dueReviews(record: ProgressRecord, prefix: string): string[] {
	return dueReviewIds(record, prefix).slice(0, REVIEW_CAP);
}

export function setComfort(level: Comfort | undefined): void {
	update((r) => {
		if (level) r.comfort = level;
		else delete r.comfort;
	});
}

// --- Export and import --------------------------------------------------------

export function exportJson(record: ProgressRecord): string {
	return JSON.stringify(record, null, 2);
}

/** Import: same version replaces (malformed fields fall back to empty); another version is refused with a message. */
export function importJson(text: string): { ok: true } | { ok: false; message: string } {
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
	const record = normalise(parsed);
	if (!record) return { ok: false, message: 'That file is not a progress record.' };
	save(record);
	return { ok: true };
}
