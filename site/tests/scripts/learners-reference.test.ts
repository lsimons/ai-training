// @vitest-environment happy-dom
/**
 * Mounts `learners-reference.ts` on a hand-written copy of the markup
 * `LearnersReference.astro` renders. The e2e suite checks the two agree.
 */
import { mountLearnersReference } from '@scripts/learners-reference';
import * as progress from '@scripts/progress';
import { emptyRecord } from '@scripts/progress-model';
import type { ReferenceArea } from '@scripts/reference';
import { beforeEach, describe, expect, it } from 'vitest';

const catalog: ReferenceArea[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [
			{
				id: 'concepts/a',
				title: 'A',
				topics: [
					{ id: 'concepts/t', name: 'T' },
					{ id: 'concepts/u', name: 'U' },
				],
			},
			{ id: 'concepts/b', title: 'B', topics: [] },
		],
	},
];

function page(): HTMLElement {
	document.body.innerHTML = `
		<div data-learners-reference data-catalog='${JSON.stringify(catalog)}' data-base="/ai-training/">
			<p data-reference-empty hidden>Nothing here yet.</p>
			<div data-reference-areas></div>
		</div>`;
	return document.body;
}

function finish(...ids: string[]) {
	const r = emptyRecord();
	for (const id of ids) r.lessons[id] = { state: 'finished', at: '2026-09-20' };
	progress.save(r);
}

beforeEach(() => {
	localStorage.clear();
});

describe('mountLearnersReference', () => {
	it('shows the empty state when no lesson is finished', () => {
		const root = page();
		expect(mountLearnersReference(root)).toBe(true);
		expect(root.querySelector<HTMLElement>('[data-reference-empty]')?.hidden).toBe(false);
		expect(root.querySelector('[data-reference-areas]')?.children).toHaveLength(0);
	});
	it('redraws on a progress event and links the lesson and its topics under the base', () => {
		const root = page();
		mountLearnersReference(root);
		finish('concepts/a');
		expect(root.querySelector<HTMLElement>('[data-reference-empty]')?.hidden).toBe(true);
		const li = root.querySelector('[data-reference-area="concepts"] [data-reference-finished="concepts/a"]');
		expect(li?.textContent).toBe('A · reference: T, U');
		const hrefs = [...(li?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href'));
		expect(hrefs).toEqual([
			'/ai-training/concepts/a/',
			'/ai-training/topics/concepts/t/#reference',
			'/ai-training/topics/concepts/u/#reference',
		]);
		expect(root.querySelector('[data-reference-finished="concepts/b"]')).toBeNull();
	});
	it('lists a finished lesson without topics with its link only', () => {
		const root = page();
		finish('concepts/b');
		mountLearnersReference(root);
		expect(root.querySelector('[data-reference-finished="concepts/b"]')?.textContent).toBe('B');
	});
	it('throws when a part the component renders is missing', () => {
		document.body.innerHTML = `<div data-learners-reference data-catalog="[]" data-base="/"></div>`;
		expect(() => mountLearnersReference(document.body)).toThrow('missing [data-reference-empty]');
		document.body.innerHTML = '<div data-learners-reference data-base="/"></div>';
		expect(() => mountLearnersReference(document.body)).toThrow('missing data-catalog');
	});
	it('returns false and changes nothing on a page without the component', () => {
		document.body.innerHTML = '<p>other</p>';
		expect(mountLearnersReference(document.body)).toBe(false);
		expect(document.body.innerHTML).toBe('<p>other</p>');
	});
});
