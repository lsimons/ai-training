// @vitest-environment happy-dom
/**
 * Mounts `review-page.ts` on a hand-written copy of the markup
 * `pages/[area]/review.astro` renders, with a fake fetch that returns a
 * lesson page holding checkpoint markup as the lesson components render it
 * (see checkpoints.test.ts). The e2e suite checks the copies still agree.
 */
import * as progress from '@scripts/progress';
import { mountReviewPage } from '@scripts/review-page';
import type { CatalogLesson } from '@scripts/review-page-logic';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const LESSON = 'concepts/a';
const HREF = '/ai-training/concepts/a/';

const catalog: CatalogLesson[] = [
	{
		id: LESSON,
		title: 'A',
		href: HREF,
		checkpoints: [
			{ id: 'q1', revision: 1, alternates: ['q1-alt'] },
			{ id: 'q2', revision: 1, alternates: [] },
		],
		habits: [{ id: 'h', html: 'Do <em>this</em>.' }],
	},
];

function checkpoint(id: string, attrs: string): string {
	return `
		<section class="checkpoint" id="${id}" data-kind="choice" data-progress-id="${LESSON}#${id}" data-bound="true" ${attrs}>
			<header class="cp-head"><span class="cp-state"></span></header>
			<p class="cp-context" hidden>Context.</p>
			<div class="cp-body"><div class="cp-options">
				<label><input type="radio" name="${id}" /><span>Wrong</span></label>
				<label data-correct="true"><input type="radio" name="${id}" /><span>Right</span></label>
			</div></div>
			<div class="cp-controls">
				<button type="button" class="cp-check">Check</button>
				<button type="button" class="cp-skip">Skip</button>
				<button type="button" class="cp-giveup" hidden>Give up</button>
			</div>
			<p class="cp-feedback"></p>
			<div class="cp-after" hidden><a class="cp-lesson-link" href="${HREF}#${id}">In the lesson</a></div>
		</section>`;
}

function lessonPage(withAlternate = true): string {
	return `<html><body>
		${checkpoint('q1', 'data-checkpoint data-reviewable="true"')}
		${withAlternate ? checkpoint('q1-alt', 'data-alternate hidden') : ''}
		${checkpoint('q2', 'data-checkpoint data-reviewable="true"')}
	</body></html>`;
}

function page(): void {
	document.body.innerHTML = `
		<div class="not-content review" data-review="concepts" data-catalog='${JSON.stringify(catalog)}'>
			<div class="review-habits" data-habits hidden></div>
			<div class="review-progress"><div data-bar></div></div>
			<p data-status role="status"></p>
			<div data-items></div>
			<div class="review-actions"><a href="/ai-training/concepts/">Back to the course</a></div>
		</div>`;
}

/** Review items due long ago, in this order. */
function due(...ids: string[]) {
	progress.update((r) => {
		ids.forEach((id, i) => {
			r.reviews[id] = { stage: 1, due: `2000-01-0${i + 1}`, last: null, history: [], revision: 1 };
		});
	});
}

const q = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => {
	const el = root.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};

/** Answers the checkpoint on screen correctly. */
function answerShown() {
	q<HTMLInputElement>('[data-items] label[data-correct] input').checked = true;
	q('[data-items] .cp-check').click();
}

const fetchPage = (html: string) => vi.fn(async (_url: string) => html);

beforeEach(() => {
	localStorage.clear();
});

describe('mountReviewPage', () => {
	it('returns false on a page without the review element', () => {
		document.body.innerHTML = '<p>other</p>';
		expect(mountReviewPage(document)).toBe(false);
	});
	it('says nothing is due and fills the bar when the session is empty', async () => {
		page();
		const fetch = fetchPage(lessonPage());
		await mountReviewPage(document, fetch);
		expect(q('[data-items]').textContent).toContain('Nothing due.');
		expect(q('[data-bar]').style.width).toBe('100%');
		expect(q('[data-habits]').hidden).toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});
	it('shows a due habit card, and hides the block once it is done', async () => {
		progress.update((r) => {
			r.habits[`${LESSON}#h`] = { since: '2000-01-01', next: '2000-01-02', history: [] };
		});
		page();
		await mountReviewPage(document, fetchPage(lessonPage()));
		const block = q('[data-habits]');
		expect(block.hidden).toBe(false);
		expect(q('.habit-title', block).textContent).toBe('Habit from A');
		expect(q('.habit-text', block).innerHTML).toBe('Do <em>this</em>.');
		q('[data-habit-done]', block).click();
		expect(block.querySelector('[data-habit]')).toBeNull();
		expect(block.hidden).toBe(true);
	});
	it('asks the alternate first, then the next item, then offers the finish link', async () => {
		due(`${LESSON}#q1`, `${LESSON}#q2`);
		page();
		const fetch = fetchPage(lessonPage());
		await mountReviewPage(document, fetch);
		expect(fetch).toHaveBeenCalledWith(HREF);
		expect(q('[data-status]').textContent).toBe('Item 1 of 2');
		expect(q('[data-bar]').style.width).toBe('0%');
		const first = q('[data-items] [data-checkpoint]');
		expect(first.dataset.progressId).toBe(`${LESSON}#q1`);
		expect(first.dataset.served).toBe('q1-alt');
		expect(first.hidden).toBe(false);
		expect(first.hasAttribute('data-alternate')).toBe(false);
		expect(q<HTMLAnchorElement>('.cp-lesson-link', first).getAttribute('href')).toBe(`${HREF}#q1`);
		expect(first.querySelector('.cp-skip')).toBeNull();
		expect(q('.cp-giveup', first).hidden).toBe(false);
		expect(q('.cp-context', first).hidden).toBe(false);
		answerShown();
		answerShown();
		expect(first.querySelectorAll('.cp-after button')).toHaveLength(1);
		expect(progress.load().reviews[`${LESSON}#q1`]?.history).toEqual([
			{ at: progress.today(), result: 'pass', served: 'q1-alt' },
		]);
		q('.cp-after button', first).click();
		await vi.waitFor(() => expect(q('[data-items] [data-checkpoint]').dataset.progressId).toBe(`${LESSON}#q2`));
		expect(q('[data-status]').textContent).toBe('Item 2 of 2');
		const second = q('[data-items] [data-checkpoint]');
		expect(second.dataset.served).toBeUndefined();
		answerShown();
		q('.cp-after button', second).click();
		await vi.waitFor(() => expect(q('[data-status]').textContent).toBe('Done: 2 items reviewed. 0 more remain due.'));
		expect(q<HTMLAnchorElement>('[data-items] a.cp-check').href).toBe(
			new URL('/ai-training/concepts/', location.href).href,
		);
		expect(q('[data-bar]').style.width).toBe('100%');
	});
	it('asks the own checkpoint when the picked alternate is missing from the page', async () => {
		due(`${LESSON}#q1`);
		page();
		await mountReviewPage(document, fetchPage(lessonPage(false)));
		const shown = q('[data-items] [data-checkpoint]');
		expect(shown.id).toBe('q1');
		expect(shown.dataset.served).toBeUndefined();
	});
	it('drops an orphaned item and moves on', async () => {
		due(`${LESSON}#gone`, `${LESSON}#q2`);
		page();
		await mountReviewPage(document, fetchPage('<html><body></body></html>'));
		const rec = progress.load();
		expect(rec.reviews[`${LESSON}#gone`]).toBeUndefined();
		expect(rec.reviews[`${LESSON}#q2`]).toBeUndefined();
		expect(q('[data-status]').textContent).toBe('Done: 0 items reviewed. 0 more remain due.');
	});
});
