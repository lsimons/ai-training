import {
	dependenciesOf,
	getAllCoursePlans,
	getCourse,
	getCoursePlan,
	isLive,
	type PlanEntry,
	planLevels,
} from '@lib/courses';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const entry = (over: Partial<PlanEntry> & { id: string }): PlanEntry => ({
	title: over.id,
	mode: 'tutorial',
	covers: 'x/t',
	serves: [],
	introduces: [],
	assumes: [],
	after: [],
	shorts: [],
	exercises: [],
	sources: [],
	status: 'planned',
	minutes: 10,
	...over,
});

describe('getCourse', () => {
	it('resolves the parts and the lesson files, in course order, with the page when one exists', async () => {
		const course = await getCourse('safety');
		expect(course.planIssue).toBe(31);
		expect(course.parts?.map((p) => [p.title, p.lessons.map((l) => l.id)])).toEqual([
			['Risk', ['safety/agent-risk', 'safety/deeper']],
			['Later', ['safety/coming']],
		]);
		expect(course.entries.map((e) => [e.id, e.part, e.status])).toEqual([
			['safety/agent-risk', 'Risk', 'live'],
			['safety/deeper', 'Risk', 'live'],
			['safety/coming', 'Later', 'planned'],
		]);
		expect(course.entries[0]?.lesson?.data.title).toBe('Why agent safety is different');
		expect(course.entries[2]?.lesson).toBeUndefined();
		expect(course.entries[2]?.issue).toBe(42);
	});
	it('reads a flat course without parts, and folds the one exercise or the exercises list into a list', async () => {
		const course = await getCourse('concepts');
		expect(course.parts).toBeUndefined();
		expect(course.entries.map((e) => e.id)).toEqual(['concepts/how-models-work']);
		expect(course.entries[0]?.exercises).toEqual([{ kind: 'do', brief: 'Do it.' }]);
		const safety = await getCourse('safety');
		expect(safety.entries[1]?.exercises.map((x) => x.kind)).toEqual(['do', 'judge']);
	});
	it('throws for an area without a course file, and for a listed lesson without a file', async () => {
		await expect(getCourse('using-agents')).rejects.toThrow(/No course plan for area using-agents/);
		const { mockContent, courses } = await import('./content');
		const broken = mockContent({
			courses: [
				{ id: 'concepts/courses/concepts', data: { id: 'concepts', area: 'concepts', lessons: ['concepts/nope'] } },
				...courses.slice(1),
			],
		});
		vi.doMock('astro:content', () => broken);
		vi.resetModules();
		const fresh = await import('@lib/courses');
		await expect(fresh.getCourse('concepts')).rejects.toThrow(/lists concepts\/nope, but .* has no file/);
		vi.doUnmock('astro:content');
		vi.resetModules();
	});
});

describe('getCoursePlan and getAllCoursePlans', () => {
	it('returns the entries of one course, or of every course', async () => {
		expect((await getCoursePlan('safety')).map((e) => e.id)).toEqual([
			'safety/agent-risk',
			'safety/deeper',
			'safety/coming',
		]);
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
		expect(isLive(entry({ id: 'x/a', status: 'planned', lesson: {} as Lesson }))).toBe(false);
	});
});

describe('dependenciesOf', () => {
	it('reads a live entry from its page assumes, within the area, and a coming entry from after', async () => {
		const plan = await getCoursePlan('safety');
		expect(dependenciesOf(plan[0]!, 'safety')).toEqual([]);
		// deeper also assumes concepts/how-models-work, outside the area.
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
