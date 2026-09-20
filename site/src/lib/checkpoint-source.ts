import { type CheckpointKind, type CheckpointTag, KIND_OF_TAG } from './checkpoint-rules';

/**
 * The checkpoint tag scanner: finds every `<Choice ...>` (and the other kinds
 * in `KIND_OF_TAG`) in a lesson's MDX source and reads its props and stem.
 * No Astro import, so `lib/lessons.ts`, the review page, the export and the
 * command-line gate (`scripts/lib/checkpoints.mjs`) all read a tag the same
 * way. A hand-written scanner is a stopgap for reading the MDX AST; the
 * follow-up issue linked from PR #83 tracks that.
 */

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

/** The form every checkpoint writes its concepts in; error messages show it. */
export const CONCEPTS_FORM = "concepts={['concept-id', ...]}";

const TAG_START = new RegExp(`<(${Object.keys(KIND_OF_TAG).join('|')})\\b`, 'g');

/**
 * The end (exclusive) of a JSX opening tag that starts at `start`: the index
 * after its `>`, skipping any `>` inside quoted strings or `{...}` expressions
 * (option arrays, template literals).
 */
export function openingTagEnd(src: string, start: number): number {
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
 * The props of an opening tag (`<Tag a="x" b = {expr} c>`), by name. A string
 * prop keeps its text, an expression prop keeps the text inside the braces,
 * and a bare prop has an empty value. Whitespace around `=` is allowed. JSX
 * string props have no escapes, and an expression may nest braces and hold
 * quoted strings with `>` or `}`. Anything else (a stray `{...}` child, a
 * spread, a bare `=`) throws, so a tag the scanner cannot read fails the
 * build instead of losing the props after the token.
 */
export function parseAttrs(tag: string): Map<string, CheckpointAttr> {
	const attrs = new Map<string, CheckpointAttr>();
	let i = /^<[A-Za-z]+/.exec(tag)?.[0].length ?? tag.length;
	const rest = () => tag.slice(i);
	while (i < tag.length) {
		const ws = /^\s*/.exec(rest())?.[0].length ?? 0;
		i += ws;
		if (/^\/?>$/.test(rest())) break;
		const m = /^([A-Za-z_][\w-]*)/.exec(rest());
		if (!m) throw new Error(`unexpected ${JSON.stringify(rest().slice(0, 20))} where a prop name should be`);
		const name = m[1] as string;
		i += m[0].length;
		const eq = /^\s*=\s*/.exec(rest());
		if (!eq) {
			attrs.set(name, { value: '', expr: false });
			continue;
		}
		i += eq[0].length;
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
 * The checkpoint tags in `src`: the component name, its props, and the
 * children as Markdown (empty for a self-closing tag). `where` names the
 * lesson in error messages. The scanner only knows the tags in
 * `KIND_OF_TAG`, so a new kind enters there first. A `<Predict>` with no
 * `objective` is an ungraded example, not a checkpoint, and is skipped,
 * but its `id` still counts: every tag's string `id` must be unique in
 * the page, because each one becomes a DOM id.
 */
export function scanCheckpointTags(src: string, where: string): CheckpointTagInfo[] {
	const out: CheckpointTagInfo[] = [];
	const ids = new Set<string>();
	for (const m of src.matchAll(TAG_START)) {
		const tag = m[1] as CheckpointTag;
		const kind: CheckpointKind | undefined = KIND_OF_TAG[tag];
		if (!kind) throw new Error(`${where}: unknown checkpoint tag <${m[1]}>`);
		const end = openingTagEnd(src, m.index);
		const opening = src.slice(m.index, end);
		let attrs: Map<string, CheckpointAttr>;
		try {
			attrs = parseAttrs(opening);
		} catch (e) {
			throw new Error(`${where}: <${tag}> ${(e as Error).message}: ${opening.slice(0, 80)}`);
		}
		const id = attrs.get('id');
		if (id && !id.expr) {
			if (ids.has(id.value)) throw new Error(`${where}: id "${id.value}" is used twice`);
			ids.add(id.value);
		}
		// A Predict without an objective is an ungraded example (spec S03 "Examples"): CI runs its fixture,
		// the page shows the output, and it is not a checkpoint anywhere.
		if (tag === 'Predict' && !attrs.has('objective')) continue;
		let stem = '';
		if (!/\/\s*>$/.test(opening)) {
			const close = src.indexOf(`</${tag}>`, end);
			if (close === -1) throw new Error(`${where}: <${tag}> without a closing tag: ${opening.slice(0, 80)}`);
			stem = src.slice(end, close).trim();
		}
		out.push({ tag, kind, attrs, stem });
	}
	return out;
}

/**
 * The value of an expression prop (`options={[...]}`), evaluated. The
 * expressions are JavaScript literals written by the lesson authors in this
 * repository and evaluated at build only, so `Function` is the parser here
 * rather than a second JSX-literal grammar. `where` names the checkpoint.
 */
export function evaluateProp(where: string, name: string, expr: string): unknown {
	try {
		return new Function(`return (${expr});`)();
	} catch (e) {
		throw new Error(`${where}: cannot evaluate ${name}={...}: ${(e as Error).message}`);
	}
}

/** A prop's value: the string text, or the evaluated expression. `undefined` when absent. */
export function propValue(where: string, attrs: Map<string, CheckpointAttr>, name: string): unknown {
	const a = attrs.get(name);
	if (!a) return undefined;
	return a.expr ? evaluateProp(where, name, a.value) : a.value;
}

/** A prop that must be a string when present: `name="text"` or `name={'text'}`. */
export function stringProp(where: string, attrs: Map<string, CheckpointAttr>, name: string): string | undefined {
	const v = propValue(where, attrs, name);
	if (v !== undefined && typeof v !== 'string') throw new Error(`${where}: ${name} must be a string, got ${typeof v}`);
	return v;
}
