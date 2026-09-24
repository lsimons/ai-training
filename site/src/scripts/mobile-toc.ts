/**
 * The lesson groups of the mobile "On this page" dropdown (issue #287,
 * `overrides/MobileTableOfContents.astro`). Starlight renders the dropdown
 * as a `<details>` with a `.dropdown` panel and has no slot inside it, so the
 * override renders the "Checkpoints" and "Examples" groups hidden next to it,
 * and this module moves them into the panel. Starlight's own close-on-click
 * handler is attached when its custom element upgrades, which may run before
 * or after this, so the module attaches its own: a click on a group entry
 * closes the dropdown. No DOM access at import time, so it runs under Node
 * in the unit tests with a `happy-dom` document.
 */

/** The selector of the element the override renders the groups in. */
export const GROUPS_SELECTOR = '[data-lesson-toc-mobile]';

/**
 * Moves the groups element under `root` into the dropdown panel of the mobile
 * menu under `root`, unhides it, and closes the menu when one of its links is
 * clicked. Returns false, and changes nothing, when either element is missing
 * (a page without lesson groups, or a Starlight release with other markup).
 */
export function mountMobileTocGroups(root: ParentNode): boolean {
	const groups = root.querySelector<HTMLElement>(GROUPS_SELECTOR);
	const details = root.querySelector<HTMLDetailsElement>('mobile-starlight-toc details');
	const panel = details?.querySelector<HTMLElement>('.dropdown');
	if (!groups || !details || !panel) return false;
	panel.appendChild(groups);
	groups.hidden = false;
	for (const link of groups.querySelectorAll('a')) {
		link.addEventListener('click', () => {
			details.open = false;
		});
	}
	return true;
}
