import { createCitations } from '@lib/citations';
import { describe, expect, it } from 'vitest';

const bibliography = {
	'AEC-02': { type: 'course', title: 'How agents think', author: 'A. Osmani', url: 'https://example.com/aec' },
	'Brilliant TAS': { type: 'reference', title: 'Taste', container: 'Brilliant', author: null, url: null },
};

describe('createCitations', () => {
	it('renders a known key as a numbered link and lists it once in references', () => {
		const c = createCitations(bibliography, 'test');
		expect(c.render('Read this (@AEC-02).')).toBe(
			'Read this <a class="citation" data-key="AEC-02" href="#ref-1" title="AEC-02">[1]</a>.',
		);
		expect(c.render('Again (@AEC-02).')).toContain('href="#ref-1"');
		expect(c.references()).toEqual([{ n: 1, key: 'AEC-02', entry: bibliography['AEC-02'] }]);
	});
	it('numbers two keys by first appearance across calls', () => {
		const c = createCitations(bibliography, 'test');
		c.render('(@Brilliant TAS) then (@AEC-02)');
		expect(c.references().map((r) => [r.n, r.key])).toEqual([
			[1, 'Brilliant TAS'],
			[2, 'AEC-02'],
		]);
	});
	it('throws on an unknown key, naming where', () => {
		const c = createCitations(bibliography, 'concepts/x');
		expect(() => c.render('See (@Nope).')).toThrow(/concepts\/x: unknown citation key "Nope"/);
		expect(c.references()).toEqual([]);
	});
	it('escapes text without a token and renders backtick spans as code, leaving a token inside code alone', () => {
		const c = createCitations(bibliography, 'test');
		expect(c.render('a < b')).toBe('a &lt; b');
		expect(c.render('Run `mise run ci` & `(@AEC-02)` now.')).toBe(
			'Run <code>mise run ci</code> &amp; <code>(@AEC-02)</code> now.',
		);
		expect(c.references()).toEqual([]);
	});
});
