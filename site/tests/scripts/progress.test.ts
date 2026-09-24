// @vitest-environment happy-dom
import * as progress from '@scripts/progress';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = progress.STORAGE_KEY;
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null');

beforeEach(() => {
	localStorage.clear();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('load', () => {
	it('starts empty when nothing is stored', () => {
		expect(progress.load()).toEqual(progress.emptyRecord());
	});
	it('starts fresh on another version and leaves the old key alone', () => {
		localStorage.setItem(KEY, JSON.stringify({ version: 99, lessons: { x: 1 } }));
		expect(progress.load()).toEqual(progress.emptyRecord());
		expect(stored().version).toBe(99);
	});
	it('migrates a version 1 record under its old key, writes it under this key and leaves the old key alone', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		const v1 = {
			version: 1,
			goals: [],
			lessons: { 'a/x': { state: 'finished', at: '2026-03-10' } },
			checkpoints: {},
			reviews: { 'a/x#c': { stage: 2, due: '2026-03-13', last: 'pass', history: ['pass'], revision: 1 } },
			quizzes: {},
		};
		localStorage.setItem(progress.storageKeyFor(1), JSON.stringify(v1));
		const r = progress.load();
		expect(r.version).toBe(progress.VERSION);
		expect(r.habits).toEqual({});
		expect(r.lessons['a/x']).toEqual({ state: 'finished', at: '2026-03-10' });
		expect(r.reviews['a/x#c']).toEqual({
			stage: 2,
			due: '2026-03-13',
			last: 'pass',
			history: [{ at: '2026-03-10', result: 'pass' }],
			revision: 1,
		});
		expect(stored()).toEqual(r);
		expect(JSON.parse(localStorage.getItem(progress.storageKeyFor(1)) ?? 'null')).toEqual(v1);
		expect(info).toHaveBeenCalledTimes(1);
		// The next load reads this version's key and does not migrate again.
		progress.load();
		expect(info).toHaveBeenCalledTimes(1);
	});
	it('this version wins over an older key, and an unknown version under an older key starts fresh', () => {
		localStorage.setItem(KEY, JSON.stringify({ ...progress.emptyRecord(), comfort: 'less' }));
		localStorage.setItem(progress.storageKeyFor(1), JSON.stringify({ version: 1, comfort: 'more' }));
		expect(progress.load().comfort).toBe('less');
		localStorage.clear();
		localStorage.setItem(progress.storageKeyFor(1), JSON.stringify({ version: 0 }));
		expect(progress.load()).toEqual(progress.emptyRecord());
		expect(localStorage.getItem(KEY)).toBeNull();
	});
	it('reset after a migration removes the old key too, so the next load starts fresh', () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		localStorage.setItem(progress.storageKeyFor(1), JSON.stringify({ version: 1, comfort: 'more' }));
		expect(progress.load().comfort).toBe('more');
		progress.reset();
		expect(localStorage.getItem(KEY)).toBeNull();
		expect(localStorage.getItem(progress.storageKeyFor(1))).toBeNull();
		expect(progress.load()).toEqual(progress.emptyRecord());
	});
	it('starts fresh on unparsable storage', () => {
		localStorage.setItem(KEY, '{not json');
		expect(progress.load()).toEqual(progress.emptyRecord());
	});
	it('warns once per malformed field', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		localStorage.setItem(KEY, JSON.stringify({ version: progress.VERSION, lessons: { bad: {} }, reviews: 'x' }));
		progress.load();
		expect(warn).toHaveBeenCalledTimes(2);
		expect(warn.mock.calls[0]?.[0]).toContain('"lessons"');
		expect(warn.mock.calls[1]?.[0]).toContain('"reviews"');
	});
});

