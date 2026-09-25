import { continueLink, overallText } from '@scripts/overall-progress-model';
import type { Overall } from '@scripts/overview';
import { describe, expect, it } from 'vitest';

const a = { id: 'concepts/a', title: 'Lesson A', checkpoints: [] };
const b = { id: 'concepts/b', title: 'Lesson B', checkpoints: [] };
const base: Overall = {
	lessons: 2,
	finished: 0,
	skipped: 0,
	started: 0,
	checkpoints: 5,
	passed: 0,
	percent: 0,
	next: a,
	firstSkipped: null,
	any: false,
};

describe('overallText', () => {
	it('gives the totals before any progress', () => {
		expect(overallText(base)).toBe('2 lessons and 5 checkpoints across six courses. Nothing started yet.');
	});
	it('counts finished and passed, and adds the in-progress count only when there is one', () => {
		expect(overallText({ ...base, any: true, finished: 1, passed: 2 })).toBe(
			'1 of 2 lessons finished; 2 of 5 checkpoints passed.',
		);
		expect(overallText({ ...base, any: true, started: 1 })).toBe(
			'0 of 2 lessons finished, 1 in progress; 0 of 5 checkpoints passed.',
		);
	});
});

describe('continueLink', () => {
	it('keeps the rendered link without progress', () => {
		expect(continueLink(base, '/ai-training')).toBeNull();
	});
	it('points at the next unfinished lesson', () => {
		expect(continueLink({ ...base, any: true, next: b }, '/ai-training')).toEqual({
			href: '/ai-training/concepts/b/',
			text: 'Continue with: Lesson B',
		});
	});
	it('with everything skipped, continues with the first skipped lesson', () => {
		expect(continueLink({ ...base, any: true, next: null, firstSkipped: a, skipped: 2 }, '')).toEqual({
			href: '/concepts/a/',
			text: 'Continue with: Lesson A',
		});
	});
	it('with the rest finished, names the skipped count', () => {
		expect(continueLink({ ...base, any: true, next: null, firstSkipped: a, finished: 1, skipped: 1 }, '')).toEqual({
			href: '/concepts/a/',
			text: 'All lessons finished, 1 skipped',
		});
	});
	it('with every lesson finished, points at the topic map', () => {
		expect(continueLink({ ...base, any: true, next: null, finished: 2 }, '')).toEqual({
			href: '/map/',
			text: 'All lessons finished: see the topic map',
		});
	});
});
