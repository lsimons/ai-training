import { FALLBACK_TOKEN, LOGITS, MIN_TEMPERATURE, percent, pick, probs, sentence } from '@scripts/sampler-logic';
import { describe, expect, it } from 'vitest';

const sum = (d: [string, number][]) => d.reduce((a, [, p]) => a + p, 0);

describe('probs', () => {
	it('returns one probability per token, in the order of the logits, summing to 1', () => {
		const d = probs(1);
		expect(d.map(([t]) => t)).toEqual(Object.keys(LOGITS));
		expect(sum(d)).toBeCloseTo(1, 12);
	});
	it('is the softmax of the logits at temperature 1', () => {
		const d = probs(1, { a: 0, b: Math.log(3) });
		expect(d[0]?.[1]).toBeCloseTo(0.25, 12);
		expect(d[1]?.[1]).toBeCloseTo(0.75, 12);
	});
	it('gives equal logits equal probabilities at any temperature', () => {
		for (const t of [0.1, 1, 2]) {
			const d = probs(t, { a: 1, b: 1 });
			expect(d[0]?.[1]).toBeCloseTo(0.5, 12);
		}
	});
	it('sharpens toward the top token at a low temperature and flattens at a high one', () => {
		const top = (t: number) => probs(t)[0]?.[1] ?? 0;
		expect(top(0.1)).toBeGreaterThan(0.99);
		expect(top(0.5)).toBeGreaterThan(top(1));
		expect(top(2)).toBeLessThan(top(1));
	});
	it('raises a temperature below the minimum, including zero and negatives, to the minimum', () => {
		expect(probs(0)).toEqual(probs(MIN_TEMPERATURE));
		expect(probs(-1)).toEqual(probs(MIN_TEMPERATURE));
		expect(sum(probs(0))).toBeCloseTo(1, 12);
	});
});

describe('pick', () => {
	const d: [string, number][] = [
		['a', 0.5],
		['b', 0.25],
		['c', 0.25],
	];
	// Binary-exact probabilities, so each boundary is tested at exactly its cumulative value.
	it('takes the first token whose cumulative probability reaches r', () => {
		expect(pick(d, 0)).toBe('a');
		expect(pick(d, 0.5)).toBe('a');
		expect(pick(d, 0.51)).toBe('b');
		expect(pick(d, 0.75)).toBe('b');
		expect(pick(d, 0.76)).toBe('c');
		expect(pick(d, 0.999)).toBe('c');
	});
	it('falls back to the top token when rounding leaves r above the total', () => {
		expect(pick([['x', 0.4]], 0.9)).toBe(FALLBACK_TOKEN);
		expect(pick([], 0.1)).toBe(FALLBACK_TOKEN);
	});
});

describe('percent and sentence', () => {
	it('formats a probability with one decimal', () => {
		expect(percent(0.425)).toBe('42.5%');
		expect(percent(1)).toBe('100.0%');
		expect(percent(0)).toBe('0.0%');
	});
	it('joins the token, which starts with its space, to the prefix', () => {
		expect(sentence(' mat')).toBe('The cat sat on the mat.');
	});
});
