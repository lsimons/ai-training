/**
 * The lesson entries of the right-hand "On this page" menu (issue #220): one
 * group for the checkpoints and one for the ungraded examples, each entry
 * linking to the item's section id. The checkpoints come from `checkpointsOf`,
 * the reader `mise run checkpoints` and the export use, so the menu and the
 * export cannot disagree. The examples are the `<Predict>` tags without an
 * `objective` (spec S03 "Examples"), which that reader skips on purpose, read
 * here from the same MDX source.
 */
import type { CollectionEntry } from 'astro:content';
import { checkpointsOf, type Lesson } from './lessons';

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

const TAG_START = /<Predict(?=[\s/>])/g;

/**
 * The ungraded examples of a lesson: every `<Predict>` tag without an
 * `objective`, with its `id` and `title`. String props may span lines and
 * contain `>`, so the tag is read prop by prop, not with one regular
 * expression. An expression prop (`{...}`) is skipped by brace depth, with
 * quoted text inside it left alone.
 */
export function examplesOf(body: string, where: string): TocEntry[] {
	const out: TocEntry[] = [];
	for (const match of body.matchAll(TAG_START)) {
		const attrs = readProps(body, match.index + match[0].length, where);
		if (attrs.has('objective')) continue;
		const id = attrs.get('id');
		const title = attrs.get('title');
		if (!id) throw new Error(`${where}: <Predict> without an id`);
		out.push({ id, title: title ?? id });
	}
	return out;
}

/** Reads `name`, `name="text"`, `name='text'` and `name={expr}` until the closing `>` or `/>`. Expression values are stored as `{expr}`. */
function readProps(src: string, start: number, where: string): Map<string, string> {
	const props = new Map<string, string>();
	let i = start;
	const skipSpace = () => {
		while (i < src.length && /\s/.test(src[i] as string)) i++;
	};
	for (;;) {
		skipSpace();
		if (i >= src.length) throw new Error(`${where}: unterminated <Predict> tag`);
		if (src[i] === '>') return props;
		if (src.startsWith('/>', i)) return props;
		const name = /^[A-Za-z_][\w-]*/.exec(src.slice(i))?.[0];
		if (!name) throw new Error(`${where}: unexpected ${JSON.stringify(src.slice(i, i + 20))} in a <Predict> tag`);
		i += name.length;
		skipSpace();
		if (src[i] !== '=') {
			props.set(name, '');
			continue;
		}
		i++;
		skipSpace();
		const open = src[i];
		if (open === '"' || open === "'") {
			const end = src.indexOf(open, i + 1);
			if (end < 0) throw new Error(`${where}: unterminated string for ${name} in a <Predict> tag`);
			props.set(name, src.slice(i + 1, end));
			i = end + 1;
		} else if (open === '{') {
			const end = closingBrace(src, i);
			if (end < 0) throw new Error(`${where}: unterminated expression for ${name} in a <Predict> tag`);
			props.set(name, src.slice(i, end + 1));
			i = end + 1;
		} else {
			throw new Error(`${where}: unquoted value for ${name} in a <Predict> tag`);
		}
	}
}

/** The index of the `}` closing the `{` at `open`, skipping quoted text, or -1. */
function closingBrace(src: string, open: number): number {
	let depth = 0;
	let quote: string | undefined;
	for (let i = open; i < src.length; i++) {
		const c = src[i];
		if (quote) {
			if (c === '\\') i++;
			else if (c === quote) quote = undefined;
		} else if (c === '"' || c === "'" || c === '`') quote = c;
		else if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/**
 * The menu groups of a lesson, in the order the menu shows them, without the
 * empty ones. An id used twice on the page fails the build, because the
 * entries link by id.
 */
export function lessonTocGroups(lesson: Lesson): TocGroup[] {
	const checkpoints = checkpointsOf(lesson).map(({ id, title }) => ({ id, title }));
	const examples = examplesOf(lesson.body ?? '', lesson.id);
	const seen = new Set<string>();
	for (const { id } of [...checkpoints, ...examples]) {
		if (seen.has(id)) throw new Error(`${lesson.id}: the id "${id}" is used by two checkpoints or examples`);
		seen.add(id);
	}
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
