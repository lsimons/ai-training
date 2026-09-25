/**
 * The lesson frame script of `overrides/MarkdownContent.astro`: binds every
 * checkpoint on a lesson page, marks the lesson read, runs the skills check
 * (spec S04 "Skills check"), shows the routing cards (spec S02
 * "Differentiation by routing") and drives the finish and skip buttons (spec
 * S04 "Lesson states"). The decisions are in `markdown-content-logic.ts`. No
 * DOM access at import time, so it runs under Node in the unit tests with a
 * `happy-dom` document.
 */
import { openSkillsCheck } from '@lib/skills-check';
import { countsForLesson, skillsCheckNote, skillsCheckOffer } from './checkpoint-logic';
import { bindAll, bindCheckpoint, copyForSkillsCheck, drawState } from './checkpoints';
import { finishView, openCount, routeView, skipView } from './markdown-content-logic';
import * as progress from './progress';

/** The selector of the lesson frame the override renders. */
export const LESSON_SELECTOR = '.lesson[data-lesson]';

const SKILLS_NOTE =
	'One checkpoint per objective this lesson teaches, one try each. A pass counts as if you answered it in the lesson, and the review schedule picks it up.';

interface SkillsItem {
	body: HTMLElement;
	copy: HTMLElement;
	progressId: string;
}

/** The progress ids of `els`, dropping an element without one. */
function progressIds(els: readonly HTMLElement[]): string[] {
	return els.flatMap((el) => (el.dataset.progressId ? [el.dataset.progressId] : []));
}

/**
 * The skills check copies, taken before `bindAll` so they carry no listeners,
 * no `data-bound` and no shuffle. A listed id without its checkpoint, or a
 * checkpoint without a progress id, is dropped.
 */
function skillsCheckItems(lesson: HTMLElement, card: HTMLElement): SkillsItem[] {
	return (card.dataset.items ?? '').split(' ').flatMap((id) => {
		const body = lesson.querySelector<HTMLElement>(`[data-checkpoint][id="${id}"]`);
		const progressId = body?.dataset.progressId;
		if (!body || !progressId) return [];
		return [{ body, copy: copyForSkillsCheck(body), progressId }];
	});
}

/**
 * Starts the lesson frame under `root`. Returns false, and changes nothing,
 * on a page without a lesson frame. `root` is the document on the site: the
 * sidebar tip's skip button is outside the frame.
 */
