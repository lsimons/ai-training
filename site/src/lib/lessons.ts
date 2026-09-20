import { type CollectionEntry, getCollection } from 'astro:content';
import {
	type CheckpointKind,
	type CheckpointTag,
	DEFAULT_REVISION,
	isReviewable,
	KIND_OF_TAG,
} from './checkpoint-rules';

export type Lesson = CollectionEntry<'docs'>;

export interface CheckpointInfo {
	id: string;
	title: string;
	kind: CheckpointKind;
	reviewable: boolean;
	/** Bumped by authors when the answer changes (spec S05 "Content changes"). */
	revision: number;
	/** The one learning objective the checkpoint evidences (spec S03 "Checkpoints"). */
	objective: string;
	/** The S02 concept ids the checkpoint exercises, at least one (spec S03 "Checkpoints"). */
	concepts: string[];
	/** One paragraph that makes the item readable outside its lesson, shown on the review page. */
	context: string | undefined;
	hint: string;
	/** The children of the tag, as Markdown source. Empty for a self-closing tag. */
	stem: string;
}

/** One prop of a checkpoint tag: `name="text"` (`expr` false) or `name={...}` (`expr` true, the text inside the braces). */
export interface CheckpointAttr {
	value: string;
	expr: boolean;
}

/** A checkpoint tag as it appears in the MDX source, before any rule is applied. */
export interface CheckpointTagInfo {
	tag: CheckpointTag;
	kind: CheckpointKind;
	attrs: Map<string, CheckpointAttr>;
	stem: string;
}

const TAG_START = new RegExp(`<(${Object.keys(KIND_OF_TAG).join('|')})\\b`, 'g');

