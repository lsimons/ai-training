/** Overall progress figures derived from the catalog and the progress record, and the progress page's habit lines. */
import type { HabitEntry, ProgressRecord } from './progress';

/** Mirrors `lib/catalog.ts` (that module imports astro:content, which client scripts cannot). */
export interface CatalogCheckpoint {
	id: string;
	reviewable: boolean;
	revision: number;
}
export interface CatalogHabit {
	id: string;
	/** The habit text as inline HTML. */
	html: string;
}
export interface CatalogLesson {
	id: string;
	title: string;
	checkpoints: CatalogCheckpoint[];
	/** Absent in a catalog built before habits existed; read as none. */
	habits?: CatalogHabit[];
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

/** A habit line on the progress page (spec S07 "Where habits surface"): the text, the next date and the results so far. */
export interface HabitLine {
	/** Progress id, `<lesson id>#<habit id>`. */
	id: string;
	html: string;
	next: string;
	results: HabitEntry['history'][number]['result'][];
}

/**
 * The active habits of a lesson, in page order: those with an entry that has
 * not retired. A retired habit keeps its results on the lesson page and is
 * left out here.
 */
export function activeHabits(lesson: CatalogLesson, rec: ProgressRecord): HabitLine[] {
	const out: HabitLine[] = [];
	for (const h of lesson.habits ?? []) {
		const id = `${lesson.id}#${h.id}`;
		const entry = rec.habits[id];
		if (!entry || entry.next === null) continue;
		out.push({ id, html: h.html, next: entry.next, results: entry.history.map((t) => t.result) });
	}
	return out;
}

/** The schedule part of a habit line: "Next on 2026-09-27. So far: done, skipped." */
export function habitSummary(line: Pick<HabitLine, 'next' | 'results'>): string {
	const results = line.results.length ? `So far: ${line.results.join(', ')}.` : 'No result yet.';
	return `Next on ${line.next}. ${results}`;
}
