/**
 * The learner's reference block of a topic page (`TopicReference.astro`,
 * spec S02 "Learner's reference"): reveals the build-rendered block of every
 * finished lesson and keeps the unlock note on the others, and redraws on
 * every progress change. `isUnlocked` in `reference.ts` decides. No DOM
 * access at import time, so it runs under Node in the unit tests with a
 * `happy-dom` document.
 */
import * as progress from './progress';
import { isUnlocked } from './reference';
import { requiredElement } from './required-element';

/** The selector of the element the component renders. */
export const ROOT_SELECTOR = '[data-reference]';

/**
 * Draws the lock state of every lesson section under the component in `root`
 * and redraws it on every progress event. Returns false, and changes nothing,
 * when the component is missing (another page). A section without the
 * locked note or the body the component always renders throws.
 */
export function mountTopicReference(root: ParentNode): boolean {
	const el = root.querySelector<HTMLElement>(ROOT_SELECTOR);
	if (!el) return false;
	const sections = [...el.querySelectorAll<HTMLElement>('[data-reference-lesson]')].map((section) => ({
		section,
		locked: requiredElement(section, '[data-reference-locked]'),
		body: requiredElement(section, '[data-reference-body]'),
	}));
	const draw = () => {
		const record = progress.load();
		for (const { section, locked, body } of sections) {
			const unlocked = isUnlocked(record, section.dataset.referenceLesson ?? '');
			section.dataset.unlocked = String(unlocked);
			locked.hidden = unlocked;
			body.hidden = !unlocked;
		}
	};
	draw();
	document.addEventListener(progress.EVENT, draw);
	return true;
}
