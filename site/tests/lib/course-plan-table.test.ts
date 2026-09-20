import { afterTitles, idTail, issueUrl, objectiveCells, planSummary } from '@lib/course-plan-table';
import type { PlanEntry } from '@lib/courses';
import { describe, expect, it } from 'vitest';

const entry = (over: Partial<PlanEntry> & { id: string }): PlanEntry => ({
	title: over.id,
	covers: 'x/t',
	serves: [],
	status: 'planned',
	minutes: 10,
	after: [],
	...over,
});

const competencies = [
	{ id: 'safety/handles-data-safely', objectives: [{ id: 'safety/handles-data-safely/decides-what-to-share' }] },
	{ id: 'concepts/explains-models', objectives: [{ id: 'o1' }] },
];

describe('idTail', () => {
	it('returns the part after the last slash, or the whole id', () => {
		expect(idTail('safety/handles-data-safely/decides-what-to-share')).toBe('decides-what-to-share');
		expect(idTail('o1')).toBe('o1');
	});
});

describe('objectiveCells', () => {
	it('links an objective to the anchor on its competency page, in serves order', () => {
		expect(objectiveCells(['o1', 'safety/handles-data-safely/decides-what-to-share'], competencies)).toEqual([
			{ id: 'o1', tail: 'o1', path: '/competencies/concepts/explains-models/#o1' },
			{
				id: 'safety/handles-data-safely/decides-what-to-share',
				tail: 'decides-what-to-share',
				path: '/competencies/safety/handles-data-safely/#decides-what-to-share',
			},
		]);
	});
	it('leaves an objective no competency holds without a path', () => {
		expect(objectiveCells(['safety/other/unknown'], competencies)).toEqual([
			{ id: 'safety/other/unknown', tail: 'unknown' },
		]);
	});
});

describe('afterTitles', () => {
	it('resolves ids to the titles in the plan and keeps an unknown id', () => {
		const plan = [entry({ id: 'a/one', title: 'One' }), entry({ id: 'a/two', title: 'Two', after: ['a/one', 'a/x'] })];
		expect(afterTitles(plan[1]!.after, plan)).toEqual(['One', 'a/x']);
		expect(afterTitles([], plan)).toEqual([]);
	});
});

describe('planSummary', () => {
	it('counts entries and live entries', () => {
		expect(planSummary([entry({ id: 'a/one', status: 'live' }), entry({ id: 'a/two' })])).toBe(
			'Lesson plan (2 lessons, 1 live)',
		);
		expect(planSummary([entry({ id: 'a/one' })])).toBe('Lesson plan (1 lesson, 0 live)');
	});
});

describe('issueUrl', () => {
	it('builds the GitHub URL, or nothing without an issue', () => {
		expect(issueUrl(42)).toBe('https://github.com/lsimons/ai-training/issues/42');
		expect(issueUrl(undefined)).toBeUndefined();
	});
});
