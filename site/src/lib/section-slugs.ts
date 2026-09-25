/**
 * The section slugs of a lesson page and the check of an `assumes[].section`
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
 * runs smart punctuation before it slugs, which turns `'` into `’` and `...`
 * into `…`. The slugger drops both forms, so a heading such as `Doesn't`
 * slugs to `doesnt` either way. `--` is the one input where the two differ,
 * and the build's own check in `MarkdownContent.astro` still catches that.
 * No Astro import, so `scripts/lib/data.mjs` can load it.
 */
import GithubSlugger from 'github-slugger';
import type { MdxNode } from './checkpoint-tags';

/** The node types whose `value` is heading text, as the build reads it. */
const TEXT_TYPES = new Set(['text', 'inlineCode', 'mdxTextExpression']);

function textOf(node: MdxNode): string {
	const value = (node as MdxNode & { value?: unknown }).value;
	if (TEXT_TYPES.has(node.type) && typeof value === 'string') return value;
	return (node.children ?? []).map(textOf).join('');
}

/**
 * The slug of every `## ` heading in `tree`, in page order. Headings of
 * every depth go through the slugger, because a `### ` heading with the
 * same text moves the `-1` suffix to the next one.
 */
export function sectionSlugs(tree: MdxNode): string[] {
	const slugger = new GithubSlugger();
	const out: string[] = [];
	const walk = (node: MdxNode) => {
		if (node.type === 'heading') {
			const slug = slugger.slug(textOf(node));
			if ((node as MdxNode & { depth?: number }).depth === 2) out.push(slug);
			return;
		}
		for (const child of node.children ?? []) walk(child);
	};
	walk(tree);
	return out;
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
