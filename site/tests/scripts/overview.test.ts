import { type CatalogCourse, overall, progressPercent } from '@scripts/overview';
import { emptyRecord, type ProgressRecord } from '@scripts/progress-model';
import { describe, expect, it } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{ id: 'concepts/a', title: 'A', checkpoints: [{ id: 'c1', reviewable: true, revision: 1 }] },
			{ id: 'concepts/b', title: 'B', checkpoints: [] },
		],
	},
	{
		area: 'safety',
		title: 'Safety',
		lessons: [
			{
				id: 'safety/c',
				title: 'C',
				checkpoints: [
					{ id: 'c1', reviewable: true, revision: 1 },
					{ id: 'c2', reviewable: false, revision: 1 },
				],
			},
		],
	},
];
const ids = catalog.flatMap((c) => c.lessons.map((l) => l.id));
const at = '2026-01-01';

describe('progressPercent', () => {
	it('is finished over all minus skipped, lessons only (spec S04 "Progress display")', () => {
		const rec: ProgressRecord = {
			...emptyRecord(),
			lessons: {
				'concepts/a': { state: 'finished', at },
				'concepts/b': { state: 'skipped', at },
				'safety/c': { state: 'read', at },
			},
			// Passed checkpoints do not move the figure.
			checkpoints: { 'safety/c#c1': { state: 'passed', attempts: 1 } },
		};
		// 1 finished / (3 − 1 skipped) = 50%.
		expect(progressPercent(ids, rec)).toEqual({ finished: 1, skipped: 1, percent: 50 });
	});
	it('rounds to a whole number and is 0 when nothing is left to count', () => {
		const rec: ProgressRecord = { ...emptyRecord(), lessons: { 'concepts/a': { state: 'finished', at } } };
		expect(progressPercent(ids, rec).percent).toBe(33);
		expect(progressPercent([], emptyRecord()).percent).toBe(0);
		const allSkipped: ProgressRecord = {
			...emptyRecord(),
			lessons: Object.fromEntries(ids.map((id) => [id, { state: 'skipped' as const, at }])),
		};
		expect(progressPercent(ids, allSkipped)).toEqual({ finished: 0, skipped: 3, percent: 0 });
	});
});

describe('overall', () => {
	it('is zero with no progress and points at the first lesson', () => {
		const o = overall(catalog, emptyRecord());
		expect(o).toMatchObject({ lessons: 3, finished: 0, skipped: 0, started: 0, checkpoints: 3, passed: 0, percent: 0 });
		expect(o.next?.id).toBe('concepts/a');
		expect(o.firstSkipped).toBeNull();
		expect(o.any).toBe(false);
	});
	it('counts states and passed checkpoints, and skips to the next open lesson', () => {
		const rec: ProgressRecord = {
			...emptyRecord(),
			lessons: {
				'concepts/a': { state: 'finished', at },
				'concepts/b': { state: 'skipped', at },
				'safety/c': { state: 'read', at },
			},
			checkpoints: {
				'concepts/a#c1': { state: 'passed', attempts: 1 },
				'safety/c#c1': { state: 'attempted', attempts: 2 },
			},
		};
		const o = overall(catalog, rec);
		expect(o).toMatchObject({ finished: 1, skipped: 1, started: 1, passed: 1 });
		// The same figure as progressPercent: 1 finished / (3 − 1 skipped).
		expect(o.percent).toBe(progressPercent(ids, rec).percent);
		expect(o.percent).toBe(50);
		expect(o.next?.id).toBe('safety/c');
		expect(o.firstSkipped?.id).toBe('concepts/b');
		expect(o.any).toBe(true);
	});
	it('a passed checkpoint alone counts as progress; nothing left means no next', () => {
		const rec = { ...emptyRecord(), checkpoints: { 'safety/c#c2': { state: 'passed' as const, attempts: 1 } } };
		expect(overall(catalog, rec).any).toBe(true);
		expect(overall(catalog, rec).percent).toBe(0);
		const done: ProgressRecord = {
			...emptyRecord(),
			lessons: {
				'concepts/a': { state: 'finished', at },
				'concepts/b': { state: 'finished', at },
				'safety/c': { state: 'skipped', at },
			},
		};
		const o = overall(catalog, done);
		expect(o.next).toBeNull();
		// The continue button offers the first skipped lesson (spec S04 "Progress display").
		expect(o.firstSkipped?.id).toBe('safety/c');
		expect(o.percent).toBe(100);
		expect(overall([], emptyRecord()).percent).toBe(0);
	});
});
