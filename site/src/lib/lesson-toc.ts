/**
 * The lesson entries of the right-hand "On this page" menu (issue #220): one
 * group for the checkpoints and one for the ungraded examples, each entry
 * linking to the item's section id. The checkpoints come from the reader
 * `mise run checkpoints` and the export use (`checkpointTagsIn` and
 * `checkpointOf`), so the menu and the export cannot disagree. The examples are the `<Predict>` tags without an
 * `objective` (spec S03 "Examples"), which that reader skips on purpose, read
 * here from the same MDX tree.
 */
import type { CollectionEntry } from 'astro:content';
import { attrsOf, checkpointTagsIn, jsxElements, type MdxNode, parseMdx, stringProp } from './checkpoint-tags';
import { checkpointOf, type Lesson } from './lessons';

export interface TocEntry {
	/** The section id on the page, so the link is `#<id>`. */
	id: string;
	title: string;
}

export interface TocGroup {
	label: 'Checkpoints' | 'Examples';
	/** The label in lower case, for element ids. */
	slug: 'checkpoints' | 'examples';
	entries: TocEntry[];
}

/** The part of Starlight's `toc` route data the menu decides on. */
export interface TocShape {
	items: { children: unknown[] }[];
}

/** A docs entry is a lesson page when the lesson docs loader set `mode` on it (`lib/lessons.ts`). */
export function isLessonEntry(entry: CollectionEntry<'docs'>): entry is Lesson {
	return Boolean(entry.data.mode);
}

/**
 * The ungraded examples of a lesson: every `<Predict>` element without an
 * `objective`, with its `id` and `title`, read from the MDX tree the way the
 * checkpoint reader reads the checkpoints (`lib/checkpoint-tags.ts`). A tag
 * in a fenced code block or a comment is text to the parser and so is no
 * example, an entity in a prop is decoded, and `title={'Run it'}` reads as
 * its string.
 */
export function examplesOf(body: string, where: string): TocEntry[] {
	return examplesIn(parseLesson(body, where), where);
}

/** The MDX tree of a lesson body. A parse error names `where`. */
function parseLesson(body: string, where: string): MdxNode {
	try {
		return parseMdx(body);
	} catch (e) {
		throw new Error(`${where}: ${(e as Error).message}`);
	}
}

/** The ungraded examples in an already parsed lesson `tree` (see `examplesOf`). */
function examplesIn(tree: MdxNode, where: string): TocEntry[] {
	const out: TocEntry[] = [];
	for (const node of jsxElements(tree)) {
		if (node.name !== 'Predict') continue;
		const attrs = attrsOf(node, where);
		if (attrs.has('objective')) continue;
		const id = stringProp(`${where} <Predict>`, attrs, 'id');
		if (!id) throw new Error(`${where}: <Predict> without an id`);
		out.push({ id, title: stringProp(`${where}#${id}`, attrs, 'title') ?? id });
	}
	return out;
}

/**
 * The menu groups of a lesson, in the order the menu shows them, without the
 * empty ones. The body is parsed once and both groups are read from that
 * tree. The ids are unique across checkpoints and examples: the checkpoint
 * reader rejects a repeated `id` on any tag it knows, ungraded `<Predict>`
 * included, before the examples are read.
 */
export function lessonTocGroups(lesson: Lesson): TocGroup[] {
	const body = lesson.body ?? '';
	const tree = parseLesson(body, lesson.id);
	const checkpoints = checkpointTagsIn(tree, body, lesson.id)
		.map((t) => checkpointOf(lesson, t))
		.map(({ id, title }) => ({ id, title }));
	const examples = examplesIn(tree, lesson.id);
	const groups: TocGroup[] = [
		{ label: 'Checkpoints', slug: 'checkpoints', entries: checkpoints },
		{ label: 'Examples', slug: 'examples', entries: examples },
	];
	return groups.filter((g) => g.entries.length > 0);
}

/**
 * Whether the menu renders. Starlight always lists the page title, so a page
 * with no other heading and no lesson entries hides the menu (the right
 * column stays). A lesson with checkpoints but no headings still shows it.
 */
export function showToc(toc: TocShape | undefined, groups: TocGroup[]): boolean {
	if (!toc) return false;
	if (groups.length > 0) return true;
	return !(toc.items.length === 1 && toc.items[0]?.children.length === 0);
}
