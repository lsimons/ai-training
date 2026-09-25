/**
 * The DOM-free part of the settings page (spec S04 "learner" fields, spec S05
 * "frequency control"): the comfort toggle, the names shown for a review item
 * and the order of the schedule rows. `settings.ts` draws the page from these.
 */
import type { Comfort, ProgressRecord, ReviewEntry } from './progress-model';

/** Mirrors the part of `lib/catalog.ts` this page reads (that module imports astro:content). */
export interface CatalogCheckpoint {
	id: string;
	title: string;
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

/** The status line next to the comfort buttons. */
export function comfortNote(level: Comfort | undefined): string {
	if (level === 'less') return 'Set: less comfortable.';
	if (level === 'more') return 'Set: more comfortable.';
	return 'Not set.';
}

/** The level after a click on `clicked`: clicking the chosen level again unsets it. */
export function toggledComfort(current: Comfort | undefined, clicked: string | undefined): Comfort | undefined {
	if (clicked !== 'less' && clicked !== 'more') return undefined;
	return current === clicked ? undefined : clicked;
}

/** Human names for a progress id `<lesson>#<checkpoint>`; null when the build no longer knows it. */
export function describeItem(
	catalog: readonly CatalogCourse[],
	progressId: string,
): { lesson: CatalogLesson; checkpoint: CatalogCheckpoint } | null {
	const [lessonId, cpId] = progressId.split('#');
	const lesson = catalog.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
	const checkpoint = lesson?.checkpoints.find((c) => c.id === cpId);
	return lesson && checkpoint ? { lesson, checkpoint } : null;
}

/** The row label: checkpoint and lesson title when known, else the raw id. */
export function itemLabel(catalog: readonly CatalogCourse[], progressId: string): string {
	const known = describeItem(catalog, progressId);
	return known ? `${known.checkpoint.title} (${known.lesson.title})` : progressId;
}

/** The checkpoint's address under the site base: `concepts/a#c1` becomes `<base>/concepts/a/#c1`. */
export function itemHref(base: string, progressId: string): string {
	return `${base}/${progressId.replace('#', '/#')}`;
}

/** Scheduled review items, soonest due first; retired (`done`) items are left out. */
export function scheduleRows(rec: ProgressRecord): [string, ReviewEntry][] {
	return Object.entries(rec.reviews)
		.filter(([, item]) => item.stage !== 'done')
		.sort((a, b) => a[1].due.localeCompare(b[1].due));
}
