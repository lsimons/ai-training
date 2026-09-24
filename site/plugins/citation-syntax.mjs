// @ts-check
/**
 * The `(@key)` citation syntax of spec S03 "Citations and terms", as pure
 * text functions. remark-citations.mjs renders it in lesson pages, and
 * src/lib/citations.ts renders it in text the data tree holds (competency
 * behaviors), so both resolve the same tokens the same way.
 */

// Module-private: a `/g` regex carries `lastIndex` state, so callers use the functions below.
const CITATION = /\(@([^()\n]+?)\)/g;

/**
 * @typedef {{ type: 'text', value: string } | { type: 'citation', key: string }} CitationPart
 */

/**
 * `text` split into plain runs and citation tokens, in order. Keys are
 * trimmed. Text without a token comes back as one text part.
 * @param {string} text
 * @returns {CitationPart[]}
 */
export function splitCitations(text) {
	/** @type {CitationPart[]} */
	const out = [];
	let last = 0;
	for (const m of text.matchAll(CITATION)) {
		const index = /** @type {number} */ (m.index);
		if (index > last) out.push({ type: 'text', value: text.slice(last, index) });
		out.push({ type: 'citation', key: (m[1] ?? '').trim() });
		last = index + m[0].length;
	}
	if (last < text.length || out.length === 0) out.push({ type: 'text', value: text.slice(last) });
	return out;
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
 * Reference numbering for one page: `numberOf(key)` is the 1-based number of
 * `key` by first appearance, and `order` holds the keys in that order. An
 * unknown key throws `unknownKeyMessage`, so a typo fails the build.
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
