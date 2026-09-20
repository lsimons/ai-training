// @ts-check
/**
 * Terms per spec S03 "Citations and terms": in a lesson (a page with `mode`
 * in its frontmatter), the first mention of a concept from one of the topics
 * the lesson `covers` is a term. It renders as a link to the concept's
 * glossary anchor (`/glossary/#<concept>`, root-relative; the rehype base
 * plugin in astro.config.mjs adds the deploy base) with the glossary
 * definition in its `title`, so it shows on hover. Later mentions stay plain
 * text.
 *
 * Matching is case-insensitive on the concept name as a whole phrase, with an
 * optional plural `s` or `es`. Headings, links and code are never marked.
 */

/** Parents whose text is never scanned for terms. */
const SKIP = new Set(['code', 'inlineCode', 'link', 'linkReference', 'heading']);

/**
 * @param {{ topics: Array<{ id: string, concepts: Array<{ id: string, name: string, definition: string }> }> }} options
 */
export function remarkTerms({ topics }) {
	if (!Array.isArray(topics)) throw new Error('remarkTerms needs the parsed topic list');
	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const frontmatter = file.data?.astro?.frontmatter;
		if (!frontmatter?.mode) return;
		/** @type {string[]} */
		const covers = Array.isArray(frontmatter.covers) ? frontmatter.covers : [];
		if (covers.length === 0) return;

		const pending = topics
			.filter((t) => covers.includes(t.id))
			.flatMap((t) => t.concepts)
			.map((c) => ({
				...c,
				pattern: new RegExp(`(?<![\\w-])${escapeRegExp(c.name)}(?:e?s)?(?![\\w-])`, 'i'),
			}));
		if (pending.length === 0) return;

		const walk = (/** @type {any} */ node) => {
			if (!Array.isArray(node.children)) return;
			if (SKIP.has(node.type)) return;
			/** @type {any[]} */
			const out = [];
			for (const child of node.children) {
				if (child.type !== 'text') {
					walk(child);
					out.push(child);
					continue;
				}
				out.push(...markTerms(child, pending));
			}
			node.children = out;
		};
		walk(tree);
	};
}

/**
 * Split one text node around the first mention of each still-unmarked
 * concept. At one position the longest concept name wins.
 * @param {{ type: 'text', value: string }} node
 * @param {Array<{ id: string, name: string, definition: string, pattern: RegExp }>} pending
 */
function markTerms(node, pending) {
	/** @type {any[]} */
	const out = [];
	let rest = node.value;
	while (pending.length > 0 && rest.length > 0) {
		/** @type {{ index: number, length: number, i: number } | null} */
		let best = null;
		for (let i = 0; i < pending.length; i++) {
			const m = pending[i].pattern.exec(rest);
			if (!m) continue;
			const index = /** @type {number} */ (m.index);
			if (!best || index < best.index || (index === best.index && m[0].length > best.length)) {
				best = { index, length: m[0].length, i };
			}
		}
		if (!best) break;
		const [concept] = pending.splice(best.i, 1);
		if (best.index > 0) out.push({ type: 'text', value: rest.slice(0, best.index) });
		out.push({
			type: 'link',
			url: `/glossary/#${concept.id}`,
			title: concept.definition,
			data: { hProperties: { className: ['term'], 'data-term': concept.id } },
			children: [{ type: 'text', value: rest.slice(best.index, best.index + best.length) }],
		});
		rest = rest.slice(best.index + best.length);
	}
	if (out.length === 0) return [node];
	if (rest.length > 0) out.push({ type: 'text', value: rest });
	return out;
}

/** @param {string} s */
function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}
