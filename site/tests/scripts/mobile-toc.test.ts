// @vitest-environment happy-dom
import { GROUPS_SELECTOR, mountMobileTocGroups } from '@scripts/mobile-toc';
import { describe, expect, it } from 'vitest';

const dropdown = `
<mobile-starlight-toc>
  <nav><details id="starlight__mobile-toc" open>
    <summary>On this page</summary>
    <div class="dropdown"><ul><li><a href="#first">First</a></li></ul></div>
  </details></nav>
</mobile-starlight-toc>`;
const groups = `
<div class="lesson-toc-mobile" data-lesson-toc-mobile hidden>
  <div role="group"><h2>Checkpoints</h2><ul><li><a href="#cp">Checkpoint</a></li></ul></div>
</div>`;

function page(html: string): HTMLElement {
	const root = document.createElement('div');
	root.innerHTML = html;
	return root;
}

describe('mountMobileTocGroups', () => {
	it('moves the groups into the dropdown panel, after the headings, and unhides them', () => {
		const root = page(dropdown + groups);
		expect(mountMobileTocGroups(root)).toBe(true);
		const panel = root.querySelector('.dropdown');
		const moved = panel?.querySelector(GROUPS_SELECTOR) as HTMLElement;
		expect(moved).toBeTruthy();
		expect(moved.hidden).toBe(false);
		expect(panel?.lastElementChild).toBe(moved);
		expect(root.querySelectorAll(GROUPS_SELECTOR)).toHaveLength(1);
	});
	it('closes the dropdown when a group entry is clicked', () => {
		const root = page(dropdown + groups);
		mountMobileTocGroups(root);
		const details = root.querySelector('details') as HTMLDetailsElement;
		expect(details.open).toBe(true);
		(root.querySelector('a[href="#cp"]') as HTMLAnchorElement).click();
		expect(details.open).toBe(false);
	});
	it('leaves a mounted page as it is on a second call, and binds no second click handler', () => {
		const root = page(dropdown + groups);
		mountMobileTocGroups(root);
		const details = root.querySelector('details') as HTMLDetailsElement;
		expect(mountMobileTocGroups(root)).toBe(true);
		expect(root.querySelectorAll(GROUPS_SELECTOR)).toHaveLength(1);
		expect(root.querySelector('.dropdown')?.lastElementChild).toBe(root.querySelector(GROUPS_SELECTOR));
		// Each handler sets `open`, so the number of assignments per click is the number of handlers.
		let closes = 0;
		Object.defineProperty(details, 'open', {
			set: () => {
				closes++;
			},
			get: () => true,
		});
		(root.querySelector('a[href="#cp"]') as HTMLAnchorElement).click();
		expect(closes).toBe(1);
	});
	it('does nothing without groups, or without the dropdown', () => {
		expect(mountMobileTocGroups(page(dropdown))).toBe(false);
		const root = page(groups);
		expect(mountMobileTocGroups(root)).toBe(false);
		expect((root.querySelector(GROUPS_SELECTOR) as HTMLElement).hidden).toBe(true);
	});
});
