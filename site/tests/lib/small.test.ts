import { AREAS, areaOf, ENGINEERING_AREAS } from '@lib/areas';
import { CHECKPOINT_KINDS, DEFAULT_REVISION, isReviewable } from '@lib/checkpoint-rules';
import { jsonForScript } from '@lib/json';
import { href } from '@lib/url';
import { describe, expect, it } from 'vitest';

describe('areas', () => {
	it('lists six areas in path order, three of them engineering', () => {
		expect(AREAS.map((a) => a.slug)).toEqual([
			'concepts',
			'safety',
			'using-agents',
			'coding-with-agents',
			'customizing-agents',
			'building-agents',
		]);
		expect(ENGINEERING_AREAS).toEqual(['coding-with-agents', 'customizing-agents', 'building-agents']);
	});
	it('areaOf finds an area or throws', () => {
		expect(areaOf('safety').name).toBe('Safety');
		expect(() => areaOf('nope')).toThrow('Unknown area: nope');
	});
});

describe('checkpoint rules', () => {
	it('knows the six kinds and the default revision', () => {
		expect(CHECKPOINT_KINDS).toHaveLength(6);
		expect(DEFAULT_REVISION).toBe(1);
	});
	it('repair and honor predicts are never reviewed; review={false} opts out; the rest are reviewed', () => {
		expect(isReviewable({ kind: 'repair' })).toBe(false);
		expect(isReviewable({ kind: 'predict', honor: true })).toBe(false);
		expect(isReviewable({ kind: 'predict' })).toBe(true);
		expect(isReviewable({ kind: 'choice', review: false })).toBe(false);
		expect(isReviewable({ kind: 'sort', review: true })).toBe(true);
		expect(isReviewable({ kind: 'order' })).toBe(true);
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
	});
});
