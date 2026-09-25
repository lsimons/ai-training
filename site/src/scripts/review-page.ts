/**
 * The review page script (`pages/[area]/review.astro`, spec S05 "The review
 * page"). Items are the course's checkpoints that are due. Their markup is
 * fetched from the lesson pages at runtime and bound in review mode (Give Up,
 * stage pills, frequency). A due item may be asked through one of its
 * `review` alternates (spec S05 "Which checkpoint a review asks"). The
 * course's due habits show above the items (spec S07 "Where habits surface").
 * The decisions are in `review-page-logic.ts`. No DOM access at import time,
 * so it runs under Node in the unit tests with a `happy-dom` document.
 */
import { bindCheckpoint } from './checkpoints';
import { bindHabit } from './habits';
import * as progress from './progress';
import {
	type Ask,
	askFor,
	barWidth,
	type CatalogLesson,
	doneText,
	type HabitCard,
	habitCards,
	reviewableOf,
} from './review-page-logic';

/** The selector of the element the page renders. */
export const ROOT_SELECTOR = '.review[data-review]';

/** Fetches a lesson page as text. A parameter of `mountReviewPage` so tests pass their own pages. */
export type FetchText = (url: string) => Promise<string>;

const fetchText: FetchText = async (url) => (await fetch(url)).text();

/** The lesson page's habit card markup, built from the catalog text, for `bindHabit`. */
function habitCard(h: HabitCard): HTMLElement {
	const card = document.createElement('aside');
	card.className = 'habit';
	card.dataset.habit = '';
	card.dataset.progressId = h.progressId;
	const title = document.createElement('p');
	title.className = 'habit-title';
	title.textContent = h.title;
	const text = document.createElement('div');
	text.className = 'habit-text';
	text.innerHTML = h.html;
	const state = document.createElement('p');
	state.className = 'habit-status';
	state.dataset.habitStatus = '';
	state.setAttribute('role', 'status');
	const actions = document.createElement('div');
	actions.className = 'habit-actions';
	actions.dataset.habitActions = '';
	actions.hidden = true;
	for (const [cls, key, label] of [
		['habit-done', 'habitDone', 'Done'],
		['habit-skip', 'habitSkip', 'Skip'],
	] as const) {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = cls;
		btn.dataset[key] = '';
		btn.textContent = label;
		actions.appendChild(btn);
	}
	const results = document.createElement('ol');
	results.className = 'habit-results';
	results.dataset.habitResults = '';
	results.hidden = true;
	card.append(title, text, state, actions, results);
	return card;
}

/**
 * The section to ask for `ask` out of the fetched lesson page `doc`: the
 * item's own checkpoint, or the picked `review` alternate. An alternate is
 * hidden and marked `data-alternate` in the lesson, so the copy is shown,
 * marked `data-checkpoint`, keyed on the item's progress id (the result is
 * the item's) and given `data-served`, which the review result records. Its
 * lesson link points at the item's own checkpoint. When the picked alternate
 * is missing from the page, the item's own checkpoint is asked. `onServed`
 * is called with the alternate's progress id when one is used.
 */
function sectionFor(doc: Document, progressId: string, ask: Ask, onServed: (id: string) => void): HTMLElement | null {
	const alternate =
		ask.pick === ask.own
			? null
			: doc.querySelector<HTMLElement>(`[data-alternate][data-progress-id="${ask.lessonId}#${ask.pick}"]`);
	if (alternate) {
		onServed(`${ask.lessonId}#${ask.pick}`);
		const copy = document.importNode(alternate, true);
		copy.hidden = false;
		copy.removeAttribute('data-alternate');
		copy.dataset.checkpoint = '';
		copy.dataset.progressId = progressId;
		copy.dataset.served = ask.pick;
		const link = copy.querySelector<HTMLAnchorElement>('.cp-lesson-link');
		if (link) link.href = `${ask.href}#${ask.own}`;
		return copy;
	}
	const section = doc.querySelector<HTMLElement>(`[data-checkpoint][data-progress-id="${progressId}"]`);
	return section ? document.importNode(section, true) : null;
}

/**
 * Starts the review session under `root`. Returns a promise that settles once
 * the first item is shown (or the session is empty or done), or false, with
 * nothing changed, on a page without the review element or one of its parts.
 */
