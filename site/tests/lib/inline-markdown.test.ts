import { unsupportedInline } from '@lib/inline-markdown';
import { describe, expect, it } from 'vitest';

describe('unsupportedInline', () => {
	it('names each form the competency page renderer leaves literal', () => {
		expect(unsupportedInline('_a_ and __b__')).toEqual(['underscore emphasis']);
		expect(unsupportedInline('**bold (@AEC-02)**')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('*em (@AEC-02)*')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('[t](/x/ "title")')).toEqual(['link with a title']);
		expect(unsupportedInline("[t](/x/ 'title')")).toEqual(['link with a title']);
		expect(unsupportedInline('_a_ **b (@K)** [t](/x/ "t")')).toHaveLength(3);
	});
	it('accepts the supported subset and the underscores that are not emphasis', () => {
		expect(unsupportedInline('**b** *e* `c` [t](/x/) (@AEC-02) **b** (@AEC-02)')).toEqual([]);
		expect(unsupportedInline('`search_customers` and `_private_`')).toEqual([]);
		expect(unsupportedInline('https://example.com/a_b_c?x_y=1')).toEqual([]);
		expect(unsupportedInline('a lone _ here, and snake_case_name')).toEqual([]);
		expect(unsupportedInline('*a* (@K) *b*')).toEqual([]);
	});
});
