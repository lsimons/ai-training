// @ts-check
/**
 * The tree walk shared by the citation and term remark plugins, so both
 * skip the same nodes.
 *
 * Text inside code is never touched. By default text inside an MDX
 * component (`mdxJsxFlowElement`, `mdxJsxTextElement`) is never rewritten
 * either: checkpoint stems must not give the answer away in a term's hover
 * text, and Prompt and Response transcripts are recordings. A plugin that
 * must see component children (citations in a Recap) passes its own
 * `frozen` set. Headings and links are reported to `onGuardedText` instead
 * of `onText`, so a plugin can reject a construct there rather than rewrite
 * it (a link inside a link is invalid).
 */

/** Node types whose text is never rewritten. */
export const CODE_ONLY = new Set(['code', 'inlineCode']);
export const CODE_AND_COMPONENTS = new Set([...CODE_ONLY, 'mdxJsxFlowElement', 'mdxJsxTextElement']);
const GUARDED = new Set(['heading', 'link', 'linkReference']);

/**
 * @param {any} tree
 * @param {{
 *   onText: (node: { type: 'text', value: string }) => any[],
 *   onGuardedText?: (node: { type: 'text', value: string }, parent: any) => void,
 *   onNode?: (node: any) => void,
 *   frozen?: Set<string>,
 * }} handlers
 */
export function walkText(tree, handlers) {
	const frozenTypes = handlers.frozen ?? CODE_AND_COMPONENTS;
	// `onNode` sees every node, including those under a frozen parent, so a
	// plugin can validate links inside components. Text under a frozen parent
	// is neither rewritten nor reported.
	const walk = (/** @type {any} */ node, /** @type {any} */ guard, /** @type {boolean} */ frozen) => {
		handlers.onNode?.(node);
		if (!Array.isArray(node.children)) return;
		const freeze = frozen || frozenTypes.has(node.type);
		const guarded = guard ?? (GUARDED.has(node.type) ? node : null);
		/** @type {any[]} */
		const out = [];
		for (const child of node.children) {
			if (child.type !== 'text') {
				walk(child, guarded, freeze);
				out.push(child);
				continue;
			}
			if (freeze) {
				out.push(child);
				continue;
			}
			if (guarded) {
				handlers.onGuardedText?.(child, guarded);
				out.push(child);
				continue;
			}
			out.push(...handlers.onText(child));
		}
		node.children = out;
	};
	walk(tree, null, false);
}