describe('save, reset and the event', () => {
	it('save writes and fires the event', () => {
		const listener = vi.fn();
		document.addEventListener(progress.EVENT, listener);
		progress.save({ ...progress.emptyRecord(), comfort: 'less' });
		expect(stored().comfort).toBe('less');
		expect(listener).toHaveBeenCalledTimes(1);
		document.removeEventListener(progress.EVENT, listener);
	});
	it('reset removes the key and fires the event', () => {
		const listener = vi.fn();
		document.addEventListener(progress.EVENT, listener);
		progress.setComfort('more');
		progress.reset();
		expect(localStorage.getItem(KEY)).toBeNull();
		expect(listener).toHaveBeenCalledTimes(2);
		document.removeEventListener(progress.EVENT, listener);
	});
	it('a failing write warns once and still fires the event', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const quota = () => {
			throw new Error('quota');
		};
		vi.stubGlobal('localStorage', { getItem: () => null, setItem: quota, removeItem: quota });
		const listener = vi.fn();
		document.addEventListener(progress.EVENT, listener);
		progress.save(progress.emptyRecord());
		progress.save(progress.emptyRecord());
		progress.reset();
		expect(listener).toHaveBeenCalledTimes(3);
		expect(warn).toHaveBeenCalledTimes(1);
		document.removeEventListener(progress.EVENT, listener);
		vi.unstubAllGlobals();
	});
});

