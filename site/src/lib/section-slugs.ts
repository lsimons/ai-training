/**
 * The heading and section slugs of a lesson page and the check of an `assumes[].section`
 * against them (spec S11). A lesson file's `assumes` entry names the lesson
 * and the `## ` section that teach an objective, and the page links to
 * `/<lesson>/#<section>`, so the section must be the id the build gives
 * that heading.
 *
 * The build gives heading ids in `rehypeHeadingIds`
 * (`@astrojs/markdown-remark`, `rehype-collect-headings.js`): one
 * `github-slugger` instance per page, fed the text of each heading in page
 * order, so a repeated heading gets `-1`, `-2` and so on. This does the
 * same over the MDX tree that `lib/checkpoint-tags.ts` parses. The build
 * runs smart punctuation (`remark-smartypants` with its defaults) before it
 * slugs, which turns `'` into `’`, `...` into `…` and a lone `--` into an
 * em dash, and leaves `---` as it is. The slugger drops `'`, `’` and `…`
 * alike, so a heading such as `Doesn't` slugs to `doesnt` either way. The
 * dash does change the slug (`Plan -- then act` is `plan--then-act` on the
 * page), so `textOf` turns a lone `--` in a text node into an em dash
 * first. A site build confirmed all three dash cases. The `## References`
 * heading the citation plugin appends is not in the MDX source, so it is
 * never a valid `section`, on purpose: an objective is taught in the
 * lesson's own sections. No Astro import, so `scripts/lib/data.mjs` can
 * load it.
 */
import GithubSlugger from 'github-slugger';
import type { MdxNode } from './checkpoint-tags';

/** The node types whose `value` is heading text, as the build reads it. */
const TEXT_TYPES = new Set(['text', 'inlineCode', 'mdxTextExpression']);

/** A `--` that is not part of a longer run of hyphens, which smart punctuation makes an em dash. */
const LONE_DOUBLE_DASH = /(?<!-)--(?!-)/g;

function textOf(node: MdxNode): string {
	const value = (node as MdxNode & { value?: unknown }).value;
	// Smart punctuation rewrites prose text only, never a code span or an expression.
	if (node.type === 'text' && typeof value === 'string') return value.replace(LONE_DOUBLE_DASH, '—');
	if (TEXT_TYPES.has(node.type) && typeof value === 'string') return value;
	return (node.children ?? []).map(textOf).join('');
}

/** The depth and the slug of every heading in `tree`, in page order, from one slugger as the build uses. */
function headings(tree: MdxNode): { depth: number | undefined; slug: string }[] {
	const slugger = new GithubSlugger();
	const out: { depth: number | undefined; slug: string }[] = [];
	const walk = (node: MdxNode) => {
		if (node.type === 'heading') {
			out.push({ depth: (node as MdxNode & { depth?: number }).depth, slug: slugger.slug(textOf(node)) });
			return;
		}
		for (const child of node.children ?? []) walk(child);
	};
	walk(tree);
	return out;
}

/**
 * The slug of every `## ` heading in `tree`, in page order. Headings of
 * every depth go through the slugger, because a `### ` heading with the
 * same text moves the `-1` suffix to the next one.
 */
export function sectionSlugs(tree: MdxNode): string[] {
	return headings(tree)
		.filter((h) => h.depth === 2)
		.map((h) => h.slug);
}

/**
 * The slug of every heading in `tree`, at any depth, in page order. Each one
 * is a DOM id on the page, so `lib/habit-tags.ts` keeps a habit id off them.
 */
export function headingSlugs(tree: MdxNode): string[] {
	return headings(tree).map((h) => h.slug);
}

/**
 * The error for an `assumes` entry whose `section` is not one of `slugs`,
 * the `## ` sections of the page of `lesson`, or `null` when it is one.
 * `where` names the lesson file.
 */
export function assumedSectionError(where: string, lesson: string, section: string, slugs: string[]): string | null {
	if (slugs.includes(section)) return null;
	return `${where}: assumes section "${section}", which is not a "## " heading of ${lesson}; its sections are: ${slugs.join(', ')}`;
}
