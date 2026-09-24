import {
	addDays,
	applyCheckpointResult,
	applyCheckpointSkipped,
	applyComfort,
	applyLessonFinished,
	applyLessonRead,
	applyLessonSkipped,
	applyPracticeResult,
	applyReviewResult,
	applySkillsCheckResult,
	applyStageAdjust,
	dayOf,
	describeWarning,
	dueHabits,
	dueReviewIdsOn,
	dueReviewsOn,
	emptyRecord,
	exportJson,
	HABIT_DAYS,
	HABIT_HISTORY_LENGTH,
	type HabitEntry,
	HISTORY_LENGTH,
	habitCardState,
	initialDue,
	initialStage,
	migrate,
	type NormalizeWarning,
	nextOccurrence,
	normalize,
	OLDEST_MIGRATABLE_VERSION,
	type ProgressRecord,
	parseImport,
	priorStorageKeys,
	pruneOrphanEntries,
	REVIEW_CAP,
	type ReviewEntry,
	recordHabit,
	resetOutdatedReviewEntries,
	STORAGE_KEY,
	scheduleReview,
	servedCheckpoint,
	stageDays,
	storageKeyFor,
	today,
	VERSION,
} from '@scripts/progress-model';
import { describe, expect, it } from 'vitest';

const DAY = '2026-03-10';

function review(over: Partial<ReviewEntry> = {}): ReviewEntry {
	return { stage: 1, due: DAY, last: null, history: [], revision: 1, ...over };
}

function record(over: Partial<ProgressRecord> = {}): ProgressRecord {
	return { ...emptyRecord(), ...over };
}

function habit(over: Partial<HabitEntry> = {}): HabitEntry {
	return { since: DAY, next: '2026-03-11', history: [], ...over };
}

