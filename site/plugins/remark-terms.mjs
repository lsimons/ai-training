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
 * optional plural `s` or `es`, and straight quotes in a name also match the
 * curly quotes remark-smartypants produces. Headings, links, code and the
 * inside of MDX components are never marked (see mdast-walk.mjs). When two
 * covered topics define the same concept name, the first covered topic's
 * concept is the one linked.
 *
 * On every page, lesson or not, this plugin also validates hand-written
 * glossary links: a `link` whose url is `/glossary/#<id>` with an id that is
 * not a concept fails the build. The links validator in astro.config.mjs
 * cannot see the component-rendered glossary anchors and excludes them, so
 * this check is what covers that exclusion.
 */
import { walkText } from './mdast-walk.mjs';

const GLOSSARY_LINK = /^\/glossary\/#(.+)$/;

/**
 * @param {{ topics: Array<{ id: string, concepts: Array<{ id: string, name: string, definition: string }> }> }} options
 */
export function remarkTerms({ topics }) {
	if (!Array.isArray(topics)) throw new Error('remarkTerms needs the parsed topic list');
	const conceptIds = new Set(topics.flatMap((t) => t.concepts.map((c) => c.id)));

	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const frontmatter = file.data?.astro?.frontmatter;
		/** @type {string[]} */
		const covers = frontmatter?.mode && Array.isArray(frontmatter.covers) ? frontmatter.covers : [];

		/** @type {Map<string, any>} */
		const byName = new Map();
		for (const id of covers) {
			const topic = topics.find((t) => t.id === id);
			for (const c of topic?.concepts ?? []) {
				const key = c.name.toLowerCase();
				if (byName.has(key)) continue;
				byName.set(key, { ...c, pattern: namePattern(c.name) });
			}
		}
		const pending = [...byName.values()];

		walkText(tree, {
			onNode: (node) => {
				if (node.type !== 'link' || typeof node.url !== 'string') return;
				const m = GLOSSARY_LINK.exec(node.url);
				if (m && !conceptIds.has(m[1])) {
					throw new Error(`${file.path}: link to unknown glossary anchor "${node.url}". No concept has the id "${m[1]}".`);
				}
			},
			onText: (node) => (pending.length > 0 ? markTerms(node, pending) : [node]),
		});
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

/**
 * The whole-phrase pattern for a concept name. Straight quotes match their
 * curly forms too, because Astro runs remark-smartypants before this plugin.
 * @param {string} name
 */
function namePattern(name) {
	const escaped = name
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		.replace(/\s+/g, '\\s+')
		.replace(/"/g, '["“”]')
		.replace(/'/g, "['‘’]");
	return new RegExp(`(?<![\\w-])${escaped}(?:e?s)?(?![\\w-])`, 'i');
}