export function mountReviewPage(root: ParentNode, fetchPage: FetchText = fetchText): Promise<void> | false {
	const el = root.querySelector<HTMLElement>(ROOT_SELECTOR);
	const area = el?.dataset.review;
	const catalogJson = el?.dataset.catalog;
	const itemsEl = el?.querySelector<HTMLElement>('[data-items]');
	const statusEl = el?.querySelector<HTMLElement>('[data-status]');
	const barEl = el?.querySelector<HTMLElement>('[data-bar]');
	const habitsBlock = el?.querySelector<HTMLElement>('[data-habits]');
	if (!el || !area || catalogJson === undefined || !itemsEl || !statusEl || !barEl || !habitsBlock) return false;
	// Plain `HTMLElement`s for the hoisted functions below, which do not see the narrowing above.
	const items: HTMLElement = itemsEl;
	const status: HTMLElement = statusEl;
	const bar: HTMLElement = barEl;
	const catalog: CatalogLesson[] = JSON.parse(catalogJson);
	const backHref = el.querySelector<HTMLAnchorElement>('.review-actions a')?.href ?? '';

	/**
	 * Today's due habits of this course, each with Done and Skip. A result
	 * moves the habit on and removes its card, and the block hides once
	 * nothing is due (S07: "A course with no habits due shows nothing extra").
	 */
	const cards = habitCards(catalog, progress.dueHabits(progress.load(), `${area}/`)).map(habitCard);
	habitsBlock.replaceChildren(...cards);
	habitsBlock.hidden = cards.length === 0;
	for (const card of cards) {
		bindHabit(card, {
			onResult: (c) => {
				c.remove();
				habitsBlock.hidden = habitsBlock.querySelector('[data-habit]') === null;
			},
		});
	}

	// Items whose answer changed since they were scheduled restart at stage 1 (spec S05 "Content changes").
	progress.resetOutdatedReviews(reviewableOf(catalog));
	const due = progress.dueReviews(progress.load(), `${area}/`);
	const totalDue = progress.dueReviewIds(progress.load(), `${area}/`).length;
	let answered = 0;
	/** The alternates asked so far in this session, as progress ids: one session never asks one twice. */
	const servedThisSession = new Set<string>();

	async function fetchSection(progressId: string): Promise<HTMLElement | null> {
		const history = progress.load().reviews[progressId]?.history ?? [];
		const ask = askFor(catalog, progressId, history, servedThisSession);
		if (!ask) return null;
		const doc = new DOMParser().parseFromString(await fetchPage(ask.href), 'text/html');
		return sectionFor(doc, progressId, ask, (id) => servedThisSession.add(id));
	}

	function finish() {
		status.textContent = doneText(answered, totalDue - due.length);
		const btn = document.createElement('a');
		btn.href = backHref;
		btn.textContent = 'Finish review';
		btn.className = 'cp-check';
		items.appendChild(btn);
	}

	async function next(i: number): Promise<void> {
		bar.style.width = barWidth(i, due.length);
		const progressId = due[i];
		if (progressId === undefined) return finish();
		status.textContent = `Item ${i + 1} of ${due.length}`;
		const section = await fetchSection(progressId);
		if (!section) {
			// Orphaned item (content changed): drop it and move on.
			progress.update((r) => delete r.reviews[progressId]);
			return next(i + 1);
		}
		delete section.dataset.bound;
		section.querySelector<HTMLElement>('.cp-skip')?.remove();
		const giveUp = section.querySelector<HTMLElement>('.cp-giveup');
		if (giveUp) giveUp.hidden = false;
		// The author's standalone context (spec S03 "Checkpoints"): hidden in the lesson, shown here.
		const context = section.querySelector<HTMLElement>('.cp-context');
		if (context) context.hidden = false;
		items.replaceChildren(section);
		let done = false;
		bindCheckpoint(section, {
			review: true,
			onResult: () => {
				if (done) return;
				done = true;
				answered++;
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.textContent = 'Next item';
				btn.className = 'cp-check';
				btn.addEventListener('click', () => next(i + 1));
				section.querySelector('.cp-after')?.appendChild(btn);
				section.querySelector<HTMLButtonElement>('.cp-check')?.setAttribute('disabled', 'true');
			},
		});
	}

	if (!due.length) {
		items.innerHTML = '<div class="review-empty">Nothing due. Finish a lesson and come back tomorrow.</div>';
		bar.style.width = '100%';
		return Promise.resolve();
	}
	return next(0);
}
