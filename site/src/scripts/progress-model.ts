/**
 * The learner's progress record, per spec S04, the review schedule per spec
 * S05 and the habit schedule per spec S07, as pure functions over a record. Nothing here touches the browser:
 * every function takes the record (and, where a date matters, the day) and
 * returns what it computed. `progress.ts` wraps these with local storage.
 */
export const VERSION = 3;
/** The oldest record version `migrate` can bring up to `VERSION`. */
export const OLDEST_MIGRATABLE_VERSION = 1;
export const storageKeyFor = (version: number) => `ai-training-progress-v${version}`;
export const STORAGE_KEY = storageKeyFor(VERSION);

/** The keys of older, migratable records, newest first (spec S04 "Storage"). */
export function priorStorageKeys(): string[] {
	const keys: string[] = [];
	for (let v = VERSION - 1; v >= OLDEST_MIGRATABLE_VERSION; v--) keys.push(storageKeyFor(v));
	return keys;
}

export type LessonState = 'read' | 'finished' | 'skipped';
export type CheckpointState = 'passed' | 'skipped' | 'attempted';
export type Comfort = 'less' | 'more';
export type ReviewResult = 'pass' | 'fail';
/**
 * One answered review: the local calendar day and the result. `served` is the
 * id (within the lesson) of the `review` alternate the review page asked in
 * place of the item's own checkpoint; absent when it asked the item's own
 * (spec S04 "Storage", S05 "Which checkpoint a review asks").
 */
export interface ReviewTrace {
	at: string;
	result: ReviewResult;
	served?: string;
}

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
	/** Oldest first, capped at `HISTORY_LENGTH`. */
	history: ReviewTrace[];
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
export type HabitResult = 'done' | 'skipped';
/** One habit result: the local calendar day and what the learner reported (spec S07 "Storage"). */
export interface HabitTrace {
	at: string;
	result: HabitResult;
}
/**
 * A habit's schedule (spec S07 "Storage"): `since` is the day the lesson was
 * first finished and never changes, `next` the day the habit is next due or
 * `null` once it has retired, `history` the results so far, oldest first,
 * capped at `HABIT_HISTORY_LENGTH`.
 */
