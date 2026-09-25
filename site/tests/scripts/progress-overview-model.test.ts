import { type CatalogCourse, checkpointTitle, knownIds, reviewDueLabel } from '@scripts/progress-overview-model';
import { describe, expect, it } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{
				id: 'concepts/a',
				title: 'A',
				checkpoints: [{ id: 'c1', reviewable: true, revision: 1 }],
				practice: ['p1'],
				habits: [{ id: 'h1', html: 'Say it.' }],
			},
		],
	},
	{ area: 'safety', title: 'Safety', lessons: [] },
];

describe('knownIds', () => {
	it('lists the progress ids of every record section the build knows', () => {
		expect(knownIds(catalog)).toEqual({
			lessons: ['concepts/a'],
			checkpoints: ['concepts/a#c1'],
			practice: ['concepts/a#p1'],
			habits: ['concepts/a#h1'],
		});
	});
});

describe('reviewDueLabel', () => {
	it('counts due items with the right plural, and says when none is due', () => {
		expect(reviewDueLabel(0)).toBe('Review: nothing due yet');
		expect(reviewDueLabel(1)).toBe('Review due: 1 item');
		expect(reviewDueLabel(3)).toBe('Review due: 3 items');
	});
});

describe('checkpointTitle', () => {
	it('names the state, or says the checkpoint was not attempted', () => {
		expect(checkpointTitle('c1', { state: 'passed', attempts: 1 })).toBe('c1: passed');
		expect(checkpointTitle('c1', undefined)).toBe('c1: not attempted');
	});
});
