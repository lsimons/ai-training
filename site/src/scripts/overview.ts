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

/** The one progress figure every surface shows (spec S04 "Progress display"). */
export interface Percent {
	finished: number;
	skipped: number;
	/** Finished lessons over all lessons minus skipped ones; 0 when nothing is left to count. */
	percent: number;
}

/**
 * Finished / (all − skipped), lessons only, rounded to a whole number. Checkpoints are
 * not units: a lesson is `finished` only once every checkpoint is passed or skipped.
 */
export function progressPercent(lessonIds: readonly string[], rec: ProgressRecord): Percent {
	let finished = 0;
	let skipped = 0;
	for (const id of lessonIds) {
		const s = rec.lessons[id]?.state;
		if (s === 'finished') finished++;
		else if (s === 'skipped') skipped++;
	}
	const counted = lessonIds.length - skipped;
	return { finished, skipped, percent: counted ? Math.round((finished / counted) * 100) : 0 };
}

export interface Overall extends Percent {
	lessons: number;
	started: number;
	checkpoints: number;
	passed: number;
	/** The first lesson in path order that is not finished or skipped, if any. */
	next: CatalogLesson | null;
	/** The first skipped lesson in path order, if any; the continue button's target once `next` is null. */
	firstSkipped: CatalogLesson | null;
	/** Whether the learner has any progress at all. */
	any: boolean;
}

export function overall(catalog: CatalogCourse[], rec: ProgressRecord): Overall {
	const all = catalog.flatMap((c) => c.lessons);
	const { finished, skipped, percent } = progressPercent(
		all.map((l) => l.id),
		rec,
	);
	let started = 0;
	let checkpoints = 0;
	let passed = 0;
	for (const l of all) {
		if (rec.lessons[l.id]?.state === 'read') started++;
		checkpoints += l.checkpoints.length;
		passed += l.checkpoints.filter((c) => rec.checkpoints[`${l.id}#${c.id}`]?.state === 'passed').length;
	}
	const next = all.find((l) => !['finished', 'skipped'].includes(rec.lessons[l.id]?.state ?? '')) ?? null;
	const firstSkipped = all.find((l) => rec.lessons[l.id]?.state === 'skipped') ?? null;
	return {
		lessons: all.length,
		finished,
		skipped,
		started,
		checkpoints,
		passed,
		percent,
		next,
		firstSkipped,
		any: finished + skipped + started > 0 || passed > 0,
	};
}
