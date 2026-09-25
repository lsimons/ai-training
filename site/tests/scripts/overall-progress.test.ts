// @vitest-environment happy-dom
/**
 * Binds `overall-progress.ts` to a hand-written copy of the markup
 * `OverallProgress.astro` renders. If the component's markup changes, the
 * fixture here changes with it, and the e2e suite checks that the two still
 * agree.
 */
import { mountOverallProgress } from '@scripts/overall-progress';
import type { CatalogCourse } from '@scripts/overview';
import * as progress from '@scripts/progress';
import { beforeEach, describe, expect, it } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{ id: 'concepts/a', title: 'Lesson A', checkpoints: [{ id: 'c1', reviewable: true, revision: 1 }] },
			{ id: 'concepts/b', title: 'Lesson B', checkpoints: [] },
		],
	},
];

function block(landing: boolean): string {
	return `
	<div data-overall data-landing="${landing}" data-catalog='${JSON.stringify(catalog)}' data-base="/ai-training/">
		<div data-bar aria-valuenow="0"><div></div></div>
		<strong data-percent>0%</strong>
		<span data-skipped hidden></span>
		${landing ? '' : '<p data-text>No progress yet.</p>'}
		<ul data-due-lines hidden></ul>
		<a data-continue href="/ai-training/concepts/a/">Start with: Lesson A</a>
	</div>`;
}

const all = <T extends HTMLElement = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
});

describe('mountOverallProgress', () => {
	it('binds nothing on a page without a block', () => {
		expect(mountOverallProgress()).toBe(0);
	});

	it('leaves the start link and shows the totals before any progress', () => {
		document.body.innerHTML = block(false);
		expect(mountOverallProgress()).toBe(1);
		expect(all('[data-text]')[0]?.textContent).toBe(
			'2 lessons and 1 checkpoints across six courses. Nothing started yet.',
		);
		expect(all('[data-continue]')[0]?.textContent).toBe('Start with: Lesson A');
		expect(all('[data-skipped]')[0]?.hidden).toBe(true);
		expect(all('[data-due-lines]')[0]?.hidden).toBe(true);
	});

	it('binds each block and redraws both on a progress write', () => {
		document.body.innerHTML = block(false) + block(true);
		expect(mountOverallProgress()).toBe(2);
		progress.finishLesson('concepts/a', [{ id: 'concepts/a#c1', revision: 1 }]);
		progress.skipLesson('concepts/b');
		progress.update((r) => {
			const item = r.reviews['concepts/a#c1'];
			if (item) item.due = progress.today();
		});
		for (const pct of all('[data-percent]')) expect(pct.textContent).toBe('100%');
		for (const bar of all('[data-bar]')) {
			expect(bar.getAttribute('aria-valuenow')).toBe('100');
			expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
		}
		expect(all('[data-skipped]').map((s) => [s.textContent, s.hidden])).toEqual([
			['1 skipped', false],
			['1 skipped', false],
		]);
		expect(all('[data-continue]').map((c) => c.textContent)).toEqual([
			'All lessons finished, 1 skipped',
			'All lessons finished, 1 skipped',
		]);
		const line = all('[data-due-line="concepts"]')[0];
		expect(line?.textContent).toBe('Concepts: 1 item due');
		expect(line?.getAttribute('href')).toBe('/ai-training/concepts/review/');
		expect(all('[data-due-lines]')[0]?.hidden).toBe(false);
	});

	it('throws when the bar has no fill element', () => {
		document.body.innerHTML = block(false).replace(
			'<div data-bar aria-valuenow="0"><div></div></div>',
			'<div data-bar></div>',
		);
		expect(() => mountOverallProgress()).toThrow('missing the fill element');
	});
});
