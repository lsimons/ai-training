import { dependenciesOf, getAllCoursePlans, getCoursePlan, isLive, type PlanEntry, planLevels } from '@lib/courses';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const entry = (over: Partial<PlanEntry> & { id: string }): PlanEntry => ({
	title: over.id,
	covers: 'x/t',
	serves: [],
	status: 'planned',
	minutes: 10,
	after: [],
	...over,
});

describe('getCoursePlan', () => {
	it('returns the plan entries in file order, joined with the lesson page when one exists', async () => {
		const plan = await getCoursePlan('safety');
		expect(plan.map((e) => e.id)).toEqual(['safety/agent-risk', 'safety/deeper', 'safety/coming']);
		expect(plan[0]?.lesson?.data.title).toBe('Why agent safety is different');
		expect(plan[2]?.lesson).toBeUndefined();
		expect(plan[2]?.issue).toBe(42);
	});
	it('throws for an area without a plan file', async () => {
		await expect(getCoursePlan('using-agents')).rejects.toThrow(/No course plan for area using-agents/);
	});
});

describe('getAllCoursePlans', () => {
	it('flattens every plan', async () => {
		const all = await getAllCoursePlans();
		expect(all.map((e) => e.id)).toEqual([
			'concepts/how-models-work',
			'safety/agent-risk',
			'safety/deeper',
			'safety/coming',
		]);
		expect(all.filter((e) => e.lesson)).toHaveLength(3);
	});
});

describe('isLive', () => {
	it('is true only for a live entry that has a page', async () => {
		const plan = await getCoursePlan('safety');
		expect(plan.map(isLive)).toEqual([true, true, false]);
		expect(isLive(entry({ id: 'x/a', status: 'live' }))).toBe(false);
		expect(isLive(entry({ id: 'x/a', status: 'drafting', lesson: {} as Lesson }))).toBe(false);
	});
});

describe('dependenciesOf', () => {
	it('reads a live entry from its page assumes, within the area, and a coming entry from after', async () => {
		const plan = await getCoursePlan('safety');
		expect(dependenciesOf(plan[0]!, 'safety')).toEqual([]);
		// deeper also assumes nowhere/none, outside the area.
		expect(dependenciesOf(plan[1]!, 'safety')).toEqual(['safety/agent-risk']);
		expect(dependenciesOf(plan[2]!, 'safety')).toEqual(['safety/deeper']);
	});
	it('drops a self reference, another area and repeats', () => {
		const e = entry({ id: 'x/a', after: ['x/a', 'x/b', 'y/c', 'x/b'] });
		expect(dependenciesOf(e, 'x')).toEqual(['x/b']);
	});
});

describe('planLevels', () => {
	it('puts an entry one level below the deepest entry it depends on', async () => {
		const plan = await getCoursePlan('safety');
		const levels = planLevels(plan, 'safety');
		expect(levels.get('safety/agent-risk')).toBe(0);
		expect(levels.get('safety/deeper')).toBe(1);
		expect(levels.get('safety/coming')).toBe(2);
	});
	it('ignores a dependency that is not in the plan', () => {
		const levels = planLevels([entry({ id: 'x/a', after: ['x/missing'] })], 'x');
		expect(levels.get('x/a')).toBe(0);
	});
	it('breaks a cycle instead of looping', () => {
		const a = entry({ id: 'x/a', after: ['x/b'] });
		const b = entry({ id: 'x/b', after: ['x/a'] });
		const levels = planLevels([a, b], 'x');
		// The entry visited first closes the cycle at 0, so b sits at 1 and a above it.
		expect(levels.get('x/b')).toBe(1);
		expect(levels.get('x/a')).toBe(2);
	});
});
