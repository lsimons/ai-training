import { getCollection } from 'astro:content';
import { getLessons, type Lesson } from './lessons';

/**
 * The course plan of an area (site/src/data/courses/<area>.yaml, spec S02
 * "Storage") joined with the lesson pages that exist. `scripts/check-courses.mjs`
 * checks that the two agree (`mise run courses`); this module only reads them.
 */
export type PlanStatus = 'planned' | 'drafting' | 'live';

export interface PlanEntry {
	id: string;
	title: string;
	covers: string;
	serves: string[];
	status: PlanStatus;
	issue?: number;
	minutes: number;
	after: string[];
	/** The lesson page, when one exists. */
	lesson?: Lesson;
}

/** Every plan entry of an area, in plan order. Throws when the area has no plan file. */
export async function getCoursePlan(area: string): Promise<PlanEntry[]> {
	const plan = (await getCollection('courses')).find((c) => c.data.area === area);
	if (!plan) throw new Error(`No course plan for area ${area} (site/src/data/courses/${area}.yaml)`);
	const lessons = await getLessons(area);
	return plan.data.lessons.map((e) => ({ ...e, lesson: lessons.find((l) => l.id === e.id) }));
}

/** Every plan entry across areas. */
export async function getAllCoursePlans(): Promise<PlanEntry[]> {
	const plans = await getCollection('courses');
	const lessons = await getLessons();
	return plans.flatMap((p) => p.data.lessons.map((e) => ({ ...e, lesson: lessons.find((l) => l.id === e.id) })));
}

/** True when the entry renders as a lesson the learner can open. */
export function isLive(e: PlanEntry): e is PlanEntry & { lesson: Lesson } {
	return e.status === 'live' && Boolean(e.lesson);
}

/**
 * The lesson ids an entry sits below in the graph, within the area: the
 * frontmatter `assumes` of a live page, or the plan's `after` for a coming one.
 */
export function dependenciesOf(e: PlanEntry, area: string): string[] {
	const ids = isLive(e) ? (e.lesson.data.assumes ?? []).map((a) => a.lesson) : e.after;
	return [...new Set(ids.filter((id) => id.startsWith(`${area}/`) && id !== e.id))];
}

/**
 * Levels for the lesson graph (spec S02 "Course page as lesson graph"): an
 * entry sits one level below the deepest entry it depends on, within the course.
 */
export function planLevels(entries: PlanEntry[], area: string): Map<string, number> {
	const byId = new Map(entries.map((e) => [e.id, e]));
	const level = new Map<string, number>();
	const visit = (e: PlanEntry, seen: Set<string>): number => {
		if (level.has(e.id)) return level.get(e.id)!;
		if (seen.has(e.id)) return 0;
		seen.add(e.id);
		const deps = dependenciesOf(e, area).filter((id) => byId.has(id));
		const depth = deps.length ? Math.max(...deps.map((id) => visit(byId.get(id)!, seen))) + 1 : 0;
		level.set(e.id, depth);
		return depth;
	};
	for (const e of entries) visit(e, new Set());
	return level;
}