describe('days', () => {
	it('formats a local day with zero padding', () => {
		expect(dayOf(new Date(2026, 0, 5))).toBe('2026-01-05');
	});
	it('today is a YYYY-MM-DD string', () => {
		expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
	it('adds days across a month and a year boundary', () => {
		expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2026-03-10', 60)).toBe('2026-05-09');
		expect(addDays('2026-03-10', -10)).toBe('2026-02-28');
	});
	it('stage intervals grow 1, 3, 7, 21, 60 and cap at the last one', () => {
		expect([1, 2, 3, 4, 5].map(stageDays)).toEqual([1, 3, 7, 21, 60]);
		expect(stageDays(9)).toBe(60);
	});
});

describe('normalize', () => {
	it('rejects other versions and non-objects', () => {
		expect(normalize(null)).toBeNull();
		expect(normalize([])).toBeNull();
		expect(normalize({ version: VERSION + 1 })).toBeNull();
		expect(normalize('x')).toBeNull();
	});
	it('fills missing fields and keeps a valid comfort', () => {
		const r = normalize({ version: VERSION, comfort: 'more' });
		expect(r).toEqual({ ...emptyRecord(), comfort: 'more' });
		expect(normalize({ version: VERSION, comfort: 'medium' })?.comfort).toBeUndefined();
	});
	it('drops malformed entries and reports each field', () => {
		const warnings: NormalizeWarning[] = [];
		const r = normalize(
			{
				version: VERSION,
				goals: [{ competency: 'a', level: 'base' }, { competency: 1 }, 'x'],
				lessons: {
					ok: { state: 'read', at: DAY },
					bad: { state: 'done', at: DAY },
					worse: { state: 'read', at: 'today' },
				},
				checkpoints: { ok: { state: 'passed', attempts: 2 }, bad: { state: 'passed' } },
				reviews: {
					ok: review(),
					done: review({ stage: 'done' }),
					badStage: review({ stage: 7 }),
					badLast: review({ last: 'meh' as never }),
					badHistory: review({ history: 'x' as never }),
					badRevision: review({ revision: 'one' as never }),
				},
				quizzes: 'nope',
			},
			warnings,
		);
		expect(r?.goals).toEqual([{ competency: 'a', level: 'base' }]);
		expect(Object.keys(r?.lessons ?? {})).toEqual(['ok']);
		expect(Object.keys(r?.checkpoints ?? {})).toEqual(['ok']);
		expect(Object.keys(r?.reviews ?? {})).toEqual(['ok', 'done']);
		expect(r?.quizzes).toEqual({});
		expect(warnings).toEqual([
			{ field: 'lessons', kind: 'dropped', count: 2 },
			{ field: 'checkpoints', kind: 'dropped', count: 1 },
			{ field: 'reviews', kind: 'dropped', count: 4 },
			{ field: 'quizzes', kind: 'not-object', count: 1 },
		]);
	});
	it('drops a malformed history trace but keeps the item, and says so', () => {
		const warnings: NormalizeWarning[] = [];
		const r = normalize(
			{
				version: VERSION,
				reviews: {
					a: review({ history: [{ at: DAY, result: 'pass' }, 'pass' as never, { at: 'today', result: 'pass' }] }),
					b: review({ history: [{ at: DAY, result: 'meh' as never }] }),
				},
			},
			warnings,
		);
		expect(r?.reviews.a?.history).toEqual([{ at: DAY, result: 'pass' }]);
		expect(r?.reviews.b).toEqual(review({ history: [] }));
		expect(warnings).toEqual([{ field: 'reviews.history', kind: 'dropped', count: 3 }]);
	});
	it('reads a record without practice as empty, and keeps practice entries and served ids', () => {
		const warnings: NormalizeWarning[] = [];
		expect(normalize({ version: VERSION }, warnings)?.practice).toEqual({});
		expect(warnings).toEqual([]);
		const r = normalize(
			{
				version: VERSION,
				practice: { ok: { state: 'passed', attempts: 1 }, bad: { state: 'done', attempts: 1 } },
				reviews: {
					a: review({
						history: [
							{ at: DAY, result: 'pass', served: 'alt' },
							{ at: DAY, result: 'pass', served: 3 as never },
						],
					}),
				},
			},
			warnings,
		);
		expect(r?.practice).toEqual({ ok: { state: 'passed', attempts: 1 } });
		expect(r?.reviews.a?.history).toEqual([{ at: DAY, result: 'pass', served: 'alt' }]);
		expect(warnings).toEqual([
			{ field: 'reviews.history', kind: 'dropped', count: 1 },
			{ field: 'practice', kind: 'dropped', count: 1 },
		]);
	});
	it('keeps a valid quiz entry', () => {
		const r = normalize({ version: VERSION, quizzes: { q: { score: 3, at: DAY } } });
		expect(r?.quizzes).toEqual({ q: { score: 3, at: DAY } });
	});
	it('describes warnings in plain words', () => {
		expect(describeWarning({ field: 'lessons', kind: 'dropped', count: 1 })).toContain('1 malformed "lessons" entry');
		expect(describeWarning({ field: 'lessons', kind: 'dropped', count: 2 })).toContain('2 malformed "lessons" entries');
		expect(describeWarning({ field: 'quizzes', kind: 'not-object', count: 1 })).toContain('not an object');
	});
});

describe('normalize habits (spec S07 "Storage")', () => {
	it('reads a record without habits as empty, keeps well-formed entries and drops the rest', () => {
		const warnings: NormalizeWarning[] = [];
		expect(normalize({ version: VERSION }, warnings)?.habits).toEqual({});
		expect(warnings).toEqual([]);
		const retired = habit({ next: null, history: [{ at: DAY, result: 'done' }] });
		const r = normalize(
			{
				version: VERSION,
				habits: {
					ok: habit(),
					retired,
					noSince: { next: null, history: [] },
					badNext: habit({ next: 'soon' as never }),
					badHistory: habit({ history: [{ at: DAY, result: 'pass' as never }] }),
				},
			},
			warnings,
		);
		expect(r?.habits).toEqual({ ok: habit(), retired });
		expect(warnings).toEqual([{ field: 'habits', kind: 'dropped', count: 3 }]);
	});
});

describe('habits (spec S07 "Schedule")', () => {
	it('falls due 1, 3 and 7 days after the finish day, then retires', () => {
		expect(HABIT_DAYS).toEqual([1, 3, 7]);
		expect(nextOccurrence(DAY, DAY)).toBe('2026-03-11');
		expect(nextOccurrence(DAY, '2026-03-11')).toBe('2026-03-13');
		expect(nextOccurrence(DAY, '2026-03-12')).toBe('2026-03-13');
		expect(nextOccurrence(DAY, '2026-03-13')).toBe('2026-03-17');
		// A late learner skips the occurrences that passed (the S07 late-learner row).
		expect(nextOccurrence(DAY, '2026-03-15')).toBe('2026-03-17');
		expect(nextOccurrence(DAY, '2026-03-17')).toBeNull();
		expect(nextOccurrence(DAY, '2026-04-01')).toBeNull();
	});
	it('done and skipped both append a result and move next on; the third result retires the habit', () => {
		const r = record({ habits: { h: habit() } });
		expect(recordHabit(r, 'h', 'done', '2026-03-11')).toEqual({
			since: DAY,
			next: '2026-03-13',
			history: [{ at: '2026-03-11', result: 'done' }],
		});
		// Two days late for the second occurrence: the next one is the 17th.
		expect(recordHabit(r, 'h', 'skipped', '2026-03-15')?.next).toBe('2026-03-17');
		const third = recordHabit(r, 'h', 'done', '2026-03-17');
		expect(third?.next).toBeNull();
		expect(third?.history).toEqual([
			{ at: '2026-03-11', result: 'done' },
			{ at: '2026-03-15', result: 'skipped' },
			{ at: '2026-03-17', result: 'done' },
		]);
		expect(third?.history).toHaveLength(HABIT_HISTORY_LENGTH);
		// A result after retirement keeps the cap and stays retired.
		expect(recordHabit(r, 'h', 'done', '2026-03-18')?.history).toHaveLength(HABIT_HISTORY_LENGTH);
		expect(r.habits.h?.next).toBeNull();
		expect(recordHabit(r, 'missing', 'done', DAY)).toBeUndefined();
	});
	it('a result past the last occurrence retires the habit with fewer than three results', () => {
		const r = record({ habits: { h: habit() } });
		expect(recordHabit(r, 'h', 'done', '2026-03-20')).toMatchObject({ next: null, history: [{ at: '2026-03-20' }] });
	});
	it('lists the due habits, by prefix, never a retired one', () => {
		const r = record({
			habits: {
				'b/y#late': habit({ next: '2026-03-01' }),
				'a/x#today': habit({ next: DAY }),
				'a/x#soon': habit({ next: '2026-03-11' }),
				'a/x#retired': habit({ next: null }),
			},
		});
		expect(dueHabits(r, DAY)).toEqual(['a/x#today', 'b/y#late']);
		expect(dueHabits(r, DAY, 'a/')).toEqual(['a/x#today']);
		expect(dueHabits(r, '2026-02-01')).toEqual([]);
	});
	it('names the card state from the entry and the day', () => {
		expect(habitCardState(undefined, DAY)).toBe('unfinished');
		expect(habitCardState(habit({ next: '2026-03-11' }), DAY)).toBe('waiting');
		expect(habitCardState(habit({ next: DAY }), DAY)).toBe('due');
		expect(habitCardState(habit({ next: '2026-03-01' }), DAY)).toBe('due');
		expect(habitCardState(habit({ next: null }), DAY)).toBe('retired');
	});
});

describe('content changes', () => {
	it('prunes entries the build no longer knows', () => {
		const r = record({
			lessons: { 'a/x': { state: 'read', at: DAY }, 'a/gone': { state: 'read', at: DAY } },
			checkpoints: { 'a/x#c1': { state: 'passed', attempts: 1 }, 'a/gone#c1': { state: 'passed', attempts: 1 } },
			reviews: { 'a/x#c1': review(), 'a/gone#c1': review() },
		});
		r.practice = { 'a/x#p1': { state: 'passed', attempts: 1 }, 'a/x#c1': { state: 'attempted', attempts: 1 } };
		r.habits = { 'a/x#h1': habit(), 'a/gone#h1': habit() };
		expect(pruneOrphanEntries(r, ['a/x'], ['a/x#c1'], ['a/x#p1'], ['a/x#h1'])).toBe(5);
		expect(Object.keys(r.lessons)).toEqual(['a/x']);
		expect(Object.keys(r.checkpoints)).toEqual(['a/x#c1']);
		expect(Object.keys(r.reviews)).toEqual(['a/x#c1']);
		expect(Object.keys(r.practice)).toEqual(['a/x#p1']);
		expect(Object.keys(r.habits)).toEqual(['a/x#h1']);
		expect(pruneOrphanEntries(r, ['a/x'], ['a/x#c1'], ['a/x#p1'], ['a/x#h1'])).toBe(0);
		// Without a habit list every habit entry is an orphan.
		expect(pruneOrphanEntries(r, ['a/x'], ['a/x#c1'], ['a/x#p1'])).toBe(1);
		expect(r.habits).toEqual({});
		// A checkpoint moved from `first` to `practice` keeps its practice entry and loses its review item.
		r.reviews['a/x#p1'] = review();
		expect(pruneOrphanEntries(r, ['a/x'], ['a/x#c1'], ['a/x#p1'])).toBe(1);
		expect(Object.keys(r.reviews)).toEqual(['a/x#c1']);
	});
	it('resets a review item whose revision changed, treating a missing revision as 1', () => {
		const r = record({
			reviews: {
				same: review({ stage: 3, revision: 2 }),
				changed: review({ stage: 4, due: '2026-04-01', revision: 1 }),
				legacy: review({ stage: 2, due: '2026-04-01' }),
			},
		});
		delete r.reviews.legacy?.revision;
		const known = [
			{ id: 'same', revision: 2 },
			{ id: 'changed', revision: 2 },
			{ id: 'legacy', revision: 1 },
			{ id: 'unknown', revision: 1 },
		];
		expect(resetOutdatedReviewEntries(r, known, DAY)).toBe(1);
		expect(r.reviews.changed).toMatchObject({ stage: 1, due: DAY, revision: 2 });
		expect(r.reviews.same?.stage).toBe(3);
		expect(r.reviews.legacy?.stage).toBe(2);
	});
});

describe('lessons', () => {
	it('marks read once and never downgrades a later state', () => {
		const r = record();
		expect(applyLessonRead(r, 'a/x', DAY)).toBe(true);
		expect(applyLessonRead(r, 'a/x', '2026-03-11')).toBe(false);
		expect(r.lessons['a/x']).toEqual({ state: 'read', at: DAY });
		applyLessonSkipped(r, 'a/x', DAY);
		expect(r.lessons['a/x']?.state).toBe('skipped');
		expect(applyLessonRead(r, 'a/x', DAY)).toBe(false);
	});
	it('new review items start at stage 1 due tomorrow by default', () => {
		expect(initialStage(undefined)).toBe(1);
		expect(initialDue(undefined, 1, DAY)).toBe('2026-03-11');
	});
	it('comfort more starts at stage 2 in three days, comfort less is due today', () => {
		expect(initialStage('more')).toBe(2);
		expect(initialDue('more', 2, DAY)).toBe('2026-03-13');
		expect(initialStage('less')).toBe(1);
		expect(initialDue('less', 1, DAY)).toBe(DAY);
	});
	it('finishing schedules every reviewable checkpoint once', () => {
		const r = record({ reviews: { 'a/x#old': review({ stage: 3, due: '2026-05-01' }) } });
		const reviewable = [
			{ id: 'a/x#old', revision: 1 },
			{ id: 'a/x#new', revision: 2 },
		];
		applyLessonFinished(r, 'a/x', reviewable, DAY);
		expect(r.lessons['a/x']).toEqual({ state: 'finished', at: DAY });
		expect(r.reviews['a/x#old']?.stage).toBe(3);
		expect(r.reviews['a/x#new']).toEqual({ stage: 1, due: '2026-03-11', last: null, history: [], revision: 2 });
	});
	it("scheduleReview creates one item at the comfort level's stage and keeps an existing one", () => {
		const r = record({ comfort: 'more', reviews: { 'a/x#old': review({ stage: 3, due: '2026-05-01' }) } });
		expect(scheduleReview(r, { id: 'a/x#new', revision: 2 }, DAY)).toBe(true);
		expect(r.reviews['a/x#new']).toEqual({ stage: 2, due: '2026-03-13', last: null, history: [], revision: 2 });
		expect(scheduleReview(r, { id: 'a/x#old', revision: 1 }, DAY)).toBe(false);
		expect(r.reviews['a/x#old']?.stage).toBe(3);
	});
	it('a skills check result counts an attempt and schedules the review only on a reviewable pass', () => {
		const r = record({ checkpoints: { 'a/x#c': { state: 'attempted', attempts: 2 } } });
		const cp = { id: 'a/x#c', revision: 1 };
		expect(applySkillsCheckResult(r, 'a/x#c', false, cp, DAY)).toEqual({ state: 'attempted', attempts: 3 });
		expect(r.reviews['a/x#c']).toBeUndefined();
		expect(applySkillsCheckResult(r, 'a/x#c', true, cp, DAY)).toEqual({ state: 'passed', attempts: 4 });
		expect(r.reviews['a/x#c']?.stage).toBe(1);
		expect(applySkillsCheckResult(r, 'a/x#d', true, undefined, DAY)).toEqual({ state: 'passed', attempts: 1 });
		expect(r.reviews['a/x#d']).toBeUndefined();
	});
});

describe('checkpoints', () => {
	it('counts attempts; a pass sticks through later fails', () => {
		const r = record();
		expect(applyCheckpointResult(r, 'c', false)).toEqual({ state: 'attempted', attempts: 1 });
		expect(applyCheckpointResult(r, 'c', true)).toEqual({ state: 'passed', attempts: 2 });
		expect(applyCheckpointResult(r, 'c', false)).toEqual({ state: 'passed', attempts: 3 });
	});
	it('skip counts as an attempt and never overrides a pass', () => {
		const r = record();
		expect(applyCheckpointSkipped(r, 'c')).toEqual({ state: 'skipped', attempts: 1 });
		applyCheckpointResult(r, 'c', true);
		expect(applyCheckpointSkipped(r, 'c')).toEqual({ state: 'passed', attempts: 3 });
		applyCheckpointResult(r, 'd', false);
		expect(applyCheckpointSkipped(r, 'd')).toEqual({ state: 'skipped', attempts: 2 });
	});
	it('a practice result goes to practice, never to checkpoints, with the same pass rule', () => {
		const r = record();
		expect(applyPracticeResult(r, 'a/x#p', false)).toEqual({ state: 'attempted', attempts: 1 });
		expect(applyPracticeResult(r, 'a/x#p', true)).toEqual({ state: 'passed', attempts: 2 });
		expect(applyPracticeResult(r, 'a/x#p', false)).toEqual({ state: 'passed', attempts: 3 });
		expect(r.checkpoints).toEqual({});
		expect(r.reviews).toEqual({});
	});
});

describe('reviews', () => {
	it('ignores an unknown item', () => {
		expect(applyReviewResult(record(), 'nope', true, DAY)).toBeUndefined();
	});
	it('a pass moves up a stage with the stage interval; the fifth pass retires the item', () => {
		const r = record({ reviews: { c: review({ stage: 1 }) } });
		expect(applyReviewResult(r, 'c', true, DAY)).toMatchObject({ stage: 2, due: '2026-03-13', last: 'pass' });
		expect(applyReviewResult(r, 'c', true, DAY)).toMatchObject({ stage: 3, due: '2026-03-17' });
		expect(applyReviewResult(r, 'c', true, DAY)).toMatchObject({ stage: 4, due: '2026-03-31' });
		expect(applyReviewResult(r, 'c', true, DAY)).toMatchObject({ stage: 5, due: '2026-05-09' });
		expect(applyReviewResult(r, 'c', true, DAY)).toMatchObject({ stage: 'done', due: '2026-05-09' });
		const pass = { at: DAY, result: 'pass' };
		expect(r.reviews.c?.history).toEqual([pass, pass, pass, pass, pass]);
	});
	it('a fail drops to stage 1 due tomorrow, even from done', () => {
		const r = record({ reviews: { c: review({ stage: 'done', due: '2026-01-01' }) } });
		expect(applyReviewResult(r, 'c', false, DAY)).toMatchObject({ stage: 1, due: '2026-03-11', last: 'fail' });
		// A pass on a retired item stays retired.
		r.reviews.c = review({ stage: 'done' });
		expect(applyReviewResult(r, 'c', true, DAY)?.stage).toBe('done');
	});
	it('writes the alternate served into the new history entry, and nothing for the own checkpoint', () => {
		const r = record({ reviews: { c: review() } });
		applyReviewResult(r, 'c', true, DAY, 'alt');
		applyReviewResult(r, 'c', false, DAY);
		expect(r.reviews.c?.history).toEqual([
			{ at: DAY, result: 'pass', served: 'alt' },
			{ at: DAY, result: 'fail' },
		]);
	});
	it('keeps only the last results', () => {
		const r = record({ reviews: { c: review() } });
		for (let i = 0; i < HISTORY_LENGTH + 5; i++) applyReviewResult(r, 'c', false, DAY);
		expect(r.reviews.c?.history).toHaveLength(HISTORY_LENGTH);
	});
	it('adjusts the stage within 1..5 and reschedules', () => {
		const r = record({ reviews: { c: review({ stage: 1 }), d: review({ stage: 'done' }) } });
		expect(applyStageAdjust(r, 'c', -1, DAY)).toBeUndefined();
		expect(applyStageAdjust(r, 'c', +1, DAY)).toBe(2);
		expect(r.reviews.c?.due).toBe('2026-03-13');
		expect(applyStageAdjust(r, 'c', +9, DAY)).toBe(5);
		expect(applyStageAdjust(r, 'c', +1, DAY)).toBeUndefined();
		expect(applyStageAdjust(r, 'd', -1, DAY)).toBeUndefined();
		expect(applyStageAdjust(r, 'missing', -1, DAY)).toBeUndefined();
	});
	it('lists due items by prefix, oldest first, and caps a session', () => {
		const reviews: Record<string, ReviewEntry> = {
			'a/x#late': review({ due: '2026-03-01' }),
			'a/x#today': review({ due: DAY }),
			'a/x#future': review({ due: '2026-03-11' }),
			'a/x#done': review({ stage: 'done', due: '2026-01-01' }),
			'b/y#late': review({ due: '2026-01-01' }),
		};
		for (let i = 0; i < REVIEW_CAP + 3; i++) reviews[`a/z#${i}`] = review({ due: '2026-03-05' });
		const r = record({ reviews });
		const due = dueReviewIdsOn(r, 'a/', DAY);
		expect(due[0]).toBe('a/x#late');
		expect(due.at(-1)).toBe('a/x#today');
		expect(due).not.toContain('a/x#future');
		expect(due).not.toContain('a/x#done');
		expect(due).not.toContain('b/y#late');
		expect(due).toHaveLength(REVIEW_CAP + 5);
		expect(dueReviewsOn(r, 'a/', DAY)).toHaveLength(REVIEW_CAP);
	});
});

describe('servedCheckpoint', () => {
	const asked = (...served: (string | undefined)[]) =>
		served.map((s) =>
			s === undefined ? { at: DAY, result: 'pass' as const } : { at: DAY, result: 'pass' as const, served: s },
		);
	it('asks the own checkpoint when there is no alternate', () => {
		expect(servedCheckpoint('own', [], [])).toBe('own');
		expect(servedCheckpoint('own', [], asked(undefined, undefined))).toBe('own');
	});
	it('asks the first alternate never asked, in page order (spec S05 examples)', () => {
		expect(servedCheckpoint('own', ['a', 'b'], [])).toBe('a');
		expect(servedCheckpoint('own', ['a', 'b'], asked('a'))).toBe('b');
		expect(servedCheckpoint('own', ['a'], asked(undefined))).toBe('a');
	});
	it('then the candidate asked least often, and among those the one asked longest ago', () => {
		expect(servedCheckpoint('own', ['a', 'b'], asked('a', 'b'))).toBe('own');
		expect(servedCheckpoint('own', ['a', 'b'], asked('a', 'b', undefined))).toBe('a');
		expect(servedCheckpoint('own', ['a', 'b'], asked('a', 'b', undefined, 'a'))).toBe('b');
		expect(servedCheckpoint('own', ['a', 'b'], asked(undefined, 'a', 'a', 'b'))).toBe('own');
	});
	it('never picks an alternate already asked in this session, and falls back by the same rule', () => {
		expect(servedCheckpoint('own', ['a', 'b'], [], ['a'])).toBe('b');
		expect(servedCheckpoint('own', ['a', 'b'], [], ['a', 'b'])).toBe('own');
		expect(servedCheckpoint('own', ['a', 'b'], asked('b', undefined), ['a'])).toBe('b');
		expect(servedCheckpoint('own', ['a'], asked('a'), ['a'])).toBe('own');
	});
	it('ignores a served id that is no longer an alternate', () => {
		expect(servedCheckpoint('own', ['a'], asked('gone', 'a'))).toBe('own');
		expect(servedCheckpoint('own', ['own'], [])).toBe('own');
	});
});

describe('comfort', () => {
	it('sets and unsets', () => {
		const r = record();
		applyComfort(r, 'less');
		expect(r.comfort).toBe('less');
		applyComfort(r, undefined);
		expect('comfort' in r).toBe(false);
	});
});

describe('export and import', () => {
	it('round-trips a record', () => {
		const r = record({ comfort: 'more', lessons: { 'a/x': { state: 'finished', at: DAY } } });
		const text = exportJson(r);
		expect(text).toContain(`\n  "version": ${VERSION}`);
		expect(parseImport(text)).toEqual({ ok: true, record: r, warnings: [] });
	});
	it('reports what normalize dropped instead of losing it silently', () => {
		const text = JSON.stringify({ version: VERSION, lessons: { 'a/x': { state: 'bogus' } }, reviews: 'nope' });
		const result = parseImport(text);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.record.lessons).toEqual({});
		expect(result.warnings).toEqual([
			{ field: 'lessons', kind: 'dropped', count: 1 },
			{ field: 'reviews', kind: 'not-object', count: 1 },
		]);
	});
	it('refuses bad input with a message', () => {
		expect(parseImport('{')).toEqual({ ok: false, message: 'That file is not valid JSON.' });
		expect(parseImport('{"lessons":{}}')).toMatchObject({ ok: false, message: expect.stringContaining('no numeric') });
		expect(parseImport('[]')).toMatchObject({ ok: false });
		expect(parseImport(`{"version":${VERSION + 1}}`)).toMatchObject({
			ok: false,
			message: expect.stringContaining(`version ${VERSION + 1}`),
		});
	});
	it('the storage key carries the version, and the prior keys count down to the oldest migratable one', () => {
		expect(STORAGE_KEY).toBe(`ai-training-progress-v${VERSION}`);
		expect(storageKeyFor(1)).toBe('ai-training-progress-v1');
		expect(priorStorageKeys()).toEqual(['ai-training-progress-v2', 'ai-training-progress-v1']);
		expect(OLDEST_MIGRATABLE_VERSION).toBe(1);
	});
});

describe('migrate from version 1', () => {
	// A version 1 review item: `history` holds bare results.
	const v1 = (over: Record<string, unknown>) => ({
		stage: 2,
		due: '2026-03-13',
		last: 'pass',
		history: ['fail', 'pass'],
		revision: 1,
		...over,
	});

	it('dates each result by the last answer, worked back from due and stage', () => {
		const out = migrate({
			version: 1,
			reviews: { passed: v1({}), failed: v1({ stage: 1, due: '2026-03-11', last: 'fail' }) },
		}) as {
			version: number;
			reviews: Record<string, { history: unknown[] }>;
		};
		expect(out.version).toBe(VERSION);
		// Stage 2 is 3 days after the pass, so the pass was on the 10th.
		expect(out.reviews.passed?.history).toEqual([
			{ at: '2026-03-10', result: 'fail' },
			{ at: '2026-03-10', result: 'pass' },
		]);
		// A fail is due the next day.
		expect(out.reviews.failed?.history).toEqual([
			{ at: '2026-03-10', result: 'fail' },
			{ at: '2026-03-10', result: 'pass' },
		]);
	});
	it('a retired or unanswered item is dated by due itself', () => {
		const out = migrate({
			version: 1,
			reviews: { done: v1({ stage: 'done', due: DAY }), fresh: v1({ last: null, history: [] }) },
		}) as { reviews: Record<string, unknown> };
		expect(out.reviews.done).toMatchObject({
			history: [
				{ at: DAY, result: 'fail' },
				{ at: DAY, result: 'pass' },
			],
		});
		expect(out.reviews.fresh).toMatchObject({ history: [] });
	});
	it('leaves other fields, malformed items and unknown history entries for normalize to judge', () => {
		const out = migrate({
			version: 1,
			comfort: 'more',
			lessons: { 'a/x': { state: 'read', at: DAY } },
			reviews: { odd: 'x', noHistory: { stage: 1 }, bad: v1({ history: ['pass', 7] }) },
		}) as { comfort: string; lessons: unknown; reviews: Record<string, unknown> };
		expect(out.comfort).toBe('more');
		expect(out.lessons).toEqual({ 'a/x': { state: 'read', at: DAY } });
		expect(out.reviews.odd).toBe('x');
		expect(out.reviews.noHistory).toEqual({ stage: 1 });
		expect(out.reviews.bad).toMatchObject({ history: [{ at: '2026-03-10', result: 'pass' }, 7] });
		const warnings: NormalizeWarning[] = [];
		const r = normalize({ version: 1, reviews: { odd: 'x', bad: v1({ history: ['pass', 7] }), ok: v1({}) } }, warnings);
		expect(Object.keys(r?.reviews ?? {})).toEqual(['bad', 'ok']);
		expect(r?.reviews.bad?.history).toEqual([{ at: '2026-03-10', result: 'pass' }]);
		expect(warnings).toEqual([
			{ field: 'reviews.history', kind: 'dropped', count: 1 },
			{ field: 'reviews', kind: 'dropped', count: 1 },
		]);
	});
	it('normalize and parseImport accept a version 1 record and keep its schedule', () => {
		const doc = { version: 1, reviews: { c: v1({}) } };
		const r = normalize(doc);
		expect(r?.version).toBe(VERSION);
		expect(r?.reviews.c).toMatchObject({ stage: 2, due: '2026-03-13', last: 'pass', revision: 1 });
		expect(parseImport(JSON.stringify(doc))).toEqual({ ok: true, record: r, warnings: [] });
	});
	it('stops when a step does not move the version forward', () => {
		// A step that leaves the version where it was, or returns no record, must not loop; `migrate` gives the doc back.
		const doc = { version: 1 };
		expect(migrate(doc, { 1: (d) => d })).toBe(doc);
		expect(migrate(doc, { 1: () => ({ version: 0 }) })).toBe(doc);
		expect(migrate(doc, { 1: () => 'x' as never })).toBe(doc);
		expect(normalize(doc)).not.toBeNull();
	});
	it('a version without a migration step is returned as it came', () => {
		expect(migrate({ version: 0, reviews: {} })).toEqual({ version: 0, reviews: {} });
		expect(migrate({ version: VERSION + 1 })).toEqual({ version: VERSION + 1 });
		expect(migrate('x')).toBe('x');
		expect(normalize({ version: 0 })).toBeNull();
		expect(parseImport('{"version":0}')).toMatchObject({ ok: false, message: expect.stringContaining('version 0') });
	});
});

describe('migrate from version 2', () => {
	it('copies the record and adds an empty habits map', () => {
		const v2 = {
			version: 2,
			comfort: 'more',
			lessons: { 'a/x': { state: 'finished', at: DAY } },
			reviews: { 'a/x#c': { stage: 1, due: DAY, last: null, history: [], revision: 1 } },
			practice: { 'a/x#p': { state: 'passed', attempts: 1 } },
		};
		expect(migrate(v2)).toEqual({ ...v2, version: 3, habits: {} });
		expect(migrate(v2)).not.toBe(v2);
	});
	it('runs the chain from version 1 through 2 to 3', () => {
		const out = migrate({
			version: 1,
			reviews: { c: { stage: 1, due: '2026-03-11', last: 'fail', history: ['fail'], revision: 1 } },
		}) as { version: number; habits: unknown; reviews: Record<string, { history: unknown[] }> };
		expect(out.version).toBe(VERSION);
		expect(out.habits).toEqual({});
		expect(out.reviews.c?.history).toEqual([{ at: '2026-03-10', result: 'fail' }]);
	});
	it('normalize and parseImport accept a version 2 file', () => {
		const doc = { version: 2, lessons: { 'a/x': { state: 'finished', at: DAY } } };
		const r = normalize(doc);
		expect(r?.version).toBe(VERSION);
		expect(r?.habits).toEqual({});
		expect(r?.lessons).toEqual(doc.lessons);
		expect(parseImport(JSON.stringify(doc))).toEqual({ ok: true, record: r, warnings: [] });
	});
});
