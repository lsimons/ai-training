// @vitest-environment happy-dom
/**
 * Binds `progress-overview.ts` to a hand-written copy of the markup
 * `ProgressOverview.astro` renders. If the component's markup changes, the
 * fixture here changes with it, and the e2e suite checks that the two still
 * agree.
 */
import * as progress from '@scripts/progress';
import { mountProgressOverview } from '@scripts/progress-overview';
import type { CatalogCourse } from '@scripts/progress-overview-model';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{
				id: 'concepts/a',
				title: 'Lesson A',
				checkpoints: [
					{ id: 'c1', reviewable: true, revision: 1 },
					{ id: 'c2', reviewable: false, revision: 1 },
				],
				practice: [],
				habits: [{ id: 'h1', html: 'Say it <em>out loud</em>.' }],
			},
		],
	},
	{ area: 'safety', title: 'Safety', lessons: [] },
];

function render() {
	const root = document.createElement('div');
	root.className = 'not-content progress';
	root.dataset.catalog = JSON.stringify(catalog);
	root.innerHTML = `
		<div data-overview></div>
		<button type="button" data-export>Export JSON</button>
		<input type="file" data-import />
		<button type="button" data-reset>Reset all</button>
		<span data-message></span>
		<pre data-dump></pre>`;
	document.body.replaceChildren(root);
}

const q = <T extends HTMLElement = HTMLElement>(sel: string) => {
	const el = document.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};

/** Fires the import input's change event with one file holding `text`. */
function importFile(text: string) {
	const input = q<HTMLInputElement>('[data-import]');
	Object.defineProperty(input, 'files', { configurable: true, value: [new File([text], 'p.json')] });
	input.dispatchEvent(new Event('change'));
}

beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('mountProgressOverview', () => {
	it('does nothing on a page without the progress block', () => {
		expect(mountProgressOverview()).toBe(false);
	});

	it('draws a card per course, with checkpoint squares, habits and the review line', () => {
		render();
		progress.recordCheckpoint('concepts/a#c1', true);
		progress.finishLesson('concepts/a', [{ id: 'concepts/a#c1', revision: 1 }], ['concepts/a#h1']);
		mountProgressOverview();
		const cards = document.querySelectorAll('.progress-course');
		expect(cards).toHaveLength(2);
		expect(q('.progress-lesson').dataset.state).toBe('finished');
		expect(q('.progress-lesson a').getAttribute('href')).toBe('/ai-training/concepts/a/');
		const squares = [...document.querySelectorAll<HTMLElement>('.cps span')];
		expect(squares.map((s) => s.title)).toEqual(['c1: passed', 'c2: not attempted']);
		expect(squares.map((s) => s.dataset.state)).toEqual(['passed', 'none']);
		expect(q('[data-progress-habit="concepts/a#h1"] .progress-habit-text').innerHTML).toBe('Say it <em>out loud</em>.');
		expect(q('[data-progress-review="concepts"]').textContent).toBe('Review: nothing due yet');
		expect(cards[1]?.textContent).toContain('No lessons yet.');
		expect(document.querySelector('[data-progress-review="safety"]')).toBeNull();
		expect(q('[data-dump]').textContent).toContain('"concepts/a"');
	});

	it('prunes entries the build no longer knows and redraws on a write', () => {
		progress.recordCheckpoint('concepts/gone#c1', true);
		render();
		mountProgressOverview();
		expect(progress.load().checkpoints['concepts/gone#c1']).toBeUndefined();
		progress.markLessonRead('concepts/a');
		expect(q('.progress-lesson').dataset.state).toBe('read');
	});

	it('resets only after the learner confirms', () => {
		render();
		mountProgressOverview();
		progress.markLessonRead('concepts/a');
		vi.stubGlobal('confirm', () => false);
		q('[data-reset]').click();
		expect(progress.load().lessons['concepts/a']).toBeDefined();
		vi.stubGlobal('confirm', () => true);
		q('[data-reset]').click();
		expect(progress.load().lessons['concepts/a']).toBeUndefined();
		expect(q('[data-message]').textContent).toBe('Progress reset.');
	});

	it('exports the record as a dated JSON download', () => {
		render();
		mountProgressOverview();
		const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
		const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		const clicked: string[] = [];
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
			clicked.push(this.download);
		});
		q('[data-export]').click();
		expect(create).toHaveBeenCalledOnce();
		expect(revoke).toHaveBeenCalledWith('blob:x');
		expect(clicked).toEqual([`ai-training-progress-${progress.today()}.json`]);
	});

	it('imports a confirmed file, and reports a refused one', async () => {
		render();
		mountProgressOverview();
		const other = progress.emptyRecord();
		other.lessons['concepts/a'] = { state: 'finished', at: '2026-01-01' };
		vi.stubGlobal('confirm', () => true);
		importFile(progress.exportJson(other));
		await vi.waitFor(() => expect(q('[data-message]').textContent).toBe('Imported.'));
		expect(progress.load().lessons['concepts/a']?.state).toBe('finished');

		importFile('{"version": 9999}');
		await vi.waitFor(() => expect(q('[data-message]').textContent).not.toBe('Imported.'));
	});

	it('leaves the record alone when the import is not confirmed or has no file', async () => {
		render();
		mountProgressOverview();
		vi.stubGlobal('confirm', () => false);
		importFile(progress.exportJson(progress.emptyRecord()));
		const input = q<HTMLInputElement>('[data-import]');
		Object.defineProperty(input, 'files', { configurable: true, value: [] });
		input.dispatchEvent(new Event('change'));
		await new Promise((r) => setTimeout(r, 10));
		expect(q('[data-message]').textContent).toBe('');
	});
});
