import { emptyRecord, type ProgressRecord } from '@scripts/progress-model';
import { finishedByArea, isUnlocked, type ReferenceArea } from '@scripts/reference';
import { describe, expect, it } from 'vitest';

const catalog: ReferenceArea[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [{ id: 'concepts/a', title: 'A', topics: [{ id: 'concepts/t', name: 'T' }] }],
	},
	{
		area: 'safety',
		title: 'Safety',
		lessons: [
			{ id: 'safety/b', title: 'B', topics: [] },
			{ id: 'safety/c', title: 'C', topics: [] },
		],
	},
];

function record(lessons: Record<string, 'read' | 'finished' | 'skipped'>): ProgressRecord {
	const r = emptyRecord();
	for (const [id, state] of Object.entries(lessons)) r.lessons[id] = { state, at: '2026-09-20' };
	return r;
}

describe('isUnlocked', () => {
	it('is true only for a finished lesson: read and skipped do not unlock (spec S02)', () => {
		const r = record({ 'concepts/a': 'finished', 'safety/b': 'read', 'safety/c': 'skipped' });
		expect(isUnlocked(r, 'concepts/a')).toBe(true);
		expect(isUnlocked(r, 'safety/b')).toBe(false);
		expect(isUnlocked(r, 'safety/c')).toBe(false);
		expect(isUnlocked(r, 'nowhere/none')).toBe(false);
	});
});

describe('finishedByArea', () => {
	it('keeps only finished lessons and drops areas without one', () => {
		const r = record({ 'safety/c': 'finished', 'safety/b': 'skipped' });
		expect(finishedByArea(catalog, r)).toEqual([
			{ area: 'safety', title: 'Safety', lessons: [{ id: 'safety/c', title: 'C', topics: [] }] },
		]);
		expect(finishedByArea(catalog, emptyRecord())).toEqual([]);
	});
});
