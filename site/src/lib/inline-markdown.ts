/**
 * The inline Markdown patterns `renderInline` (`lib/reference.ts`) renders,
 * and the detector for the forms the competency page renderer
 * (`lib/citations.ts`) leaves literal. This module imports nothing, so
 * `scripts/lib/data.mjs` can run it under bun outside Astro.
 */

/** A code span, with its text as group 1. */
export const CODE_SPAN = /`([^`]+)`/g;
/** `**strong**`, with its text as group 1. */
export const STRONG = /\*\*([^*]+)\*\*/g;
/** `*emphasis*`. It needs a non-space right inside each `*`, as in CommonMark, so `2 * 3 * 4` stays literal. */
export const EMPHASIS = /\*(\S(?:[^*]*\S)?)\*/g;
/** `[text](url)` with no title, text as group 1 and url as group 2. */
export const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** A `(@key)` citation token, as `renderProse` drops it and `lib/citations.ts` splits on it. */
const CITATION = /\(@[A-Za-z0-9-]+\)/;
/** `_x_` or `__x__` at a word edge, so `snake_case`, a URL path segment and a lone `_` stay out. */
const UNDERSCORE_EMPHASIS = /(?:^|[^\w])(_{1,2})\S(?:[^_]*?\S)?\1(?!\w)/;
/** A link whose target is followed by a title, `[t](/x/ "title")`. */
const LINK_WITH_TITLE = /\[[^\]]+\]\([^)\s]+\s+[^)]+\)/;

/**
 * The names of the Markdown forms in `md`, outside code spans, that the
 * competency page renderer leaves literal. Underscore emphasis and a link
 * with a title are forms `renderInline` never renders. Strong or emphasis
 * around a `(@key)` citation renders on a lesson recap, but the competency
 * page splits the text at each citation before calling `renderInline`, so
 * the span breaks there. Empty when every form in `md` is supported.
 * `mise run data` fails a behavior that uses one (spec S10).
 */
export function unsupportedInline(md: string): string[] {
	const prose = md.replace(CODE_SPAN, '');
	const found: string[] = [];
	if (UNDERSCORE_EMPHASIS.test(prose)) found.push('underscore emphasis');
	const spans = [...prose.matchAll(STRONG), ...prose.matchAll(EMPHASIS)];
	if (spans.some((m) => CITATION.test(m[1] ?? ''))) found.push('strong or emphasis around a citation');
	if (LINK_WITH_TITLE.test(prose)) found.push('link with a title');
	return found;
}
