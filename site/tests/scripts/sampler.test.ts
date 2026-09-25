// @vitest-environment happy-dom
/**
 * Mounts `sampler.ts` on a hand-written copy of the markup
 * `widgets/Sampler.astro` renders. The e2e suite checks the widget on a
 * built lesson page.
 */
import { mountSamplers, SAMPLER_SELECTOR } from '@scripts/sampler';
import { LOGITS } from '@scripts/sampler-logic';
import { beforeEach, describe, expect, it } from 'vitest';

const markup = `
<div class="not-content sampler" data-sampler>
	<p class="sampler-prefix">The cat sat on the …</p>
	<label class="sampler-temp">
		Temperature <input type="range" min="0.05" max="2" step="0.05" value="1" />
		<output>1.00</output>
	</label>
	<div class="sampler-bars"></div>
	<button type="button" class="sampler-go">Sample next token</button>
	<p class="sampler-out" aria-live="polite"></p>
</div>`;

function el<T extends Element>(root: ParentNode, selector: string): T {
	const found = root.querySelector<T>(selector);
	if (!found) throw new Error(`test markup has no ${selector}`);
	return found;
}

const tokens = Object.keys(LOGITS);

beforeEach(() => {
	document.body.innerHTML = markup;
});

describe('mountSamplers', () => {
	it('draws one bar per token at the starting temperature', () => {
		expect(mountSamplers(document)).toBe(1);
		const rows = document.querySelectorAll('.sampler-bars .bar');
		expect(rows).toHaveLength(tokens.length);
		expect([...rows].map((r) => r.querySelector('.tok')?.textContent)).toEqual(tokens);
		const pct = el<HTMLElement>(document, '.bar .pct').textContent ?? '';
		expect(pct).toMatch(/^\d+\.\d%$/);
		expect(el<HTMLElement>(document, '.bar .fill').style.width).toBe(pct);
		expect(el<HTMLOutputElement>(document, 'output').value).toBe('1.00');
	});
	it('redraws the bars and the output on slider input', () => {
		mountSamplers(document);
		const before = el<HTMLElement>(document, '.bar .pct').textContent;
		const range = el<HTMLInputElement>(document, 'input[type=range]');
		range.value = '0.1';
		range.dispatchEvent(new Event('input'));
		expect(el<HTMLOutputElement>(document, 'output').value).toBe('0.10');
		expect(document.querySelectorAll('.sampler-bars .bar')).toHaveLength(tokens.length);
		expect(el<HTMLElement>(document, '.bar .pct').textContent).not.toBe(before);
		expect(el<HTMLElement>(document, '.bar .pct').textContent).toBe('100.0%');
	});
	it('prints the sentence for the token the random number selects', () => {
		const draws = [0, 0.999999];
		mountSamplers(document, () => draws.shift() ?? 0);
		const go = el<HTMLButtonElement>(document, '.sampler-go');
		const out = el<HTMLElement>(document, '.sampler-out');
		go.click();
		expect(out.textContent).toBe('The cat sat on the mat.');
		go.click();
		expect(out.textContent).toBe('The cat sat on the spreadsheet.');
	});
	it('mounts every sampler on the page, and none on a page without one', () => {
		document.body.innerHTML = markup + markup;
		expect(mountSamplers(document)).toBe(2);
		expect(document.querySelectorAll('.sampler-bars .bar')).toHaveLength(tokens.length * 2);
		document.body.innerHTML = '<p>no widget</p>';
		expect(mountSamplers(document)).toBe(0);
	});
	it('throws with the selector when the markup lacks a part the template renders', () => {
		el<HTMLElement>(document, '.sampler-go').remove();
		expect(() => mountSamplers(document)).toThrow('missing .sampler-go');
		expect(SAMPLER_SELECTOR).toBe('[data-sampler]');
	});
});
