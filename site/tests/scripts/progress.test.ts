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
	it('starts fresh on unparsable storage', () => {
		localStorage.setItem(KEY, '{not json');
		expect(progress.load()).toEqual(progress.emptyRecord());
	});
	it('warns once per malformed field', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		localStorage.setItem(KEY, JSON.stringify({ version: 1, lessons: { bad: {} }, reviews: 'x' }));
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
	it('checkpoint results and skips', () => {
		expect(progress.recordCheckpoint('a/x#c', false)).toEqual({ state: 'attempted', attempts: 1 });
		expect(progress.recordCheckpoint('a/x#c', true)).toEqual({ state: 'passed', attempts: 2 });
		progress.skipCheckpoint('a/x#d');
		expect(stored().checkpoints['a/x#d']).toEqual({ state: 'skipped', attempts: 1 });
	});
	it('review results, stage adjustment and due lists', () => {
		progress.finishLesson('a/x', [{ id: 'a/x#c', revision: 1 }]);
		expect(progress.recordReview('a/x#c', true)?.stage).toBe(2);
		expect(progress.recordReview('a/x#missing', true)).toBeUndefined();
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
	it('prunes orphans and resets outdated reviews only when something changes', () => {
		progress.finishLesson('a/x', [{ id: 'a/x#c', revision: 1 }]);
		progress.markLessonRead('gone/y');
		expect(progress.pruneOrphans(['a/x'], ['a/x#c'])).toBe(1);
		expect(progress.pruneOrphans(['a/x'], ['a/x#c'])).toBe(0);
		expect(progress.resetOutdatedReviews([{ id: 'a/x#c', revision: 1 }])).toBe(0);
		expect(progress.resetOutdatedReviews([{ id: 'a/x#c', revision: 2 }])).toBe(1);
		expect(stored().reviews['a/x#c']).toMatchObject({ stage: 1, revision: 2, due: progress.today() });
	});
	it('imports a record of this version and refuses others', () => {
		progress.setComfort('less');
		const text = progress.exportJson({ ...progress.emptyRecord(), comfort: 'more' });
		expect(progress.importJson(text)).toEqual({ ok: true });
		expect(stored().comfort).toBe('more');
		expect(progress.importJson('{"version": 2}')).toMatchObject({ ok: false });
		expect(stored().comfort).toBe('more');
	});
	it('import logs the fields normalize dropped, like load does', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = progress.importJson(JSON.stringify({ version: 1, lessons: { 'a/x': { state: 'bogus' } } }));
		expect(result).toEqual({ ok: true });
		expect(stored().lessons).toEqual({});
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0]?.[0]).toContain('dropped 1 malformed "lessons" entry');
	});
});
