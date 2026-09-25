/**
 * The sampler widget (`widgets/Sampler.astro`, spec S03 "Widgets"): a
 * temperature slider redraws one bar per next token, and a button samples
 * one token and prints the sentence. The math is in `sampler-logic.ts`. No
 * DOM access at import time, so it runs under Node in the unit tests with a
 * `happy-dom` document.
 */
import { requiredElement } from './required-element';
import { percent, pick, probs, sentence } from './sampler-logic';

/** The selector of each sampler's root element. */
export const SAMPLER_SELECTOR = '[data-sampler]';

function bar(tok: string, p: number): HTMLElement {
	const row = document.createElement('div');
	row.className = 'bar';
	const name = document.createElement('span');
	name.className = 'tok';
	name.textContent = tok;
	const fill = document.createElement('span');
	fill.className = 'fill';
	fill.style.width = percent(p);
	const pct = document.createElement('span');
	pct.className = 'pct';
	pct.textContent = percent(p);
	row.append(name, fill, pct);
	return row;
}

/** Wires one sampler: draws the bars now and on every slider input, and samples on a click. */
export function mountSampler(root: HTMLElement, random: () => number = Math.random): void {
	const range = requiredElement<HTMLInputElement>(root, 'input[type=range]');
	const out = requiredElement<HTMLOutputElement>(root, 'output');
	const bars = requiredElement(root, '.sampler-bars');
	const go = requiredElement<HTMLButtonElement>(root, '.sampler-go');
	const gen = requiredElement(root, '.sampler-out');

	const draw = () => {
		const t = Number(range.value);
		out.value = t.toFixed(2);
		bars.replaceChildren(...probs(t).map(([tok, p]) => bar(tok, p)));
	};
	go.addEventListener('click', () => {
		gen.textContent = sentence(pick(probs(Number(range.value)), random()));
	});
	range.addEventListener('input', draw);
	draw();
}

/** Mounts every sampler under `root`. Returns the number mounted, zero on a page without one. */
export function mountSamplers(root: ParentNode = document, random: () => number = Math.random): number {
	const samplers = root.querySelectorAll<HTMLElement>(SAMPLER_SELECTOR);
	for (const s of samplers) mountSampler(s, random);
	return samplers.length;
}
