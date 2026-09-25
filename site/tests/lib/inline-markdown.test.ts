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
	it('finds a citation whose key has spaces or a dot, as the remark plugin does', () => {
		expect(unsupportedInline('**x (@Key with spaces)**')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('*x (@Claude Code permissions)*')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('**x (@a.b v2)**')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('**x (@Key with spaces)** and *y* (@Another key)')).toEqual([
			'strong or emphasis around a citation',
		]);
		expect(unsupportedInline('**x** (@Key with spaces) *y*')).toEqual([]);
	});
	it('accepts the supported subset and the underscores that are not emphasis', () => {
		expect(unsupportedInline('**b** *e* `c` [t](/x/) (@AEC-02) **b** (@AEC-02)')).toEqual([]);
		expect(unsupportedInline('`search_customers` and `_private_`')).toEqual([]);
		expect(unsupportedInline('https://example.com/a_b_c?x_y=1')).toEqual([]);
		expect(unsupportedInline('a lone _ here, and snake_case_name')).toEqual([]);
		expect(unsupportedInline('*a* (@K) *b*')).toEqual([]);
		expect(unsupportedInline('`__init__.py` and `/x/_y_/`')).toEqual([]);
	});
	it('reads emphasis after strong, as the renderer does, so a strong run lends no star to emphasis', () => {
		// The emphasis pattern alone can take a whole `**a**` run, so the bare form passed only by luck. After a
		// lone star it takes `*3 **` and then the inner `*(@K)*` of the two `**` runs.
		expect(unsupportedInline('**a**(@K)**b**')).toEqual([]);
		expect(unsupportedInline('2*3 **a**(@K)**b**')).toEqual([]);
		expect(unsupportedInline('**a**(@K) x*y*')).toEqual([]);
		// A citation after a `**` run that never closes is outside every span.
		expect(unsupportedInline('**a (@K)')).toEqual([]);
		expect(unsupportedInline('**a**(@K)')).toEqual([]);
		// Two single-star runs with no spaces: the first match ends at the first run.
		expect(unsupportedInline('*a*(@K)*b*')).toEqual([]);
		// The forms that do wrap the citation still report.
		expect(unsupportedInline('*a (@K)*')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('**a (@K)**')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('***a (@K)***')).toEqual(['strong or emphasis around a citation']);
		expect(unsupportedInline('**a** *b (@K)* **c**')).toEqual(['strong or emphasis around a citation']);
		// A `**` that never closes is two literal stars to the strong pattern, so the renderer reads `*a (@K)` as emphasis.
		expect(unsupportedInline('**a (@K)* x*')).toEqual(['strong or emphasis around a citation']);
		// Underscore emphasis is its own finding, reported once whatever it wraps.
		expect(unsupportedInline('_a (@K)_')).toEqual(['underscore emphasis']);
	});
	it('flags a dunder name or an underscored path segment outside a code span, as CommonMark renders them', () => {
		expect(unsupportedInline('__init__.py')).toEqual(['underscore emphasis']);
		expect(unsupportedInline('/x/_y_/')).toEqual(['underscore emphasis']);
	});
});
