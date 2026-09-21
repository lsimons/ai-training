// @ts-check
/**
 * Terms per spec S03 "Citations and terms": in a lesson, the first mention
 * of a concept from the topic the lesson `covers` is a term. The lesson is
 * found by path: `<docsDir>/<area>/<lesson>.mdx` is the lesson `<area>/<lesson>`
 * in the `lessons` list (the lesson YAML, spec S11), which names the topic. It renders as a link to the concept's
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
 * @param {{
 *   topics: Array<{ id: string, concepts: Array<{ id: string, name: string, definition: string }> }>,
 *   lessons: Array<{ id: string, covers: string }>,
 *   docsDir: string,
 * }} options
 */
export function remarkTerms({ topics, lessons, docsDir }) {
	if (!Array.isArray(topics)) throw new Error('remarkTerms needs the parsed topic list');
	if (!Array.isArray(lessons) || typeof docsDir !== 'string') {
		throw new Error('remarkTerms needs the lesson list and the docs directory');
	}
	const conceptIds = new Set(topics.flatMap((t) => t.concepts.map((c) => c.id)));
	const coversOf = new Map(lessons.map((l) => [l.id, l.covers]));
	const root = docsDir.endsWith('/') ? docsDir : `${docsDir}/`;

	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const path = typeof file.path === 'string' ? file.path : '';
		const lessonId = path.startsWith(root) ? path.slice(root.length).replace(/\.mdx?$/, '') : null;
		const topicId = lessonId ? coversOf.get(lessonId) : undefined;
		/** @type {string[]} */
		const covers = topicId ? [topicId] : [];

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
				const id = GLOSSARY_LINK.exec(node.url)?.[1];
				if (id && !conceptIds.has(id)) {
					throw new Error(
						`${file.path}: link to unknown glossary anchor "${node.url}". No concept has the id "${id}".`,
					);
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
		/** @type {{ index: number, length: number, concept: (typeof pending)[number] } | null} */
		let best = null;
		for (const concept of pending) {
			const m = concept.pattern.exec(rest);
			if (!m) continue;
			const index = /** @type {number} */ (m.index);
			if (!best || index < best.index || (index === best.index && m[0].length > best.length)) {
				best = { index, length: m[0].length, concept };
			}
		}
		if (!best) break;
		const { concept } = best;
		pending.splice(pending.indexOf(concept), 1);
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
