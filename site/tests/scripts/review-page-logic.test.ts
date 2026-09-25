import type { ReviewTrace } from '@scripts/progress-model';
import {
	askFor,
	barWidth,
	type CatalogLesson,
	doneText,
	habitCards,
	reviewableOf,
	splitProgressId,
} from '@scripts/review-page-logic';
import { describe, expect, it } from 'vitest';

const catalog: CatalogLesson[] = [
	{
		id: 'concepts/a',
		title: 'A',
		href: '/ai-training/concepts/a/',
		checkpoints: [
			{ id: 'q1', revision: 1, alternates: ['q1-alt'] },
			{ id: 'q2', revision: 3, alternates: [] },
		],
		habits: [{ id: 'h', html: 'Do <em>this</em>.' }],
	},
	{ id: 'concepts/b', title: 'B', href: '/ai-training/concepts/b/', checkpoints: [], habits: [] },
];

describe('splitProgressId', () => {
	it('splits on the hash, and has no item part without one', () => {
		expect(splitProgressId('concepts/a#q1')).toEqual({ lessonId: 'concepts/a', itemId: 'q1' });
		expect(splitProgressId('concepts/a')).toEqual({ lessonId: 'concepts/a', itemId: undefined });
	});
});

describe('reviewableOf', () => {
	it('lists every catalog checkpoint with its revision', () => {
		expect(reviewableOf(catalog)).toEqual([
			{ id: 'concepts/a#q1', revision: 1 },
			{ id: 'concepts/a#q2', revision: 3 },
		]);
	});
});

describe('habitCards', () => {
	it('builds a card per due habit the catalog knows, in order', () => {
		expect(habitCards(catalog, ['concepts/a#h', 'concepts/a#gone', 'other/x#h'])).toEqual([
			{ progressId: 'concepts/a#h', title: 'Habit from A', html: 'Do <em>this</em>.' },
		]);
	});
});

describe('askFor', () => {
	it('asks the first alternate never asked', () => {
		const history: ReviewTrace[] = [{ at: '2026-09-01', result: 'pass' }];
		expect(askFor(catalog, 'concepts/a#q1', history, new Set())).toEqual({
			lessonId: 'concepts/a',
			href: '/ai-training/concepts/a/',
			own: 'q1',
			pick: 'q1-alt',
		});
	});
	it('asks the own checkpoint when the alternate was served this session', () => {
		expect(askFor(catalog, 'concepts/a#q1', [], new Set(['concepts/a#q1-alt']))?.pick).toBe('q1');
	});
	it('asks the own checkpoint of an item without alternates', () => {
		expect(askFor(catalog, 'concepts/a#q2', [], new Set())?.pick).toBe('q2');
	});
	it('is null for an item the catalog does not list', () => {
		expect(askFor(catalog, 'concepts/a#gone', [], new Set())).toBeNull();
		expect(askFor(catalog, 'concepts/c#q1', [], new Set())).toBeNull();
		expect(askFor(catalog, 'concepts/a', [], new Set())).toBeNull();
	});
});

describe('barWidth', () => {
	it('is the share done, rounded, and full for an empty session', () => {
		expect(barWidth(1, 3)).toBe('33%');
		expect(barWidth(3, 3)).toBe('100%');
		expect(barWidth(0, 0)).toBe('100%');
	});
});

describe('doneText', () => {
	it('counts the answered items and the due ones left, never below zero', () => {
		expect(doneText(1, 0)).toBe('Done: 1 item reviewed. 0 more remain due.');
		expect(doneText(2, 5)).toBe('Done: 2 items reviewed. 5 more remain due.');
		expect(doneText(0, -1)).toBe('Done: 0 items reviewed. 0 more remain due.');
	});
});