export interface HabitEntry {
	since: string;
	next: string | null;
	history: HabitTrace[];
}
export interface ProgressRecord {
	version: number;
	comfort?: Comfort;
	goals: GoalEntry[];
	lessons: Record<string, LessonEntry>;
	checkpoints: Record<string, CheckpointEntry>;
	reviews: Record<string, ReviewEntry>;
	/**
	 * Results of `practice` checkpoints, in the form of `checkpoints` (spec S04 "What gets recorded"). Kept apart
	 * so that no progress figure, finishing rule or review counts them. Added to version 2 without a bump.
	 */
	practice: Record<string, CheckpointEntry>;
	quizzes: Record<string, QuizEntry>;
	/** Per habit, keyed `<lesson id>#<habit id>` (spec S07 "Storage"). Added in version 3. */
	habits: Record<string, HabitEntry>;
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
/** Days after the lesson's finish day on which a habit falls due (spec S07 "Schedule"). */
export const HABIT_DAYS: readonly number[] = [1, 3, 7];
/** One result per occurrence, so a habit's history is as long as its schedule. */
export const HABIT_HISTORY_LENGTH = HABIT_DAYS.length;

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
	return {
		version: VERSION,
		goals: [],
		lessons: {},
		checkpoints: {},
		reviews: {},
		practice: {},
		quizzes: {},
		habits: {},
	};
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
const isResult = (v: unknown): v is ReviewResult => v === 'pass' || v === 'fail';
function isReviewTrace(v: unknown): v is ReviewTrace {
	return isObject(v) && isDay(v.at) && isResult(v.result) && (v.served === undefined || typeof v.served === 'string');
}
function isReviewEntry(v: unknown): v is ReviewEntry {
	if (!isObject(v)) return false;
	const stageOk = v.stage === 'done' || (typeof v.stage === 'number' && v.stage >= 1 && v.stage <= LAST_STAGE);
	const lastOk = v.last === null || isResult(v.last);
	const historyOk = Array.isArray(v.history) && v.history.every(isReviewTrace);
	const revisionOk = v.revision === undefined || typeof v.revision === 'number';
	return stageOk && isDay(v.due) && lastOk && historyOk && revisionOk;
}
function isGoalEntry(v: unknown): v is GoalEntry {
	return isObject(v) && typeof v.competency === 'string' && typeof v.level === 'string';
}
function isQuizEntry(v: unknown): v is QuizEntry {
	return isObject(v) && typeof v.score === 'number' && isDay(v.at);
}
const isHabitResult = (v: unknown): v is HabitResult => v === 'done' || v === 'skipped';
function isHabitTrace(v: unknown): v is HabitTrace {
	return isObject(v) && isDay(v.at) && isHabitResult(v.result);
}
function isHabitEntry(v: unknown): v is HabitEntry {
	if (!isObject(v)) return false;
	const nextOk = v.next === null || isDay(v.next);
	const historyOk = Array.isArray(v.history) && v.history.every(isHabitTrace);
	return isDay(v.since) && nextOk && historyOk;
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

// --- Migration (spec S04 "Storage") -----------------------------------------

/**
 * The day of a version 1 item's last answer, worked back from `due`: a pass at
 * stage n was due n's interval later, a fail was due the next day. A retired
 * item, or one never answered, gives `due` itself.
 */
function v1LastAnsweredDay(item: Record<string, unknown>): string {
	const due = isDay(item.due) ? item.due : undefined;
	if (!due) return '';
	if (item.last === 'fail') return addDays(due, -1);
	if (item.last === 'pass' && typeof item.stage === 'number') return addDays(due, -stageDays(item.stage));
	return due;
}

/** Version 1 to 2: a bare `history` result becomes `{ at, result }`, dated by the item's last answer. */
function migrateV1(doc: Record<string, unknown>): Record<string, unknown> {
	const reviews: Record<string, unknown> = {};
	if (isObject(doc.reviews)) {
		for (const [id, item] of Object.entries(doc.reviews)) {
			if (!isObject(item) || !Array.isArray(item.history)) {
				reviews[id] = item;
				continue;
			}
			const at = v1LastAnsweredDay(item);
			reviews[id] = { ...item, history: item.history.map((h) => (isResult(h) ? { at, result: h } : h)) };
		}
	}
	return { ...doc, version: 2, reviews };
}

/** Version 2 to 3: a copy of the record with an empty `habits` map (spec S07 "Storage"). */
function migrateV2(doc: Record<string, unknown>): Record<string, unknown> {
	return { ...doc, version: 3, habits: {} };
}

type MigrationStep = (doc: Record<string, unknown>) => Record<string, unknown>;
/** Each step brings a record from the keyed version to the next one. */
const MIGRATIONS: Record<number, MigrationStep> = { 1: migrateV1, 2: migrateV2 };

/**
 * Bring a parsed record of an older version up to `VERSION`, one step at a
 * time. Anything that is not a record with a known older version is returned
 * as it came, so `normalize` and `parseImport` can reject it.
 */
export function migrate(parsed: unknown, steps: Record<number, MigrationStep> = MIGRATIONS): unknown {
	let doc = parsed;
	while (isObject(doc) && typeof doc.version === 'number' && doc.version < VERSION) {
		const from = doc.version;
		const step = steps[from];
		if (!step) return doc;
		const next = step(doc);
		// A step that does not move the version forward would loop forever; stop and let the caller reject the doc.
		if (!isObject(next) || typeof next.version !== 'number' || next.version <= from) return doc;
		doc = next;
	}
	return doc;
}

/**
 * Drop malformed `history` traces from every review item, keeping the item
 * (it is the learner's schedule). Returns a copy of the map, and reports the
 * drops under `reviews.history`.
 */
function cleanHistories(reviews: unknown, warnings: NormalizeWarning[]): unknown {
	if (!isObject(reviews)) return reviews;
	const out: Record<string, unknown> = {};
	let dropped = 0;
	for (const [id, item] of Object.entries(reviews)) {
		if (!isObject(item) || !Array.isArray(item.history)) {
			out[id] = item;
			continue;
		}
		const history = item.history.filter(isReviewTrace);
		dropped += item.history.length - history.length;
		out[id] = { ...item, history };
	}
	if (dropped) warnings.push({ field: 'reviews.history', kind: 'dropped', count: dropped });
	return out;
}

/**
 * Coerce a parsed document into a well-formed record, or `null` when it is not
 * a record of this `VERSION` or of an older version `migrate` knows. Malformed
 * fields fall back to empty, a malformed history trace is dropped from its
 * item, and each drop is reported in `warnings` when the caller passes an array.
 */
export function normalize(raw: unknown, warnings: NormalizeWarning[] = []): ProgressRecord | null {
	const parsed = migrate(raw);
	if (!isObject(parsed) || parsed.version !== VERSION) return null;
	const record = emptyRecord();
	if (parsed.comfort === 'less' || parsed.comfort === 'more') record.comfort = parsed.comfort;
	record.goals = Array.isArray(parsed.goals) ? parsed.goals.filter(isGoalEntry) : [];
	record.lessons = cleanMap('lessons', parsed.lessons, isLessonEntry, warnings);
	record.checkpoints = cleanMap('checkpoints', parsed.checkpoints, isCheckpointEntry, warnings);
	record.reviews = cleanMap('reviews', cleanHistories(parsed.reviews, warnings), isReviewEntry, warnings);
	// Absent in a record written before practice existed: empty, with no warning (cleanMap warns only on a value).
	record.practice = cleanMap('practice', parsed.practice, isCheckpointEntry, warnings);
	record.quizzes = cleanMap('quizzes', parsed.quizzes, isQuizEntry, warnings);
	record.habits = cleanMap('habits', parsed.habits, isHabitEntry, warnings);
	return record;
}

export function describeWarning(w: NormalizeWarning): string {
	if (w.kind === 'not-object') return `progress: "${w.field}" is not an object, ignored`;
	return `progress: dropped ${w.count} malformed "${w.field}" entr${w.count === 1 ? 'y' : 'ies'}`;
}

// --- Content changes (spec S04 and S05 "Content changes") --------------------

/**
 * Drop lesson, checkpoint, review, practice and habit entries whose id the
 * build no longer knows. Each map is pruned against its own list:
 * `checkpoints` and `reviews` against the `first` checkpoint ids, `practice`
 * against the `practice` ids, so a checkpoint moved from `first` to
 * `practice` loses its review item, and `habits` against the habit ids (spec
 * S07 "Content changes"). Mutates `r`; returns how many entries went.
 */
export function pruneOrphanEntries(
	r: ProgressRecord,
	knownLessonIds: Iterable<string>,
	knownCheckpointIds: Iterable<string>,
	knownPracticeIds: Iterable<string>,
	knownHabitIds: Iterable<string>,
): number {
	const lessons = new Set(knownLessonIds);
	const checkpoints = new Set(knownCheckpointIds);
	const practice = new Set(knownPracticeIds);
	const habits = new Set(knownHabitIds);
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
	for (const id of Object.keys(r.practice)) {
		if (practice.has(id)) continue;
		delete r.practice[id];
		dropped++;
	}
	for (const id of Object.keys(r.habits)) {
		if (habits.has(id)) continue;
		delete r.habits[id];
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
 * review item yet, and enters every habit of the page (`habitIds`, as
 * `<lesson id>#<habit id>`) that has no entry yet, due the day after (spec
 * S07 "Schedule"). Items and entries that exist already keep their schedule.
 */
export function applyLessonFinished(
	r: ProgressRecord,
	lessonId: string,
	reviewable: ReviewableCheckpoint[],
	day: string,
	habitIds: readonly string[] = [],
): void {
	r.lessons[lessonId] = { state: 'finished', at: day };
	for (const cp of reviewable) scheduleReview(r, cp, day);
	for (const id of habitIds) enterHabit(r, id, day);
}

/**
 * The habit entry a finished lesson creates: `since` is the finish day and
 * `next` its first occurrence. An entry that exists, retired or not, is kept
 * (spec S07 "Lesson finished again"). Returns whether an entry was created.
 */
export function enterHabit(r: ProgressRecord, id: string, day: string): boolean {
	if (r.habits[id]) return false;
	r.habits[id] = { since: day, next: nextOccurrence(day, day), history: [] };
	return true;
}

/**
 * Create the review item for one checkpoint on `day` at the comfort level's
 * initial stage. An item that exists already keeps its schedule. Returns
 * whether an item was created. Called by `applyLessonFinished` for every
 * reviewable checkpoint, and by the skills check for a passed one (spec S04
 * "Skills check").
 */
export function scheduleReview(r: ProgressRecord, cp: ReviewableCheckpoint, day: string): boolean {
	if (r.reviews[cp.id]) return false;
	const stage = initialStage(r.comfort);
	r.reviews[cp.id] = {
		stage,
		due: initialDue(r.comfort, stage, day),
		last: null,
		history: [],
		revision: cp.revision,
	};
	return true;
}

/**
 * A Check press in the skills check (spec S04 "Skills check"): the checkpoint
 * result as in the body, and on a pass the review item for `review` (the
 * checkpoint as the build knows it; absent when it is not reviewable).
 */
export function applySkillsCheckResult(
	r: ProgressRecord,
	id: string,
	passed: boolean,
	review: ReviewableCheckpoint | undefined,
	day: string,
): CheckpointEntry {
	const entry = applyCheckpointResult(r, id, passed);
	if (passed && review) scheduleReview(r, review, day);
	return entry;
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

/**
 * A Check press on a `practice` checkpoint (spec S03 "More practice"): the
 * same rule as `applyCheckpointResult`, written to `practice`, so it never
 * counts toward finishing the lesson or any progress figure.
 */
export function applyPracticeResult(r: ProgressRecord, id: string, passed: boolean): CheckpointEntry {
	const c = r.practice[id] ?? { state: 'attempted', attempts: 0 };
	c.attempts += 1;
	if (passed) c.state = 'passed';
	else if (c.state !== 'passed') c.state = 'attempted';
	r.practice[id] = c;
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
 * `served` is the id of the `review` alternate that was asked, if one was,
 * and goes into the new history entry. Returns the item, or `undefined`
 * when there is no such review item.
 */
export function applyReviewResult(
	r: ProgressRecord,
	id: string,
	passed: boolean,
	day: string,
	served?: string,
): ReviewEntry | undefined {
	const item = r.reviews[id];
	if (!item) return undefined;
	const result: ReviewResult = passed ? 'pass' : 'fail';
	const trace: ReviewTrace = served === undefined ? { at: day, result } : { at: day, result, served };
	item.history = [...item.history, trace].slice(-HISTORY_LENGTH);
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

/**
 * Which checkpoint the review page asks for a due item (spec S05 "Which
 * checkpoint a review asks"). `own` is the item's checkpoint id,
 * `alternates` its `review` alternates in page order, and `history` the
 * item's answers. The first alternate never asked wins. Otherwise the
 * candidate asked least often wins, and among those the one asked longest
 * ago, with `own` first when the history doesn't show it. A `served` id that
 * is no longer an alternate counts for nothing. `taken` holds the
 * alternates already asked for another item in this review session; they
 * are not candidates, so one session never asks the same alternate twice.
 * The item's own checkpoint is always a candidate.
 */
export function servedCheckpoint(
	own: string,
	alternates: readonly string[],
	history: readonly ReviewTrace[],
	taken: readonly string[] = [],
): string {
	const open = alternates.filter((a) => a !== own && !taken.includes(a));
	const candidates = [own, ...open];
	const asked = new Map(candidates.map((c) => [c, 0]));
	const lastAsked = new Map<string, number>();
	history.forEach((h, i) => {
		const id = h.served ?? own;
		const n = asked.get(id);
		if (n === undefined) return;
		asked.set(id, n + 1);
		lastAsked.set(id, i);
	});
	const fresh = open.find((a) => asked.get(a) === 0);
	if (fresh !== undefined) return fresh;
	let best = own;
	for (const c of candidates) {
		const count = asked.get(c) ?? 0;
		const bestCount = asked.get(best) ?? 0;
		const last = lastAsked.get(c) ?? -1;
		const bestLast = lastAsked.get(best) ?? -1;
		if (count < bestCount || (count === bestCount && last < bestLast)) best = c;
	}
	return best;
}

// --- Habits (spec S07) --------------------------------------------------------

/**
 * When a habit whose lesson was finished on `since` is next due after `day`
 * (spec S07 "Schedule"): the first of `since` + 1, 3, 7 days that is later
 * than `day`, or `null` when none is left and the habit retires. Anchored on
 * `since`, so a learner who comes back late skips the occurrences they missed.
 */
export function nextOccurrence(since: string, day: string): string | null {
	for (const n of HABIT_DAYS) {
		const due = addDays(since, n);
		if (due > day) return due;
	}
	return null;
}

/**
 * Done or Skip on `day` (spec S07 "Schedule"): the result goes on the
 * history, capped at one per occurrence, and `next` moves to the next
 * occurrence after `day`. With the history full, or no occurrence left, the
 * habit retires (`next` is `null`). Returns the entry, or `undefined` when
 * there is no such habit.
 */
export function recordHabit(r: ProgressRecord, id: string, result: HabitResult, day: string): HabitEntry | undefined {
	const entry = r.habits[id];
	if (!entry) return undefined;
	entry.history = [...entry.history, { at: day, result }].slice(-HABIT_HISTORY_LENGTH);
	entry.next = entry.history.length >= HABIT_HISTORY_LENGTH ? null : nextOccurrence(entry.since, day);
	return entry;
}

/** Every habit due on or before `day` whose id starts with `prefix`, in id order. A retired habit is never due. */
export function dueHabits(r: ProgressRecord, day: string, prefix = ''): string[] {
	return Object.entries(r.habits)
		.filter(([id, h]) => id.startsWith(prefix) && h.next !== null && h.next <= day)
		.map(([id]) => id)
		.sort();
}

export type HabitCardState = 'unfinished' | 'hidden' | 'waiting' | 'due' | 'retired';

/**
 * What the habit card shows (spec S07 "Where habits surface"): the text only
 * while the lesson is unfinished (no entry), the next date while waiting, Done
 * and Skip when due, and the results once retired. `hidden` is a finished
 * lesson without an entry: the learner finished it before the habit existed
 * (or on an older record), and never sees the card (S07 "Content changes").
 */
export function habitCardState(
	entry: HabitEntry | undefined,
	day: string,
	lesson?: LessonEntry | undefined,
): HabitCardState {
	if (!entry) return lesson?.state === 'finished' ? 'hidden' : 'unfinished';
	if (entry.next === null) return 'retired';
	return entry.next <= day ? 'due' : 'waiting';
}

export function applyComfort(r: ProgressRecord, level: Comfort | undefined): void {
	if (level) r.comfort = level;
	else delete r.comfort;
}

// --- Export and import --------------------------------------------------------

export function exportJson(record: ProgressRecord): string {
	return JSON.stringify(record, null, 2);
}

export type ImportResult =
	| { ok: true; record: ProgressRecord; warnings: NormalizeWarning[] }
	| { ok: false; message: string };

/**
 * Parse an exported file: this version is accepted, an older version with a
 * migration is migrated, and either way malformed fields fall back to empty
 * with each drop reported in `warnings` for the caller to log. Any other
 * version is refused.
 */
export function parseImport(text: string): ImportResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, message: 'That file is not valid JSON.' };
	}
	if (!isObject(raw) || typeof raw.version !== 'number') {
		return { ok: false, message: 'That file is not a progress record: it has no numeric "version" field.' };
	}
	const parsed = migrate(raw);
	if (!isObject(parsed) || parsed.version !== VERSION) {
		return {
			ok: false,
			message: `That file is version ${raw.version}; this site stores version ${VERSION} and has no migration for it.`,
		};
	}
	const warnings: NormalizeWarning[] = [];
	const record = normalize(parsed, warnings);
	if (!record) return { ok: false, message: 'That file is not a progress record.' };
	return { ok: true, record, warnings };
}