describe('wrappers write through storage', () => {
	it('update returns the saved record', () => {
		const r = progress.update((rec) => {
			rec.goals.push({ competency: 'c', level: 'base' });
		});
		expect(r.goals).toHaveLength(1);
		expect(stored().goals).toHaveLength(1);
	});
	it('lesson read, skip and finish', () => {
		progress.markLessonRead('a/x');
		expect(stored().lessons['a/x'].state).toBe('read');
		progress.markLessonRead('a/x');
		progress.skipLesson('a/y');
		expect(stored().lessons['a/y'].state).toBe('skipped');
		progress.finishLesson('a/x', [{ id: 'a/x#c', revision: 1 }]);
		expect(stored().lessons['a/x'].state).toBe('finished');
		expect(stored().reviews['a/x#c'].stage).toBe(1);
	});
	it('a skills check pass writes the checkpoint and its review item in one save', () => {
		const listener = vi.fn();
		document.addEventListener(progress.EVENT, listener);
		progress.recordSkillsCheck('a/x#c', true, { id: 'a/x#c', revision: 1 });
		expect(stored().checkpoints['a/x#c']).toEqual({ state: 'passed', attempts: 1 });
		expect(stored().reviews['a/x#c'].stage).toBe(1);
		expect(listener).toHaveBeenCalledTimes(1);
		document.removeEventListener(progress.EVENT, listener);
	});
	it('checkpoint results and skips', () => {
		expect(progress.recordCheckpoint('a/x#c', false)).toEqual({ state: 'attempted', attempts: 1 });
		expect(progress.recordCheckpoint('a/x#c', true)).toEqual({ state: 'passed', attempts: 2 });
		progress.skipCheckpoint('a/x#d');
		expect(stored().checkpoints['a/x#d']).toEqual({ state: 'skipped', attempts: 1 });
	});
	it('practice results go to their own map', () => {
		expect(progress.recordPractice('a/x#p', true)).toEqual({ state: 'passed', attempts: 1 });
		expect(stored().practice['a/x#p']).toEqual({ state: 'passed', attempts: 1 });
		expect(stored().checkpoints['a/x#p']).toBeUndefined();
	});
	it('review results, stage adjustment and due lists', () => {
		progress.finishLesson('a/x', [{ id: 'a/x#c', revision: 1 }]);
		expect(progress.recordReview('a/x#c', true)?.stage).toBe(2);
		expect(progress.recordReview('a/x#missing', true)).toBeUndefined();
		progress.recordReview('a/x#c', false, 'c-again');
		expect(stored().reviews['a/x#c'].history.at(-1)).toEqual({
			at: progress.today(),
			result: 'fail',
			served: 'c-again',
		});
		expect(progress.servedCheckpoint('c', ['c-again'], stored().reviews['a/x#c'].history)).toBe('c');
		progress.adjustReviewStage('a/x#c', -1);
		expect(stored().reviews['a/x#c'].stage).toBe(1);
		expect(progress.dueReviewIds(progress.load(), 'a/')).toEqual([]);
		progress.update((r) => {
			const item = r.reviews['a/x#c'];
			if (item) item.due = '2000-01-01';
		});
		expect(progress.dueReviewIds(progress.load(), 'a/')).toEqual(['a/x#c']);
		expect(progress.dueReviews(progress.load(), 'a/')).toEqual(['a/x#c']);
	});
	it('habit results go through the record and the due list reads today', () => {
		progress.finishLesson('a/x', [], ['a/x#h']);
		expect(stored().habits['a/x#h']).toEqual({
			since: progress.today(),
			next: progress.addDays(progress.today(), 1),
			history: [],
		});
		progress.update((r) => {
			r.habits['a/x#h'] = { since: '2000-01-01', next: '2000-01-02', history: [] };
		});
		expect(progress.dueHabits(progress.load(), 'a/')).toEqual(['a/x#h']);
		expect(progress.recordHabit('a/x#h', 'done')).toEqual({
			since: '2000-01-01',
			next: null,
			history: [{ at: progress.today(), result: 'done' }],
		});
		expect(progress.dueHabits(progress.load())).toEqual([]);
		expect(progress.recordHabit('a/x#missing', 'skipped')).toBeUndefined();
	});
	it('prunes orphans and resets outdated reviews only when something changes', () => {
		progress.finishLesson('a/x', [{ id: 'a/x#c', revision: 1 }]);
		progress.markLessonRead('gone/y');
		expect(progress.pruneOrphans(['a/x'], ['a/x#c'], [], [])).toBe(1);
		expect(progress.pruneOrphans(['a/x'], ['a/x#c'], [], [])).toBe(0);
		expect(progress.resetOutdatedReviews([{ id: 'a/x#c', revision: 1 }])).toBe(0);
		expect(progress.resetOutdatedReviews([{ id: 'a/x#c', revision: 2 }])).toBe(1);
		expect(stored().reviews['a/x#c']).toMatchObject({ stage: 1, revision: 2, due: progress.today() });
	});
	it('imports a record of this version and refuses others', () => {
		progress.setComfort('less');
		const text = progress.exportJson({ ...progress.emptyRecord(), comfort: 'more' });
		expect(progress.importJson(text)).toEqual({ ok: true });
		expect(stored().comfort).toBe('more');
		expect(progress.importJson('{"version": 99}')).toMatchObject({ ok: false });
		expect(stored().comfort).toBe('more');
	});
	it('imports a version 1 file through the migration', () => {
		const text = JSON.stringify({
			version: 1,
			reviews: { 'a/x#c': { stage: 1, due: '2026-03-11', last: 'fail', history: ['pass', 'fail'], revision: 1 } },
		});
		expect(progress.importJson(text)).toEqual({ ok: true });
		expect(stored().version).toBe(progress.VERSION);
		expect(stored().habits).toEqual({});
		expect(stored().reviews['a/x#c']).toMatchObject({
			stage: 1,
			due: '2026-03-11',
			history: [
				{ at: '2026-03-10', result: 'pass' },
				{ at: '2026-03-10', result: 'fail' },
			],
		});
	});
	it('import logs the fields normalize dropped, like load does', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = progress.importJson(
			JSON.stringify({ version: progress.VERSION, lessons: { 'a/x': { state: 'bogus' } } }),
		);
		expect(result).toEqual({ ok: true });
		expect(stored().lessons).toEqual({});
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain('dropped 1 malformed "lessons" entry');
	});
});

// Last on purpose: the failing write here trips the module's warn-once flag, which the write test above checks.
describe('load after a migration whose write failed', () => {
	it('logs the migration once, even when the write under this key fails', async () => {
		// A fresh module instance, so the once-only flag starts unset regardless of the tests above.
		vi.resetModules();
		const fresh = await import('@scripts/progress');
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const v1 = JSON.stringify({ version: 1, comfort: 'less' });
		const quota = () => {
			throw new Error('quota');
		};
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => (key === fresh.storageKeyFor(1) ? v1 : null),
			setItem: quota,
			removeItem: quota,
		});
		expect(fresh.load().comfort).toBe('less');
		expect(fresh.load().comfort).toBe('less');
		vi.unstubAllGlobals();
		expect(info).toHaveBeenCalledTimes(1);
	});
});
