// @vitest-environment happy-dom
/**
 * Mounts `markdown-content.ts` on a hand-written copy of the lesson frame
 * `overrides/MarkdownContent.astro` renders, with checkpoint markup as the
 * lesson components render it (see checkpoints.test.ts). The e2e suite checks
 * that the copies still agree with the components.
 */
import { mountLesson } from '@scripts/markdown-content';
import * as progress from '@scripts/progress';
import { beforeEach, describe, expect, it } from 'vitest';

const LESSON = 'concepts/how-models-work';

function checkpoint(id: string, extra = ''): string {
	return `
		<section class="checkpoint" id="${id}" data-checkpoint data-kind="choice" data-progress-id="${LESSON}#${id}" ${extra}>
			<header class="cp-head"><span class="cp-state"></span></header>
			<div class="cp-body"><div class="cp-options">
				<label><input type="radio" name="${id}" /><span>Wrong</span></label>
				<label data-correct="true"><input type="radio" name="${id}" /><span>Right</span></label>
			</div></div>
			<div class="cp-controls">
				<button type="button" class="cp-check">Check</button>
				<button type="button" class="cp-hint-btn">Hint</button>
				<button type="button" class="cp-skip">Skip</button>
				<button type="button" class="cp-giveup" hidden>Give up</button>
			</div>
			<p class="cp-hint" hidden>A hint.</p>
			<p class="cp-feedback"></p>
			<div class="cp-after" hidden></div>
		</section>`;
}

function page(skills = true): void {
	document.body.innerHTML = `
		<button type="button" data-skip-lesson id="tip-skip"></button>
		<div class="lesson" data-lesson="${LESSON}">
			${
				skills
					? `<aside data-skills-check data-items="a b missing" hidden>
				<p data-skills-note></p>
				<button type="button" data-skills-start></button>
				<button type="button" data-skills-dismiss>Not now</button>
				<div data-skills-items hidden></div>
			</aside>`
					: ''
			}
			<aside data-route="behind" hidden></aside>
			${checkpoint('a', 'data-reviewable="true" data-revision="2"')}
			${checkpoint('b')}
			${checkpoint('p', 'data-phase="practice"')}
			<div data-habit data-progress-id="${LESSON}#h"></div>
			<aside data-route="ahead" hidden></aside>
			<button type="button" data-finish></button>
			<p data-finish-note></p>
			<button type="button" data-skip-lesson id="recap-skip"></button>
		</div>`;
}

const q = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => {
	const el = root.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};

/** Answers checkpoint `id` under `root`, or its skills check copy, right or wrong. */
function answer(id: string, right: boolean, root: ParentNode = q('.lesson')) {
	const cp = q(`[data-checkpoint][id="${id}"], [data-skills-item="${id}"]`, root);
	q<HTMLInputElement>(right ? 'label[data-correct] input' : 'label:not([data-correct]) input', cp).checked = true;
	q('.cp-check', cp).click();
}

beforeEach(() => {
	localStorage.clear();
});

describe('mountLesson', () => {
	it('returns false on a page without a lesson frame', () => {
		document.body.innerHTML = '<p>other</p>';
		expect(mountLesson(document)).toBe(false);
	});
	it('marks the lesson read and blocks finishing while checkpoints are open', () => {
		page();
		expect(mountLesson(document)).toBe(true);
		expect(progress.load().lessons[LESSON]?.state).toBe('read');
		expect(q<HTMLButtonElement>('[data-finish]').disabled).toBe(true);
		expect(q('[data-finish-note]').textContent).toBe('Pass or skip 2 more checkpoints to finish this lesson.');
		expect(q('[data-route=behind]').hidden).toBe(true);
		expect(q('[data-route=ahead]').hidden).toBe(true);
		expect(q('[data-skills-check]').hidden).toBe(true);
	});
	it('shows the behind card after a wrong answer and the ahead card after clean passes', () => {
		page();
		mountLesson(document);
		answer('a', false);
		expect(q('[data-route=behind]').hidden).toBe(false);
		page();
		localStorage.clear();
		mountLesson(document);
		answer('a', true);
		answer('b', true);
		expect(q('[data-route=ahead]').hidden).toBe(false);
		expect(q('[data-route=behind]').hidden).toBe(true);
	});
	it('finishes the lesson with its reviewable checkpoints and habits once nothing is open', () => {
		page();
		mountLesson(document);
		q('[data-finish]').click();
		expect(progress.load().lessons[LESSON]?.state).toBe('read');
		answer('a', true);
		answer('b', true);
		expect(q<HTMLButtonElement>('[data-finish]').disabled).toBe(false);
		q('[data-finish]').click();
		const rec = progress.load();
		expect(rec.lessons[LESSON]?.state).toBe('finished');
		expect(Object.keys(rec.reviews)).toEqual([`${LESSON}#a`]);
		expect(Object.keys(rec.habits)).toEqual([`${LESSON}#h`]);
		expect(q('[data-finish]').textContent).toMatch(/^Finished ✓/);
		expect(q<HTMLButtonElement>('#tip-skip').disabled).toBe(true);
	});
	it('skips the lesson from either skip button', () => {
		page();
		mountLesson(document);
		expect(q('#recap-skip').textContent).toBe('I know this, skip it');
		q('#tip-skip').click();
		expect(progress.load().lessons[LESSON]?.state).toBe('skipped');
		expect(q<HTMLButtonElement>('#recap-skip').disabled).toBe(true);
		expect(q('#recap-skip').textContent).toMatch(/^Skipped \(/);
	});
	it('offers no skills check below comfort more, or without a card', () => {
		page();
		mountLesson(document);
		q('[data-skills-start]').click();
		expect(q('[data-skills-items]').children).toHaveLength(0);
		page(false);
		progress.setComfort('more');
		expect(mountLesson(document)).toBe(true);
	});
	it('runs the skills check at comfort more: one try per copy, then Close', () => {
		progress.setComfort('more');
		page();
		mountLesson(document);
		const card = q('[data-skills-check]');
		expect(card.hidden).toBe(false);
		expect(q('[data-skills-note]').textContent).toContain('One checkpoint per objective');
		q('[data-skills-start]').click();
		const items = q('[data-skills-items]');
		expect(items.hidden).toBe(false);
		expect(items.querySelectorAll('[data-checkpoint]')).toHaveLength(2);
		answer('a', true, items);
		expect(q<HTMLButtonElement>('.cp-check', items).hasAttribute('disabled')).toBe(true);
		expect(progress.load().checkpoints[`${LESSON}#a`]?.state).toBe('passed');
		expect(Object.keys(progress.load().reviews)).toEqual([`${LESSON}#a`]);
		answer('b', false, items);
		expect(q('[data-skills-dismiss]').textContent).toBe('Close');
		q('[data-skills-dismiss]').click();
		expect(card.hidden).toBe(true);
	});
	it('hides the card when every skills item is passed in the body first', () => {
		progress.setComfort('more');
		page();
		mountLesson(document);
		answer('a', true);
		answer('b', true);
		expect(q('[data-skills-check]').hidden).toBe(true);
		q('[data-skills-start]').click();
		expect(q('[data-skills-items]').children).toHaveLength(0);
	});
});