/** Every lesson: a docs entry with `mode` in its frontmatter. */
export async function getLessons(area?: string): Promise<Lesson[]> {
	const docs = await getCollection('docs');
	return docs
		.filter((d) => Boolean(d.data.mode))
		.filter((d) => !area || d.id.startsWith(`${area}/`))
		.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The end (exclusive) of a JSX opening tag that starts at `start`: the index
 * after its `>`, skipping any `>` inside quoted strings or `{...}` expressions
 * (option arrays, template literals).
 */
function openingTagEnd(src: string, start: number): number {
	let depth = 0;
	let quote: string | null = null;
	for (let i = start; i < src.length; i++) {
		const ch = src[i];
		if (quote) {
			if (ch === '\\') i++;
			else if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') quote = ch;
		else if (ch === '{') depth++;
		else if (ch === '}') depth--;
		else if (ch === '>' && depth === 0) return i + 1;
	}
	throw new Error(`unterminated tag starting at offset ${start}: ${src.slice(start, start + 60)}`);
}

/** The index of the `}` that closes the `{` at `open`, skipping braces inside quoted strings. */
function closingBrace(text: string, open: number): number {
	let depth = 0;
	let quote: string | null = null;
	for (let j = open; j < text.length; j++) {
		const ch = text[j];
		if (quote) {
			if (ch === '\\') j++;
			else if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') quote = ch;
		else if (ch === '{') depth++;
		else if (ch === '}' && --depth === 0) return j;
	}
	return -1;
}

/**
 * The props of an opening tag (`<Tag a="x" b={expr} c>`), by name. A string
 * prop keeps its text, an expression prop keeps the text inside the braces,
 * and a bare prop has an empty value. JSX string props have no escapes, and
 * an expression may nest braces and hold quoted strings with `>` or `}`.
 */
export function parseAttrs(tag: string): Map<string, CheckpointAttr> {
	const attrs = new Map<string, CheckpointAttr>();
	let i = /^<[A-Za-z]+/.exec(tag)?.[0].length ?? tag.length;
	while (i < tag.length) {
		const m = /^\s*([A-Za-z_][\w-]*)/.exec(tag.slice(i));
		if (!m) break;
		const name = m[1] as string;
		i += m[0].length;
		if (tag[i] !== '=') {
			attrs.set(name, { value: '', expr: false });
			continue;
		}
		i++;
		const open = tag[i];
		if (open === '"' || open === "'") {
			const close = tag.indexOf(open, i + 1);
			if (close === -1) throw new Error(`unterminated string for ${name}`);
			attrs.set(name, { value: tag.slice(i + 1, close), expr: false });
			i = close + 1;
		} else if (open === '{') {
			const close = closingBrace(tag, i);
			if (close === -1) throw new Error(`unterminated expression for ${name}`);
			attrs.set(name, { value: tag.slice(i + 1, close).trim(), expr: true });
			i = close + 1;
		} else {
			throw new Error(`unquoted value for ${name}`);
		}
	}
	return attrs;
}

/**
 * The checkpoint tags of a lesson, read from its MDX source: the component
 * name, its props, and the children as Markdown. The scanner only knows the
 * tags in `KIND_OF_TAG`, so a new kind enters there first.
 */
export function checkpointTagsOf(lesson: Lesson): CheckpointTagInfo[] {
	const src = lesson.body ?? '';
	const out: CheckpointTagInfo[] = [];
	for (const m of src.matchAll(TAG_START)) {
		const tag = m[1] as CheckpointTag;
		const kind: CheckpointKind | undefined = KIND_OF_TAG[tag];
		if (!kind) throw new Error(`${lesson.id}: unknown checkpoint tag <${m[1]}>`);
		const end = openingTagEnd(src, m.index);
		const opening = src.slice(m.index, end);
		let attrs: Map<string, CheckpointAttr>;
		try {
			attrs = parseAttrs(opening);
		} catch (e) {
			throw new Error(`${lesson.id}: <${tag}> ${(e as Error).message}: ${opening.slice(0, 80)}`);
		}
		let stem = '';
		if (!/\/\s*>$/.test(opening)) {
			const close = src.indexOf(`</${tag}>`, end);
			if (close === -1) throw new Error(`${lesson.id}: <${tag}> without a closing tag: ${opening.slice(0, 80)}`);
			stem = src.slice(end, close).trim();
		}
		out.push({ tag, kind, attrs, stem });
	}
	return out;
}

/** The quoted strings of a `['a', 'b']` array expression, in order. */
function stringList(expr: string): string[] {
	return [...expr.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((m) => m[2] as string);
}

/**
 * The checkpoints of a lesson, read from its MDX source. Component ids are
 * the checkpoint ids (spec S03). Reviewability follows the same rule the
 * component uses for `data-reviewable` (`lib/checkpoint-rules.ts`). Concept
 * ids are read here and checked against the topics by the caller
 * (`lib/concepts.ts`), since the source scan has no collection access.
 */
export function checkpointsOf(lesson: Lesson): CheckpointInfo[] {
	return checkpointTagsOf(lesson).map(({ tag, kind, attrs, stem }) => {
		const str = (name: string) => attrs.get(name)?.value;
		const id = str('id');
		if (!id) throw new Error(`${lesson.id}: <${tag}> without an id`);
		const where = `${lesson.id}#${id}`;
		const title = str('title') ?? id;
		const reviewAttr = str('review');
		if (reviewAttr !== undefined && reviewAttr !== 'true' && reviewAttr !== 'false') {
			throw new Error(`${where}: review must be {true} or {false}, got ${reviewAttr}`);
		}
		const revisionAttr = str('revision');
		const revision = revisionAttr === undefined ? DEFAULT_REVISION : Number(revisionAttr);
		if (!Number.isInteger(revision) || revision < 1)
			throw new Error(`${where}: revision must be a positive integer, got ${revisionAttr}`);
		const conceptsAttr = attrs.get('concepts');
		if (!conceptsAttr?.expr) throw new Error(`${where}: concepts={['concept-id', ...]} is required`);
		const concepts = stringList(conceptsAttr.value);
		if (concepts.length === 0) throw new Error(`${where}: concepts needs at least one concept id`);
		const honor = kind === 'predict' && !attrs.has('answer');
		return {
			id,
			title,
			kind,
			revision,
			reviewable: isReviewable({ kind, review: reviewAttr === undefined ? undefined : reviewAttr === 'true', honor }),
			objective: str('objective') ?? '',
			concepts,
			context: str('context'),
			hint: str('hint') ?? '',
			stem,
		};
	});
}
