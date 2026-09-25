/**
 * The copy buttons of the "Open in tutor" block (`lesson/TutorBlock.astro`,
 * spec S08 "Lesson page block"). A click writes the button's `data-copy`
 * text to the clipboard and shows `Copied`, or `Select and copy` when the
 * browser refuses, then restores the label. No DOM access at import time, so
 * it runs under Node in the unit tests with a `happy-dom` document.
 */
import { requiredData } from './required-element';

/** The selector of the copy buttons inside the block. */
export const COPY_SELECTOR = '[data-tutor-block] .tutor-copy';

/** How long the button shows its result before the label comes back, in milliseconds. */
export const RESTORE_MS = 1500;

/** Wires every copy button under `root`. Returns the number of buttons, zero on a page without the block. */
export function mountTutorBlock(root: ParentNode = document): number {
	const buttons = root.querySelectorAll<HTMLButtonElement>(COPY_SELECTOR);
	for (const button of buttons) {
		const text = requiredData(button, 'copy');
		// Read once, so a second click before the restore doesn't take `Copied` as the label.
		const label = button.textContent;
		button.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(text);
				button.textContent = 'Copied';
			} catch {
				button.textContent = 'Select and copy';
			}
			window.setTimeout(() => {
				button.textContent = label;
			}, RESTORE_MS);
		});
	}
	return buttons.length;
}
