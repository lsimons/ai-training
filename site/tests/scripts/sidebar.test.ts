// @vitest-environment happy-dom
/**
 * Mounts `sidebar.ts` on a hand-written copy of the sidebar markup
 * `overrides/Sidebar.astro` and Starlight render. The e2e suite checks the
 * two agree.
 */
import * as progress from '@scripts/progress';
import { emptyRecord, type ProgressRecord } from '@scripts/progress-model';
import { mountSidebarDueCounts } from '@scripts/sidebar';
import { beforeEach, describe, expect, it } from 'vitest';

const courses = [
	{ area: 'concepts', title: 'Concepts' },
	{ area: 'safety', title: 'Safety' },
	{ area: 'missing', title: 'Not in the sidebar' },
];

function page(list: string = JSON.stringify(courses)): void {
	document.body.innerHTML = `
		<nav class="sidebar-content">
			<a href="/ai-training/concepts/">Concepts</a>
			<a href="/ai-training/safety/">Safety</a>
		</nav>
		<script type="application/json" data-sidebar-courses>${list}</script>`;
}

/** A record with `n` review items due long ago in `area`. */
function withDue(r: ProgressRecord, area: string, n: number): ProgressRecord {
	for (let i = 0; i < n; i++) {
		r.reviews[`${area}/l#c${i}`] = { stage: 1, due: '2000-01-01', last: null, history: [] };
	}
	return r;
}

const count = (area: string) => document.querySelector(`[data-due-count="${area}"]`);

beforeEach(() => {
	localStorage.clear();
});

describe('mountSidebarDueCounts', () => {
	it('finds the course links that exist and draws no count when nothing is due', () => {
		page();
		expect(mountSidebarDueCounts(document)).toBe(2);
		expect(count('concepts')).toBeNull();
	});
	it('draws the count with its screen-reader label, and removes it once nothing is due', () => {
		page();
		mountSidebarDueCounts(document, '/ai-training/');
		progress.save(withDue(withDue(emptyRecord(), 'concepts', 3), 'safety', 1));
		expect(count('concepts')?.textContent).toBe('3 review items due');
		expect(count('safety')?.textContent).toBe('1 review item due');
		expect(count('concepts')?.className).toBe('due-count not-content');
		progress.save(withDue(emptyRecord(), 'concepts', 2));
		expect(count('concepts')?.textContent).toBe('2 review items due');
		expect(document.querySelectorAll('[data-due-count="concepts"]')).toHaveLength(1);
		expect(count('safety')).toBeNull();
	});
	it('throws without the course list, and finds nothing with an empty one', () => {
		document.body.innerHTML = '<nav class="sidebar-content"><a href="/ai-training/concepts/">C</a></nav>';
		expect(() => mountSidebarDueCounts(document)).toThrow('missing [data-sidebar-courses]');
		page('');
		expect(mountSidebarDueCounts(document)).toBe(0);
	});
});
