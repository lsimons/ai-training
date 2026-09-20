/**
 * The learner's progress record, per spec S04, with the review schedule per
 * spec S05. One JSON document in local storage; nothing leaves the browser.
 */
export const STORAGE_KEY = 'ai-training-progress-v1';
export const VERSION = 1;
export const EVENT = 'ai-training:progress';

export type LessonState = 'read' | 'finished' | 'skipped';
export type CheckpointState = 'passed' | 'skipped' | 'attempted';
export type Comfort = 'less' | 'more';

export interface LessonEntry {
	state: LessonState;
	at: string;
}
export interface CheckpointEntry {
	state: CheckpointState;
	attempts: number;
}
export interface ReviewEntry {
	stage: number | 'done';
	due: string;
	last: 'pass' | 'fail' | null;
	history: ('pass' | 'fail')[];
}
export interface ProgressRecord {
	version: number;
	comfort?: Comfort;
	goals: { competency: string; level: string }[];
	lessons: Record<string, LessonEntry>;
	checkpoints: Record<string, CheckpointEntry>;
	reviews: Record<string, ReviewEntry>;
	quizzes: Record<string, { score: number; at: string }>;
}

/** Review stages in days after the last pass (spec S05 "Schedule"). */
export const STAGE_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 21, 5: 60 };
export const REVIEW_CAP = 12;

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

export function load(): ProgressRecord {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyRecord();
		const parsed = JSON.parse(raw) as Partial<ProgressRecord>;
		if (parsed.version !== VERSION) return emptyRecord();
		return { ...emptyRecord(), ...parsed };
	} catch {
		return emptyRecord();
	}
}

export function save(record: ProgressRecord): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
	document.dispatchEvent(new CustomEvent(EVENT));
}

export function reset(): void {
	localStorage.removeItem(STORAGE_KEY);
	document.dispatchEvent(new CustomEvent(EVENT));
}

export function update(fn: (r: ProgressRecord) => void): ProgressRecord {
	const r = load();
	fn(r);
	save(r);
	return r;
}

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
export function finishLesson(lessonId: string, reviewableCheckpointIds: string[]): void {
	update((r) => {
		r.lessons[lessonId] = { state: 'finished', at: today() };
		for (const id of reviewableCheckpointIds) {
			if (r.reviews[id]) continue;
			const stage = r.comfort === 'more' ? 2 : 1;
			const due = r.comfort === 'less' ? today() : addDays(today(), STAGE_DAYS[stage]);
			r.reviews[id] = { stage, due, last: null, history: [] };
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

export function skipCheckpoint(id: string): void {
	update((r) => {
		const c = r.checkpoints[id] ?? { state: 'skipped', attempts: 0 };
		if (c.state !== 'passed') c.state = 'skipped';
		r.checkpoints[id] = c;
	});
}

/** A review answer: pass moves up a stage, fail drops to stage 1 (spec S05). */
export function recordReview(id: string, passed: boolean): ReviewEntry | undefined {
	let out: ReviewEntry | undefined;
	update((r) => {
		const item = r.reviews[id];
		if (!item) return;
		const result: 'pass' | 'fail' = passed ? 'pass' : 'fail';
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

/** "See this sooner" (-1) or "See this less often" (+1). */
export function adjustReviewStage(id: string, delta: number): void {
	update((r) => {
		const item = r.reviews[id];
		if (!item || item.stage === 'done') return;
		const stage = Math.min(5, Math.max(1, item.stage + delta));
		item.stage = stage;
		item.due = addDays(today(), STAGE_DAYS[stage]);
	});
}

/** Due review items whose id starts with `prefix`, oldest due first, capped. */
export function dueReviews(record: ProgressRecord, prefix: string): string[] {
	const now = today();
	return Object.entries(record.reviews)
		.filter(([id, item]) => id.startsWith(prefix) && item.stage !== 'done' && item.due <= now)
		.sort((a, b) => a[1].due.localeCompare(b[1].due))
		.map(([id]) => id)
		.slice(0, REVIEW_CAP);
}

export function setComfort(level: Comfort | undefined): void {
	update((r) => {
		if (level) r.comfort = level;
		else delete r.comfort;
	});
}

export function exportJson(record: ProgressRecord): string {
	return JSON.stringify(record, null, 2);
}

/** Import: same version replaces; an older version is refused with a message (no migrations exist yet). */
export function importJson(text: string): { ok: true } | { ok: false; message: string } {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return { ok: false, message: 'That file is not valid JSON.' };
	}
	const rec = parsed as Partial<ProgressRecord>;
	if (typeof rec !== 'object' || rec === null || typeof rec.version !== 'number') {
		return { ok: false, message: 'That file is not a progress record.' };
	}
	if (rec.version !== VERSION) {
		return {
			ok: false,
			message: `That file is version ${rec.version}; this site stores version ${VERSION} and has no migration for it.`,
		};
	}
	save({ ...emptyRecord(), ...rec });
	return { ok: true };
}
