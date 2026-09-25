// @vitest-environment happy-dom
/**
 * Binds `settings.ts` to a hand-written copy of the markup `Settings.astro`
 * renders. If the component's markup changes, the fixture here changes with
 * it, and the e2e suite checks that the two still agree.
 */
import * as progress from '@scripts/progress';
import { mountSettings } from '@scripts/settings';
import type { CatalogCourse } from '@scripts/settings-model';
import { beforeEach, describe, expect, it } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{
				id: 'concepts/a',
				title: 'Lesson A',
				checkpoints: [
					{ id: 'c1', title: 'First check' },
					{ id: 'c2', title: 'Second check' },
				],
			},
		],
	},
];

function render(data = JSON.stringify(catalog)) {
	const root = document.createElement('div');
	root.className = 'not-content settings';
	root.dataset.catalog = data;
	root.innerHTML = `
		<div class="comfort">
			<button type="button" data-comfort="less" aria-pressed="false">less</button>
			<button type="button" data-comfort="more" aria-pressed="false">more</button>
			<span data-comfort-note></span>
		</div>
		<p data-due-now></p>
		<div data-schedule></div>`;
	document.body.replaceChildren(root);
	return root;
}

const q = <T extends HTMLElement = HTMLElement>(sel: string) => {
	const el = document.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};

beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
});

describe('mountSettings', () => {
	it('does nothing on a page without the settings block', () => {
		expect(mountSettings()).toBe(false);
	});

	it('throws with the selector when the markup lacks a part the script needs', () => {
		render();
		q('[data-schedule]').remove();
		expect(() => mountSettings()).toThrow('missing [data-schedule]');
	});

	it('toggles the comfort level and shows it', () => {
		render();
		mountSettings();
		expect(q('[data-comfort-note]').textContent).toBe('Not set.');
		q('[data-comfort="less"]').click();
		expect(progress.load().comfort).toBe('less');
		expect(q('[data-comfort="less"]').getAttribute('aria-pressed')).toBe('true');
		expect(q('[data-comfort-note]').textContent).toBe('Set: less comfortable.');
		q('[data-comfort="less"]').click();
		expect(progress.load().comfort).toBeUndefined();
		expect(q('[data-comfort-note]').textContent).toBe('Not set.');
	});

	it('says nothing is scheduled or due for a new learner', () => {
		render();
		mountSettings();
		expect(q('[data-due-now]').textContent).toBe('Nothing due right now.');
		expect(q('.review-empty').textContent).toContain('Nothing scheduled');
	});

	it('lists scheduled items, links due courses and moves a stage on a click', () => {
		render();
		mountSettings();
		progress.finishLesson('concepts/a', [
			{ id: 'concepts/a#c1', revision: 1 },
			{ id: 'concepts/gone', revision: 1 },
		]);
		progress.update((r) => {
			const item = r.reviews['concepts/a#c1'];
			if (item) item.due = progress.today();
		});
		const rows = document.querySelectorAll<HTMLElement>('[data-review-item]');
		expect([...rows].map((r) => r.dataset.reviewItem)).toEqual(['concepts/a#c1', 'concepts/gone']);
		const first = q('[data-review-item="concepts/a#c1"]');
		expect(first.querySelector('.schedule-name')?.textContent).toBe('First check (Lesson A)');
		expect(first.querySelector('.schedule-name')?.getAttribute('href')).toBe('/ai-training/concepts/a/#c1');
		expect(first.querySelectorAll('[data-on="true"]')).toHaveLength(1);
		expect(first.querySelector('.schedule-history')?.textContent).toBe('not answered yet');
		expect(q('[data-review-item="concepts/gone"] .schedule-name').textContent).toBe('concepts/gone');
		expect(q('[data-due-now]').textContent).toBe('Due now: Concepts (1).');
		expect(q('[data-due-now] a').getAttribute('href')).toBe('/ai-training/concepts/review/');

		const sooner = first.querySelector<HTMLButtonElement>('.cp-sooner');
		expect(sooner?.disabled).toBe(true);
		q<HTMLButtonElement>('[data-review-item="concepts/a#c1"] .cp-later').click();
		expect(progress.load().reviews['concepts/a#c1']?.stage).toBe(2);
		q<HTMLButtonElement>('[data-review-item="concepts/a#c1"] .cp-sooner').click();
		expect(progress.load().reviews['concepts/a#c1']?.stage).toBe(1);
	});

	it('separates several due courses with commas', () => {
		const two: CatalogCourse[] = [
			...catalog,
			{ area: 'safety', title: 'Safety', lessons: [{ id: 'safety/b', title: 'B', checkpoints: [] }] },
		];
		render(JSON.stringify(two));
		progress.finishLesson('concepts/a', [{ id: 'concepts/a#c1', revision: 1 }]);
		progress.finishLesson('safety/b', [{ id: 'safety/b#x', revision: 1 }]);
		progress.update((r) => {
			for (const item of Object.values(r.reviews)) item.due = progress.today();
		});
		mountSettings();
		expect(q('[data-due-now]').textContent).toBe('Due now: Concepts (1), Safety (1).');
	});
});
