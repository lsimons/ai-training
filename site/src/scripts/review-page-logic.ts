/**
 * The review page (`pages/[area]/review.astro`, spec S05 "The review page"),
 * the pure part: the catalog the page embeds, which checkpoint a due item
 * asks, which habit cards show, and the status texts. `review-page.ts` reads
 * the record, fetches the lesson pages and calls these. No DOM.
 */
import { type ReviewableCheckpoint, type ReviewTrace, servedCheckpoint } from './progress-model';

export interface CatalogCheckpoint {
	id: string;
	revision: number;
	/** The ids of the item's `review` alternates, in page order. */
	alternates: string[];
}

export interface CatalogLesson {
	id: string;
	title: string;
	href: string;
	checkpoints: CatalogCheckpoint[];
	/** The lesson's habits, text as inline HTML (spec S07). */
	habits: { id: string; html: string }[];
}

/** `<lesson id>#<item id>` split in two. The item part is `undefined` without a `#`. */
export function splitProgressId(progressId: string): { lessonId: string; itemId: string | undefined } {
	const [lessonId = '', itemId] = progressId.split('#');
	return { lessonId, itemId };
}

/** Every reviewable checkpoint of the catalog with its revision, for `resetOutdatedReviews` (spec S05 "Content changes"). */
export function reviewableOf(catalog: readonly CatalogLesson[]): ReviewableCheckpoint[] {
	return catalog.flatMap((l) => l.checkpoints.map((c) => ({ id: `${l.id}#${c.id}`, revision: c.revision })));
}

/** A due habit card: the habit's progress id, the title line and the habit text as inline HTML. */
export interface HabitCard {
	progressId: string;
	title: string;
	html: string;
}

/** The cards for the due habit ids, in order. An id not in the catalog is dropped. */
export function habitCards(catalog: readonly CatalogLesson[], due: readonly string[]): HabitCard[] {
	return due.flatMap((progressId) => {
		const { lessonId, itemId } = splitProgressId(progressId);
		const lesson = catalog.find((l) => l.id === lessonId);
		const habit = lesson?.habits.find((h) => h.id === itemId);
		if (!lesson || !habit) return [];
		return [{ progressId, title: `Habit from ${lesson.title}`, html: habit.html }];
	});
}

/** What to ask for a due item: the lesson page to fetch, the item's own checkpoint id and the id picked. */
export interface Ask {
	lessonId: string;
	href: string;
	own: string;
	pick: string;
}

/**
 * The checkpoint to ask for `progressId` (spec S05 "Which checkpoint a review
 * asks"): its own or one of its `review` alternates, as `servedCheckpoint`
 * picks from the item's `history`. `served` holds the progress ids of the
 * alternates already asked this session. `null` for an item the catalog does
 * not list.
 */
export function askFor(
	catalog: readonly CatalogLesson[],
	progressId: string,
	history: readonly ReviewTrace[],
	served: ReadonlySet<string>,
): Ask | null {
	const { lessonId, itemId } = splitProgressId(progressId);
	const lesson = catalog.find((l) => l.id === lessonId);
	const checkpoint = lesson?.checkpoints.find((c) => c.id === itemId);
	if (!lesson || !checkpoint || !itemId) return null;
	const taken = checkpoint.alternates.filter((a) => served.has(`${lessonId}#${a}`));
	return {
		lessonId,
		href: lesson.href,
		own: itemId,
		pick: servedCheckpoint(itemId, checkpoint.alternates, history, taken),
	};
}

/** The progress bar width before item `i` of `total`, as a CSS percentage. */
export function barWidth(i: number, total: number): string {
	return `${total ? Math.round((i / total) * 100) : 100}%`;
}

/** The status line at the end of a session. `remaining` counts the due items beyond the session cap. */
export function doneText(answered: number, remaining: number): string {
	return `Done: ${answered} item${answered === 1 ? '' : 's'} reviewed. ${Math.max(0, remaining)} more remain due.`;
}
