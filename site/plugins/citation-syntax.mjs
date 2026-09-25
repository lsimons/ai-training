// @ts-check
/**
 * The `(@key)` citation syntax of spec S03 "Citations and terms", as pure
 * text functions. remark-citations.mjs renders it in lesson pages, and
 * src/lib/citations.ts renders it in text the data tree holds (competency
 * behaviors), so both resolve the same tokens the same way.
 */

// Module-private: a `/g` regex carries `lastIndex` state, so callers use the functions below.
// The key may contain whitespace, newlines included, so a token that a
// rewrap splits over a soft line break still resolves. `isCitation` rejects
// a candidate that spans a blank line.
const CITATION = /\(@([^()]+?)\)/g;
const BLANK_LINE = /\n[ \t]*\n/;
const WHITESPACE_RUN = /\s+/g;

/**
 * Whether a `(@...)` candidate is a citation. A blank line inside it means
 * the token spans a paragraph break. remark never puts one inside a text
 * node, so the plugin could not resolve such a token, and `citationKeys`
 * on raw source must agree with the plugin.
 * @param {string} inner the text between `(@` and `)`
 */
function isCitation(inner) {
	return !BLANK_LINE.test(inner);
}

/**
 * The lookup key for the text between `(@` and `)`: trimmed, with every run
 * of whitespace (a soft line break and its indentation included) collapsed
 * to one space.
 * @param {string} inner
 */
function normalizeKey(inner) {
	return inner.replace(WHITESPACE_RUN, ' ').trim();
}

/**
 * @typedef {{ type: 'text', value: string } | { type: 'citation', key: string }} CitationPart
 */

/**
 * `text` split into plain runs and citation tokens, in order. Keys are
 * trimmed and their inner whitespace collapsed, so `(@Claude Code\n
 * permissions)` is the key `Claude Code permissions`. Text without a token
 * comes back as one text part.
 * @param {string} text
 * @returns {CitationPart[]}
 */
export function splitCitations(text) {
	/** @type {CitationPart[]} */
	const out = [];
	let last = 0;
	for (const m of text.matchAll(CITATION)) {
		const inner = m[1] ?? '';
		if (!isCitation(inner)) continue;
		const index = /** @type {number} */ (m.index);
		if (index > last) out.push({ type: 'text', value: text.slice(last, index) });
		out.push({ type: 'citation', key: normalizeKey(inner) });
		last = index + m[0].length;
	}
	if (last < text.length || out.length === 0) out.push({ type: 'text', value: text.slice(last) });
	return out;
}

/**
 * The position of every citation token in `text`, in order, as the index of
 * its `(` and the length through its `)`. It finds the same tokens as
 * `splitCitations`, so a plugin that must leave citations alone, such as
 * remark-terms.mjs, skips exactly the text remark-citations.mjs resolves.
 * @param {string} text
 * @returns {Array<{ index: number, length: number }>}
 */
export function citationSpans(text) {
	/** @type {Array<{ index: number, length: number }>} */
	const spans = [];
	for (const m of text.matchAll(CITATION)) {
		if (!isCitation(m[1] ?? '')) continue;
		spans.push({ index: /** @type {number} */ (m.index), length: m[0].length });
	}
	return spans;
}

/**
 * The citation keys in `source`, in order of first appearance. This scans raw
 * text, so it also sees a `(@key)` inside a code block, which the remark
 * plugin leaves alone; the data check accepts that, because no lesson shows
 * the syntax in code.
 * @param {string} source
 * @returns {string[]}
 */
export function citationKeys(source) {
	/** @type {string[]} */
	const keys = [];
	for (const part of splitCitations(source)) {
		if (part.type === 'citation' && !keys.includes(part.key)) keys.push(part.key);
	}
	return keys;
}

/**
 * The error for a `(@key)` whose key the bibliography lacks. `where` names
 * the page or the competency, the way its renderer reports it.
 * @param {string} where
 * @param {string} key
 */
export function unknownKeyMessage(where, key) {
	return `${where}: unknown citation key "${key}". Keys are defined in site/src/data/bibliography.yaml.`;
}

/**
 * Whether `key` holds more than one key. Spec S03 defines one key per
 * `(@key)` token, so a second `@` inside one, as in `(@a, @b)`, is a
 * mistake that would otherwise be reported as one unknown key.
 * @param {string} key
 */
export function hasMultipleKeys(key) {
	return key.includes('@');
}

/**
 * The error for a token that holds more than one key. `where` names the
 * page or the competency, the way its renderer reports it.
 * @param {string} where
 * @param {string} key
 */
export function multipleKeysMessage(where, key) {
	return `${where}: citation key "${key}" contains "@". Write one key per token: (@a) (@b).`;
}

/**
 * Reference numbering for one page: `numberOf(key)` is the 1-based number of
 * `key` by first appearance, and `order` holds the keys in that order. An
 * unknown key throws `unknownKeyMessage`, so a typo fails the build, and a
 * token with more than one key throws `multipleKeysMessage`.
 * @param {Record<string, unknown>} bibliography
 * @param {string} where
 * @returns {{ numberOf: (key: string) => number, order: string[] }}
 */
export function createNumbering(bibliography, where) {
	/** @type {string[]} */
	const order = [];
	return {
		order,
		numberOf(key) {
			let n = order.indexOf(key);
			if (n === -1) {
				if (hasMultipleKeys(key)) throw new Error(multipleKeysMessage(where, key));
				if (!(key in bibliography)) throw new Error(unknownKeyMessage(where, key));
				order.push(key);
				n = order.length - 1;
			}
			return n + 1;
		},
	};
}

/**
 * @typedef {{ type: 'text', value: string } | { type: 'title', value: string, url: string | null } | { type: 'code', value: string }} ReferencePart
 */

/**
 * One reference entry as format-free parts, so the lesson page (mdast) and
 * the competency page (HTML) show the same text: author, title (linked when
 * the entry has a public url), container when it differs from the title,
 * type, and the key as code.
 * @param {string} key
 * @param {{ type?: string, title: string, container?: string | null, author?: string | null, url?: string | null }} entry
 * @returns {ReferencePart[]}
 */
export function referenceParts(key, entry) {
	/** @type {ReferencePart[]} */
	const parts = [];
	if (entry.author) parts.push({ type: 'text', value: `${entry.author}. ` });
	parts.push({ type: 'title', value: entry.title, url: entry.url ?? null });
	parts.push({ type: 'text', value: '.' });
	if (entry.container && entry.container !== entry.title) parts.push({ type: 'text', value: ` ${entry.container}.` });
	if (entry.type) parts.push({ type: 'text', value: ` ${capitalize(entry.type)}.` });
	parts.push({ type: 'text', value: ' ' }, { type: 'code', value: key });
	return parts;
}

/** @param {string} s */
function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
