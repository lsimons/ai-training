// @ts-check
/**
 * Citations per spec S03 "Citations and terms": `(@key)` in Markdown or MDX
 * resolves against site/src/data/bibliography.yaml and renders as a numbered
 * reference `[N]`, numbered by first appearance in the page. A page with at
 * least one citation gets a "References" section appended after its content,
 * one numbered entry per cited key. An unknown key fails the build, and so
 * does a citation inside a heading or a link, where the reference link could
 * not render. Component children are scanned too, because recaps cite (S03),
 * and the reference links are page-absolute (`/<page>/#ref-N`) so a cited
 * checkpoint stem still resolves when a review page clones it. Only code is
 * left alone.
 */
import { walkText, CODE_ONLY } from './mdast-walk.mjs';

const CITATION = /\(@([^()\n]+?)\)/g;
const DOCS_DIR = /[\\/]src[\\/]content[\\/]docs[\\/]/;

/**
 * The root-relative URL of the page a file renders to, per Starlight's
 * routing: `src/content/docs/a/b.mdx` is `/a/b/` and `a/index.mdx` is `/a/`.
 * @param {string} path
 */
function pageUrl(path) {
	const m = DOCS_DIR.exec(path);
	if (!m) throw new Error(`${path}: a citation only works in a page under src/content/docs/`);
	const rel = path
		.slice(m.index + m[0].length)
		.replace(/\\/g, '/')
		.replace(/\.(mdx?|markdown)$/, '')
		.replace(/(^|\/)index$/, '');
	return rel ? `/${rel}/` : '/';
}

/**
 * @param {{ bibliography: Record<string, any> }} options
 */
export function remarkCitations({ bibliography }) {
	if (!bibliography || typeof bibliography !== 'object') {
		throw new Error('remarkCitations needs the parsed bibliography');
	}
	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		/** @type {string[]} */
		const order = [];
		const numberOf = (/** @type {string} */ key) => {
			let n = order.indexOf(key);
			if (n === -1) {
				if (!(key in bibliography)) {
					throw new Error(
						`${file.path}: unknown citation key "${key}". Keys are defined in site/src/data/bibliography.yaml.`
					);
				}
				order.push(key);
				n = order.length - 1;
			}
			return n + 1;
		};

		const page = pageUrl(file.path);
		walkText(tree, {
			frozen: CODE_ONLY,
			onText: (node) => splitText(node, numberOf, page),
			onGuardedText: (node, parent) => {
				const m = CITATION.exec(node.value);
				CITATION.lastIndex = 0;
				if (m) {
					throw new Error(
						`${file.path}: citation ${m[0]} inside a ${parent.type}. Cite in the paragraph text instead; a reference link cannot render there.`
					);
				}
			},
		});

		if (order.length === 0) return;
		tree.children.push(
			{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'References' }] },
			{
				type: 'list',
				ordered: true,
				start: 1,
				spread: false,
				data: { hProperties: { className: ['references'] } },
				children: order.map((key, i) => ({
					type: 'listItem',
					spread: false,
					data: { hProperties: { id: `ref-${i + 1}` } },
					children: [{ type: 'paragraph', children: referenceText(key, bibliography[key]) }],
				})),
			}
		);
	};
}

/**
 * @param {{ type: 'text', value: string }} node
 * @param {(key: string) => number} numberOf
 * @param {string} page root-relative URL of the page, so the link survives cloning
 */
function splitText(node, numberOf, page) {
	/** @type {any[]} */
	const out = [];
	let last = 0;
	for (const m of node.value.matchAll(CITATION)) {
		const index = /** @type {number} */ (m.index);
		if (index > last) out.push({ type: 'text', value: node.value.slice(last, index) });
		const key = m[1].trim();
		const n = numberOf(key);
		out.push({
			type: 'link',
			url: `${page}#ref-${n}`,
			title: key,
			data: { hProperties: { className: ['citation'], 'data-key': key } },
			children: [{ type: 'text', value: `[${n}]` }],
		});
		last = index + m[0].length;
	}
	if (out.length === 0) return [node];
	if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) });
	return out;
}

/**
 * One reference entry as inline mdast: author, title (linked when the entry
 * has a public url), container, type, and the key.
 * @param {string} key
 * @param {any} entry
 */
function referenceText(key, entry) {
	/** @type {any[]} */
	const parts = [];
	if (entry.author) parts.push({ type: 'text', value: `${entry.author}. ` });
	const title = { type: 'emphasis', children: [{ type: 'text', value: entry.title }] };
	parts.push(entry.url ? { type: 'link', url: entry.url, children: [title] } : title);
	parts.push({ type: 'text', value: '.' });
	if (entry.container && entry.container !== entry.title) parts.push({ type: 'text', value: ` ${entry.container}.` });
	if (entry.type) parts.push({ type: 'text', value: ` ${capitalize(entry.type)}.` });
	parts.push({ type: 'text', value: ' ' }, { type: 'inlineCode', value: key });
	return parts;
}

/** @param {string} s */
function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
