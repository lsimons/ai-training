/** Overall progress figures derived from the catalog and the progress record. */
import type { ProgressRecord } from './progress';

/** Mirrors `lib/catalog.ts` (that module imports astro:content, which client scripts cannot). */
export interface CatalogCheckpoint {
	id: string;
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

export interface Overall {
	lessons: number;
	finished: number;
	skipped: number;
	started: number;
	checkpoints: number;
	passed: number;
	/** Lessons finished or skipped, plus checkpoints passed, over all lessons and checkpoints. */
	percent: number;
	/** The first lesson in path order that is not finished or skipped, if any lesson has been touched. */
	next: CatalogLesson | null;
	/** Whether the learner has any progress at all. */
	any: boolean;
}

export function overall(catalog: CatalogCourse[], rec: ProgressRecord): Overall {
	const all = catalog.flatMap((c) => c.lessons);
	let finished = 0,
		skipped = 0,
		started = 0,
		checkpoints = 0,
		passed = 0;
	for (const l of all) {
		const s = rec.lessons[l.id]?.state;
		if (s === 'finished') finished++;
		else if (s === 'skipped') skipped++;
		else if (s === 'read') started++;
		checkpoints += l.checkpoints.length;
		passed += l.checkpoints.filter((c) => rec.checkpoints[`${l.id}#${c.id}`]?.state === 'passed').length;
	}
	const units = all.length + checkpoints;
	const done = finished + skipped + passed;
	const next = all.find((l) => !['finished', 'skipped'].includes(rec.lessons[l.id]?.state ?? '')) ?? null;
	return {
		lessons: all.length,
		finished,
		skipped,
		started,
		checkpoints,
		passed,
		percent: units ? Math.round((done / units) * 100) : 0,
		next,
		any: finished + skipped + started > 0 || passed > 0,
	};
}
