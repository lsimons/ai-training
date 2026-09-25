/**
 * The due review count next to each course link in the sidebar
 * (`overrides/Sidebar.astro`, spec S05 "Where reviews surface"). The sidebar
 * is static at build time, so the count is drawn from the progress record
 * and redrawn on the progress event. A course with nothing due has no count
 * element. The counts are `dueByCourse` in `due-counts.ts`. No DOM access at
 * import time, so it runs under Node in the unit tests with a `happy-dom`
 * document.
 */
import { dueByCourse, dueCountLabel } from './due-counts';
import * as progress from './progress';

/** The selector of the JSON script element that holds the course list. */
export const COURSES_SELECTOR = '[data-sidebar-courses]';

interface Course {
	area: string;
	title: string;
}

function drawCount(area: string, link: HTMLAnchorElement, n: number): void {
	let count = link.querySelector<HTMLElement>('[data-due-count]');
	if (n === 0) {
		count?.remove();
		return;
	}
	if (!count) {
		count = document.createElement('span');
		count.className = 'due-count not-content';
		count.dataset.dueCount = area;
		link.appendChild(count);
	}
	const label = document.createElement('span');
	label.className = 'sr-only';
	label.textContent = dueCountLabel(n);
	count.replaceChildren(String(n), label);
}

/**
 * Draws the counts on the course links under `root` and redraws them on
 * every progress event. `base` is the site's base path. Returns the number of
 * course links found: zero when the course list or the links are missing.
 */
export function mountSidebarDueCounts(root: ParentNode, base: string = import.meta.env.BASE_URL): number {
	const prefix = base.replace(/\/$/, '');
	const courses: Course[] = JSON.parse(root.querySelector(COURSES_SELECTOR)?.textContent || '[]');
	const links = new Map<string, HTMLAnchorElement>();
	for (const c of courses) {
		const link = root.querySelector<HTMLAnchorElement>(`.sidebar-content a[href="${prefix}/${c.area}/"]`);
		if (link) links.set(c.area, link);
	}
	const draw = () => {
		const due = new Map(dueByCourse(courses, progress.load(), progress.today()).map((c) => [c.area, c.due]));
		for (const [area, link] of links) drawCount(area, link, due.get(area) ?? 0);
	};
	draw();
	document.addEventListener(progress.EVENT, draw);
	return links.size;
}
