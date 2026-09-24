// @ts-check
/**
 * The `(@key)` citation syntax of spec S03 "Citations and terms", as pure
 * text functions. remark-citations.mjs renders it in lesson pages, and
 * src/lib/citations.ts renders it in text the data tree holds (competency
 * behaviors), so both resolve the same tokens the same way.
 */

export const CITATION = /\(@([^()\n]+?)\)/g;

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
