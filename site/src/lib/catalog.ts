import { AREAS } from './areas';
import { checkpointsOf, getLessons } from './lessons';

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

export async function buildCatalog(): Promise<CatalogCourse[]> {
	const lessons = await getLessons();
	return AREAS.map((a) => ({
		area: a.slug,
		title: a.name,
		lessons: lessons
			.filter((l) => l.id.startsWith(`${a.slug}/`))
			.map((l) => ({
				id: l.id,
				title: l.data.title,
				checkpoints: checkpointsOf(l).map((c) => ({
					id: c.id,
					title: c.title,
					reviewable: c.reviewable,
					revision: c.revision,
				})),
			})),
	}));
}
