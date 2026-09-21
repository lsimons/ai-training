import { getAreas } from './areas';
import { getAllCoursePlans } from './courses';
import { checkpointsOf, getLessons, type Lesson } from './lessons';

/** The site's courses and lessons in path order, serializable for client scripts. */
export interface CatalogCheckpoint {
	id: string;
	title: string;
	reviewable: boolean;
	revision: number;
}
export interface CatalogLesson {
	id: string;
	title: string;
	checkpoints: CatalogCheckpoint[];
}
export interface CatalogCourse {
	area: string;
	title: string;
	lessons: CatalogLesson[];
}

/**
 * Path order (spec S04 "Progress display"): the order of the course plan
 * (site/src/data/areas/<area>/courses/<area>.yaml). A lesson page the plan
 * doesn't name goes after the planned ones, in id order, so it is never lost
 * from the catalog.
 */
export function orderByPlan(lessons: Lesson[], planIds: string[]): Lesson[] {
	const rank = new Map(planIds.map((id, i) => [id, i]));
	const position = (l: Lesson) => rank.get(l.id) ?? planIds.length;
	return [...lessons].sort((a, b) => position(a) - position(b) || a.id.localeCompare(b.id));
}

export async function buildCatalog(): Promise<CatalogCourse[]> {
	const lessons = await getLessons();
	const plans = await getAllCoursePlans();
	return (await getAreas()).map((a) => {
		const planIds = plans.filter((e) => e.id.startsWith(`${a.slug}/`)).map((e) => e.id);
		return {
			area: a.slug,
			title: a.name,
			lessons: orderByPlan(
				lessons.filter((l) => l.id.startsWith(`${a.slug}/`)),
				planIds,
			).map((l) => ({
				id: l.id,
				title: l.data.title,
				checkpoints: checkpointsOf(l).map((c) => ({
					id: c.id,
					title: c.title,
					reviewable: c.reviewable,
					revision: c.revision,
				})),
			})),
		};
	});
}
