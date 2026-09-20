import { type CatalogCourse, overall } from '@scripts/overview';
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

describe('overall', () => {
	it('is zero with no progress and points at the first lesson', () => {
		const o = overall(catalog, emptyRecord());
		expect(o).toMatchObject({ lessons: 3, finished: 0, skipped: 0, started: 0, checkpoints: 3, passed: 0, percent: 0 });
		expect(o.next?.id).toBe('concepts/a');
		expect(o.any).toBe(false);
	});
	it('counts states and passed checkpoints, and skips to the next open lesson', () => {
		const rec: ProgressRecord = {
			...emptyRecord(),
			lessons: {
				'concepts/a': { state: 'finished', at: '2026-01-01' },
				'concepts/b': { state: 'skipped', at: '2026-01-01' },
				'safety/c': { state: 'read', at: '2026-01-01' },
			},
			checkpoints: {
				'concepts/a#c1': { state: 'passed', attempts: 1 },
				'safety/c#c1': { state: 'attempted', attempts: 2 },
			},
		};
		const o = overall(catalog, rec);
		expect(o).toMatchObject({ finished: 1, skipped: 1, started: 1, passed: 1 });
		// 3 lessons + 3 checkpoints = 6 units; finished + skipped + passed = 3.
		expect(o.percent).toBe(50);
		expect(o.next?.id).toBe('safety/c');
		expect(o.any).toBe(true);
	});
	it('a passed checkpoint alone counts as progress; nothing left means no next', () => {
		const rec = { ...emptyRecord(), checkpoints: { 'safety/c#c2': { state: 'passed' as const, attempts: 1 } } };
		expect(overall(catalog, rec).any).toBe(true);
		const done: ProgressRecord = {
			...emptyRecord(),
			lessons: {
				'concepts/a': { state: 'finished', at: '2026-01-01' },
				'concepts/b': { state: 'finished', at: '2026-01-01' },
				'safety/c': { state: 'skipped', at: '2026-01-01' },
			},
		};
		expect(overall(catalog, done).next).toBeNull();
		expect(overall([], emptyRecord()).percent).toBe(0);
	});
});
