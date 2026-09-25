// @vitest-environment happy-dom
/**
 * Mounts `topic-reference.ts` on a hand-written copy of the markup
 * `TopicReference.astro` renders. The e2e suite checks the two agree.
 */
import * as progress from '@scripts/progress';
import { emptyRecord } from '@scripts/progress-model';
import { mountTopicReference } from '@scripts/topic-reference';
import { beforeEach, describe, expect, it } from 'vitest';

function section(id: string): string {
	return `
		<section data-reference-lesson="${id}" data-unlocked="false">
			<p data-reference-locked>Unlocks when you finish it.</p>
			<div data-reference-body hidden>Takeaways</div>
		</section>`;
}

function page(): HTMLElement {
	document.body.innerHTML = `<div data-reference="concepts/t">${section('concepts/a')}${section('concepts/b')}</div>`;
	return document.body;
}

function state(root: HTMLElement, id: string) {
	const s = root.querySelector<HTMLElement>(`[data-reference-lesson="${id}"]`);
	return {
		unlocked: s?.dataset.unlocked,
		lockedHidden: s?.querySelector<HTMLElement>('[data-reference-locked]')?.hidden,
		bodyHidden: s?.querySelector<HTMLElement>('[data-reference-body]')?.hidden,
	};
}

beforeEach(() => {
	localStorage.clear();
});

describe('mountTopicReference', () => {
	it('keeps every block locked when nothing is finished', () => {
		const root = page();
		expect(mountTopicReference(root)).toBe(true);
		expect(state(root, 'concepts/a')).toEqual({ unlocked: 'false', lockedHidden: false, bodyHidden: true });
	});
	it('unlocks the finished lesson only, on the progress event', () => {
		const root = page();
		mountTopicReference(root);
		const r = emptyRecord();
		r.lessons['concepts/a'] = { state: 'finished', at: '2026-09-20' };
		r.lessons['concepts/b'] = { state: 'read', at: '2026-09-20' };
		progress.save(r);
		expect(state(root, 'concepts/a')).toEqual({ unlocked: 'true', lockedHidden: true, bodyHidden: false });
		expect(state(root, 'concepts/b')).toEqual({ unlocked: 'false', lockedHidden: false, bodyHidden: true });
	});
	it('throws on a section without the locked note the component renders', () => {
		document.body.innerHTML = '<div data-reference="t"><section data-reference-lesson="x"></section></div>';
		expect(() => mountTopicReference(document.body)).toThrow('missing [data-reference-locked]');
	});
	it('returns false on a page without the component', () => {
		document.body.innerHTML = '<p>other</p>';
		expect(mountTopicReference(document.body)).toBe(false);
	});
});