export function mountLesson(root: ParentNode): boolean {
	const lesson = root.querySelector<HTMLElement>(LESSON_SELECTOR);
	const id = lesson?.dataset.lesson;
	if (!lesson || !id) return false;
	// A plain `string` for the hoisted functions below, which do not see the narrowing above.
	const lessonId: string = id;

	const skillsCard = lesson.querySelector<HTMLElement>('[data-skills-check]');
	const skillsItems = skillsCard && progress.load().comfort === 'more' ? skillsCheckItems(lesson, skillsCard) : [];
	/** The skip rule against the record as it is now: a checkpoint passed in the body meanwhile is not asked. */
	const openSkillsItems = () => openSkillsCheck(skillsItems, progress.load().checkpoints);
	let skillsStarted = false;

	const behindCard = lesson.querySelector<HTMLElement>('[data-route=behind]');
	const aheadCard = lesson.querySelector<HTMLElement>('[data-route=ahead]');
	const finish = lesson.querySelector<HTMLButtonElement>('[data-finish]');
	const finishNote = lesson.querySelector<HTMLElement>('[data-finish-note]');
	// Two skip buttons: the recap's, and the sidebar tip's when the lesson has `covered-by` (#111).
	const skips = root.querySelectorAll<HTMLButtonElement>('[data-skip-lesson]');

	// Every checkpoint on the page is bound, the "More practice" ones included. Only the `first` ones
	// count toward finishing, the finish note and routing (spec S04 "Lesson states"). A hidden
	// `review` alternate has no `data-checkpoint`, so `bindAll` never sees it.
	const checkpoints = bindAll(lesson, {
		onResult: () => {
			route();
			drawLesson();
			if (!skillsStarted) offerSkillsCheck();
		},
	}).filter((el) => countsForLesson(el.dataset.phase));
	progress.markLessonRead(lessonId);

	function states(rec = progress.load()) {
		return checkpoints.map((el) => rec.checkpoints[el.dataset.progressId ?? '']);
	}

	/** Show the offer with the current open count, or hide the card when nothing is left to ask. */
	function offerSkillsCheck() {
		if (!skillsCard || skillsItems.length === 0) return;
		const open = openSkillsItems().length;
		skillsCard.hidden = open === 0;
		const start = skillsCard.querySelector<HTMLButtonElement>('[data-skills-start]');
		if (start) start.textContent = skillsCheckOffer(open);
	}

	function route() {
		const rec = progress.load();
		const view = routeView(states(rec), rec.comfort);
		if (behindCard) behindCard.hidden = view.behindHidden;
		if (aheadCard) aheadCard.hidden = view.aheadHidden;
	}

	function drawLesson() {
		const rec = progress.load();
		const entry = rec.lessons[lessonId];
		const view = finishView(entry, openCount(states(rec)));
		if (finish) {
			finish.disabled = view.disabled;
			finish.textContent = view.label;
		}
		if (finishNote) finishNote.textContent = view.note;
		const skip = skipView(entry);
		for (const button of skips) {
			button.disabled = skip.disabled;
			button.textContent = skip.label;
		}
	}

	const note = skillsCard?.querySelector<HTMLElement>('[data-skills-note]');
	const start = skillsCard?.querySelector<HTMLButtonElement>('[data-skills-start]');
	const dismiss = skillsCard?.querySelector<HTMLButtonElement>('[data-skills-dismiss]');
	const items = skillsCard?.querySelector<HTMLElement>('[data-skills-items]');
	if (skillsCard && skillsItems.length > 0 && note && start && dismiss && items) {
		note.textContent = SKILLS_NOTE;
		offerSkillsCheck();
		start.addEventListener('click', () => {
			const asked = openSkillsItems();
			if (asked.length === 0) {
				skillsCard.hidden = true;
				return;
			}
			skillsStarted = true;
			start.hidden = true;
			items.hidden = false;
			const total = asked.length;
			let answered = 0;
			let passed = 0;
			for (const { body, copy } of asked) {
				items.appendChild(copy);
				const reviewable = copy.dataset.reviewable === 'true';
				const revision = Number(copy.dataset.revision ?? progress.DEFAULT_REVISION);
				bindCheckpoint(copy, {
					// One write: the checkpoint result, and on a reviewable pass its review item.
					record: (id, ok) => progress.recordSkillsCheck(id, ok, reviewable ? { id, revision } : undefined),
					onResult: (el, ok) => {
						// One Check per item: the result is recorded, so lock the copy.
						el.querySelector<HTMLButtonElement>('.cp-check')?.setAttribute('disabled', 'true');
						const after = el.querySelector<HTMLElement>('.cp-after');
						if (after) after.hidden = false;
						drawState(body);
						route();
						drawLesson();
						answered++;
						if (ok) passed++;
						note.textContent = skillsCheckNote(answered, passed, total);
						if (answered === total) dismiss.textContent = 'Close';
					},
				});
			}
		});
		dismiss.addEventListener('click', () => {
			skillsCard.hidden = true;
		});
	}

	route();

	finish?.addEventListener('click', () => {
		if (openCount(states()) > 0) return;
		const reviewable = checkpoints
			.filter((el) => el.dataset.reviewable === 'true' && el.dataset.progressId)
			.map((el) => ({
				id: el.dataset.progressId ?? '',
				revision: Number(el.dataset.revision ?? progress.DEFAULT_REVISION),
			}));
		// The page's habits, `<lesson id>#<habit id>` as the Habit component emits them (spec S07).
		const habitIds = progressIds([...lesson.querySelectorAll<HTMLElement>('[data-habit]')]);
		progress.finishLesson(lessonId, reviewable, habitIds);
		drawLesson();
	});
	for (const button of skips) {
		button.addEventListener('click', () => {
			progress.skipLesson(lessonId);
			drawLesson();
		});
	}
	drawLesson();
	return true;
}
