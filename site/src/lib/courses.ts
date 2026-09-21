import { getCollection } from 'astro:content';
import { getLessons, type Lesson } from './lessons';

/**
 * A course plan (spec S11): the course file
 * `site/src/data/areas/<area>/courses/<course>.yaml` orders the lessons, flat
 * or in parts, and each lesson's plan is its own file under
 * `site/src/data/areas/<area>/lessons/`. A lesson is live when its page
 * exists. `scripts/check-data.mjs` checks the tree (`mise run data`); this
 * module only reads it.
 */
export type PlanStatus = 'planned' | 'live';

export interface Exercise {
	kind: 'do' | 'judge';
	brief: string;
}

export interface Assumed {
	objective: string;
	lesson?: string | undefined;
	section?: string | undefined;
}

export interface PlanEntry {
	id: string;
	title: string;
	description?: string | undefined;
	mode: 'tutorial' | 'explanation';
	covers: string;
	serves: string[];
	introduces: string[];
	assumes: Assumed[];
	after: string[];
	shorts: string[];
	/** The lesson's exercises: the one `exercise`, or the `exercises` list. */
	exercises: Exercise[];
	sources: string[];
	issue?: number | undefined;
	minutes: number;
	notes?: string | undefined;
	/** The title of the part the lesson sits in, when the course has parts. */
	part?: string | undefined;
	/** `live` when the lesson page exists. */
	status: PlanStatus;
	/** The lesson page, when one exists. */
	lesson?: Lesson | undefined;
}

export interface CoursePart {
	title: string;
	notes?: string | undefined;
	lessons: PlanEntry[];
}

export interface CoursePlan {
	id: string;
	area: string;
	planIssue?: number | undefined;
	notes?: string | undefined;
	/** Set when the course file uses `parts`. */
	parts?: CoursePart[] | undefined;
	/** Every entry in course order, parts flattened. */
	entries: PlanEntry[];
}

type LessonPlanRecord = Awaited<ReturnType<typeof getCollection<'lessonPlans'>>>[number]['data'];

function toEntry(plan: LessonPlanRecord, lessons: Lesson[], part?: string): PlanEntry {
	const lesson = lessons.find((l) => l.id === plan.id);
	return {
		id: plan.id,
		title: plan.title,
		description: plan.description,
		mode: plan.mode,
		covers: plan.covers,
		serves: plan.serves,
		introduces: plan.introduces,
		assumes: plan.assumes,
		after: plan.after,
		shorts: plan.shorts,
		exercises: plan.exercises ?? (plan.exercise ? [plan.exercise] : []),
		sources: plan.sources,
		issue: plan.issue,
		minutes: plan.minutes,
		notes: plan.notes,
		part,
		status: lesson ? 'live' : 'planned',
		lesson,
	};
}

/** The course of an area (its id equals the area id, spec S01 "Identifiers"), with its lessons resolved. */
export async function getCourse(area: string): Promise<CoursePlan> {
	const course = (await getCollection('courses')).find((c) => c.data.id === area && c.data.area === area);
	if (!course) throw new Error(`No course plan for area ${area} (site/src/data/areas/${area}/courses/${area}.yaml)`);
	const plans = new Map((await getCollection('lessonPlans')).map((p) => [p.data.id, p.data]));
	const lessons = await getLessons(area);
	const resolve = (id: string, part?: string) => {
		const plan = plans.get(id);
		if (!plan)
			throw new Error(`Course ${area} lists ${id}, but site/src/data/areas/${area}/lessons/ has no file for it`);
		return toEntry(plan, lessons, part);
	};
	const parts = course.data.parts?.map((p) => ({
		title: p.title,
		notes: p.notes,
		lessons: p.lessons.map((id) => resolve(id, p.title)),
	}));
	const entries = parts ? parts.flatMap((p) => p.lessons) : (course.data.lessons ?? []).map((id) => resolve(id));
	return { id: course.data.id, area, planIssue: course.data['plan-issue'], notes: course.data.notes, parts, entries };
}

/** Every plan entry of an area, in course order. Throws when the area has no course file. */
export async function getCoursePlan(area: string): Promise<PlanEntry[]> {
	return (await getCourse(area)).entries;
}

/** Every plan entry across areas, courses in collection order. */
export async function getAllCoursePlans(): Promise<PlanEntry[]> {
	const courses = await getCollection('courses');
	const out: PlanEntry[] = [];
	for (const c of courses) out.push(...(await getCourse(c.data.area)).entries);
	return out;
}

/** True when the entry renders as a lesson the learner can open. */
export function isLive(e: PlanEntry): e is PlanEntry & { lesson: Lesson } {
	return e.status === 'live' && Boolean(e.lesson);
}

/**
 * The lesson ids an entry sits below in the graph, within the area: the
 * `assumes` of a live page, or the plan's `after` for a coming one.
 */
export function dependenciesOf(e: PlanEntry, area: string): string[] {
	const ids = isLive(e)
		? (e.lesson.data.assumes ?? []).map((a) => a.lesson).filter((l): l is string => typeof l === 'string')
		: e.after;
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
