/**
 * The opening-tag reader the prose renderer uses (`lib/lesson-bundles.ts`):
 * the extent of a `<Tag ...>` in text and its props as they are written. The
 * renderer works on the lesson source with its code set aside behind
 * placeholders, which the MDX parser cannot see, so it reads the tags from
 * the text. Checkpoint props are read from the MDX tree instead
 * (`lib/checkpoint-tags.ts`). Anything a tag needs at build time beyond a
 * string prop's text belongs there.
 */

/** One prop as written: `name="text"` (`expr` false), `name={...}` (`expr` true, the text inside the braces) or bare `name` (empty value). */
export interface SourceAttr {
	value: string;
	expr: boolean;
}

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
export function parseAttrs(tag: string): Map<string, SourceAttr> {
	const attrs = new Map<string, SourceAttr>();
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
