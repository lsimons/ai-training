import { openingTagEnd, parseAttrs } from '@lib/jsx-source';
import { describe, expect, it } from 'vitest';

describe('parseAttrs', () => {
	it('reads string, expression and bare props as written', () => {
		const attrs = parseAttrs(
			'<Choice id="a" title=\'t\' review={false} options={[{ text: "x}y", why: `a > b` }]} honor>',
		);
		expect(attrs.get('id')).toEqual({ value: 'a', expr: false });
		expect(attrs.get('title')).toEqual({ value: 't', expr: false });
		expect(attrs.get('review')).toEqual({ value: 'false', expr: true });
		expect(attrs.get('options')).toEqual({ value: '[{ text: "x}y", why: `a > b` }]', expr: true });
		expect(attrs.get('honor')).toEqual({ value: '', expr: false });
	});
	it('accepts whitespace around = and a self-closing end', () => {
		const attrs = parseAttrs('<Sort id = "a"\n  buckets =\n  {[]} items= {[]} />');
		expect([...attrs.entries()]).toEqual([
			['id', { value: 'a', expr: false }],
			['buckets', { value: '[]', expr: true }],
			['items', { value: '[]', expr: true }],
		]);
	});
	it('rejects an unterminated string or expression, an unquoted value, and a token it cannot read', () => {
		expect(() => parseAttrs('<Choice id="a>')).toThrow(/unterminated string for id/);
		expect(() => parseAttrs('<Choice options={[>')).toThrow(/unterminated expression for options/);
		expect(() => parseAttrs('<Choice id=a>')).toThrow(/unquoted value for id/);
		expect(() => parseAttrs('<Choice id="a" {/* note */} title="t">')).toThrow(
			/unexpected "\{\/\* note \*\/\} title=\\"" where a prop name should be/,
		);
		expect(() => parseAttrs('<Choice id="a" {...rest}>')).toThrow(/unexpected/);
	});
});

describe('openingTagEnd', () => {
	it('skips a > inside quotes, braces and template literals, and rejects an unterminated tag', () => {
		const src = '<Choice title="b > c" options={[{ text: `x > y`, why: "p > q" }]}>\nStem';
		expect(src.slice(0, openingTagEnd(src, 0))).toBe(
			'<Choice title="b > c" options={[{ text: `x > y`, why: "p > q" }]}>',
		);
		expect(() => openingTagEnd('<Choice id="a" options={[', 0)).toThrow(/unterminated tag/);
	});
});
