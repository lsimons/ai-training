import { DEFAULT_REVISION, isReviewable, KIND_OF_TAG } from '@lib/checkpoint-rules';
import { jsonForScript } from '@lib/json';
import { absoluteUrl, href } from '@lib/url';
import { describe, expect, it } from 'vitest';

describe('checkpoint rules', () => {
	it('maps every component tag to its kind and knows the default revision', () => {
		expect(Object.keys(KIND_OF_TAG)).toHaveLength(8);
		expect(KIND_OF_TAG.MultiChoice).toBe('multi-choice');
		expect(KIND_OF_TAG.Match).toBe('match');
		expect(DEFAULT_REVISION).toBe(1);
	});
	it('repair and honor predicts are never reviewed; review={false} opts out; the rest are reviewed', () => {
		expect(isReviewable({ kind: 'repair' })).toBe(false);
		expect(isReviewable({ kind: 'predict', honor: true })).toBe(false);
		expect(isReviewable({ kind: 'predict' })).toBe(true);
		expect(isReviewable({ kind: 'choice', review: false })).toBe(false);
		expect(isReviewable({ kind: 'sort', review: true })).toBe(true);
		expect(isReviewable({ kind: 'order' })).toBe(true);
		expect(isReviewable({ kind: 'multi-choice' })).toBe(true);
		expect(isReviewable({ kind: 'match' })).toBe(true);
	});
});

describe('jsonForScript', () => {
	it('escapes < so a value cannot close the script element', () => {
		const out = jsonForScript({ a: '</script><b>' });
		expect(out).not.toContain('</script>');
		expect(JSON.parse(out)).toEqual({ a: '</script><b>' });
	});
});

describe('href', () => {
	it('prefixes the deploy base and refuses relative paths', () => {
		expect(href('/progress/')).toBe('/ai-training/progress/');
		expect(() => href('progress/')).toThrow(/root-relative/);
		expect(absoluteUrl('/guides/tutor/', 'https://lsimons.github.io')).toBe(
			'https://lsimons.github.io/ai-training/guides/tutor/',
		);
		expect(absoluteUrl('/ai-training/guides/', 'https://lsimons.github.io/')).toBe(
			'https://lsimons.github.io/ai-training/guides/',
		);
		expect(absoluteUrl('/ai-training', 'https://lsimons.github.io')).toBe('https://lsimons.github.io/ai-training');
		expect(absoluteUrl('https://example.com/x', 'https://lsimons.github.io')).toBe('https://example.com/x');
		expect(absoluteUrl('mailto:a@b.c', 'https://lsimons.github.io')).toBe('mailto:a@b.c');
		expect(() => absoluteUrl('guides/', 'https://lsimons.github.io')).toThrow(/root-relative/);
	});
});
