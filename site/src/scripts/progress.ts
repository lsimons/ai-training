/**
 * The learner's progress record in the browser: one JSON document in local
 * storage, and nothing leaves the browser. The record format and the review
 * schedule are pure functions in `progress-model.ts`; this module reads and
 * writes storage around them and fires `EVENT` after every write.
 */

import type { Comfort, ProgressRecord, ReviewableCheckpoint } from './progress-model';
import * as model from './progress-model';

export type {
	CheckpointEntry,
	CheckpointState,
	Comfort,
	GoalEntry,
	LessonEntry,
	LessonState,
	ProgressRecord,
	QuizEntry,
	ReviewableCheckpoint,
	ReviewEntry,
	ReviewResult,
	ReviewTrace,
} from './progress-model';
export {
	addDays,
	DEFAULT_REVISION,
	emptyRecord,
	exportJson,
	migrate,
	normalize,
	OLDEST_MIGRATABLE_VERSION,
	priorStorageKeys,
	REVIEW_CAP,
	STAGE_DAYS,
	STORAGE_KEY,
	storageKeyFor,
	today,
	VERSION,
} from './progress-model';

export const EVENT = 'ai-training:progress';

// --- Storage -----------------------------------------------------------------

let warnedWrite = false;
function warnWriteOnce(err: unknown) {
	if (warnedWrite) return;
	warnedWrite = true;
	console.warn('progress: could not write to local storage; progress will not persist in this browser', err);
}

/** Set once a migration has run in this page, so a failed write (private mode) does not log it on every load. */
let migrationLogged = false;

function parseStored(raw: string): ProgressRecord | null {
	const warnings: model.NormalizeWarning[] = [];
	const record = model.normalize(JSON.parse(raw), warnings);
	for (const w of warnings) console.warn(model.describeWarning(w));
	return record;
}

/**
 * The stored record (spec S04 "Storage"). With nothing under this version's
 * key, the newest older key with a migration is read, migrated and written
 * under this key; the old key is left in place until a reset and is not read
 * again once this key holds a record. A record of an unknown version, or one
 * that does not parse, starts fresh.
 */
export function load(): ProgressRecord {
	try {
		const raw = localStorage.getItem(model.STORAGE_KEY);
		if (raw) return parseStored(raw) ?? model.emptyRecord();
		for (const key of model.priorStorageKeys()) {
			const old = localStorage.getItem(key);
			if (!old) continue;
			const record = parseStored(old);
			if (!record) return model.emptyRecord();
			if (!migrationLogged) console.info(`progress: migrated the record under "${key}" to version ${model.VERSION}`);
			migrationLogged = true;
			try {
				localStorage.setItem(model.STORAGE_KEY, JSON.stringify(record));
			} catch (err) {
				warnWriteOnce(err);
			}
			return record;
		}
		return model.emptyRecord();
	} catch {
		return model.emptyRecord();
	}
}

/** Writes may fail (private mode, quota); the event still fires so the UI keeps working from memory. */
export function save(record: ProgressRecord): void {
	try {
		localStorage.setItem(model.STORAGE_KEY, JSON.stringify(record));
	} catch (err) {
		warnWriteOnce(err);
	}
	document.dispatchEvent(new CustomEvent(EVENT));
}

/** Removes this version's key and every older key, so a reset does not resurrect a migrated record on the next load. */
export function reset(): void {
	try {
		localStorage.removeItem(model.STORAGE_KEY);
		for (const key of model.priorStorageKeys()) localStorage.removeItem(key);
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
 * Drop entries whose id the build no longer knows. Needs the whole catalog, so
 * it runs where that is available (the progress page), not in `load()`. Saves
 * only when something was dropped.
 */
export function pruneOrphans(knownLessonIds: Iterable<string>, knownCheckpointIds: Iterable<string>): number {
	const r = load();
	const dropped = model.pruneOrphanEntries(r, knownLessonIds, knownCheckpointIds);
	if (dropped) save(r);
	return dropped;
}

/** Review items whose answer changed since they were scheduled restart at stage 1. Saves only when something changed. */
export function resetOutdatedReviews(known: ReviewableCheckpoint[]): number {
	const r = load();
	const changed = model.resetOutdatedReviewEntries(r, known, model.today());
	if (changed) save(r);
	return changed;
}

// --- Lessons and checkpoints -------------------------------------------------

export function markLessonRead(lessonId: string): void {
	const r = load();
	if (model.applyLessonRead(r, lessonId, model.today())) save(r);
}

export function skipLesson(lessonId: string): void {
	update((r) => model.applyLessonSkipped(r, lessonId, model.today()));
}

/** Finishing a lesson schedules every reviewable checkpoint (spec S05 "Lesson finished"). */
export function finishLesson(lessonId: string, reviewable: ReviewableCheckpoint[]): void {
	update((r) => model.applyLessonFinished(r, lessonId, reviewable, model.today()));
}

/**
 * A skills check result (spec S04 "Skills check"): the checkpoint result, and
 * on a pass the review item for `review` (absent when the checkpoint is not
 * reviewable), in one write.
 */
export function recordSkillsCheck(id: string, passed: boolean, review: ReviewableCheckpoint | undefined): void {
	update((r) => model.applySkillsCheckResult(r, id, passed, review, model.today()));
}

export function recordCheckpoint(id: string, passed: boolean): model.CheckpointEntry {
	let entry: model.CheckpointEntry | undefined;
	update((r) => {
		entry = model.applyCheckpointResult(r, id, passed);
	});
	return entry ?? { state: passed ? 'passed' : 'attempted', attempts: 1 };
}

export function skipCheckpoint(id: string): void {
	update((r) => model.applyCheckpointSkipped(r, id));
}

// --- Reviews -----------------------------------------------------------------

/** A review answer: pass moves up a stage, fail drops to stage 1 (spec S05). */
export function recordReview(id: string, passed: boolean): model.ReviewEntry | undefined {
	let out: model.ReviewEntry | undefined;
	update((r) => {
		out = model.applyReviewResult(r, id, passed, model.today());
	});
	return out;
}

/** "See this sooner" (-1) or "See this less often" (+1). At stage 1 or 5 already, nothing changes. */
export function adjustReviewStage(id: string, delta: number): void {
	update((r) => model.applyStageAdjust(r, id, delta, model.today()));
}

/** Every due review item whose id starts with `prefix`, oldest due first, uncapped. */
export function dueReviewIds(record: ProgressRecord, prefix: string): string[] {
	return model.dueReviewIdsOn(record, prefix, model.today());
}

/** The due items for one session: `dueReviewIds` capped at `REVIEW_CAP` (spec S05). */
export function dueReviews(record: ProgressRecord, prefix: string): string[] {
	return model.dueReviewsOn(record, prefix, model.today());
}

export function setComfort(level: Comfort | undefined): void {
	update((r) => model.applyComfort(r, level));
}

// --- Export and import --------------------------------------------------------

/** Import: this version, or an older one `migrate` knows, replaces the record (malformed fields fall back to empty); any other version is refused with a message. */
export function importJson(text: string): { ok: true } | { ok: false; message: string } {
	const result = model.parseImport(text);
	if (!result.ok) return result;
	for (const w of result.warnings) console.warn(model.describeWarning(w));
	save(result.record);
	return { ok: true };
}
