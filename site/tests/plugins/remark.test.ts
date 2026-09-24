import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { citationKeys, splitCitations } from '../../plugins/citation-syntax.mjs';
import { CODE_AND_COMPONENTS, CODE_ONLY, walkText } from '../../plugins/mdast-walk.mjs';
import { remarkCitations } from '../../plugins/remark-citations.mjs';
import { remarkTerms } from '../../plugins/remark-terms.mjs';

const topics = [
	{
		id: 'concepts/how-models-work',
		concepts: [
			{ id: 'token', name: 'Token', definition: 'The unit a model reads.' },
			{ id: 'context-window', name: 'Context window', definition: 'How much the model sees.' },
		],
	},
	{
		id: 'safety/verification',
		concepts: [
			{ id: 'trust-but-verify-for-agents', name: '"Trust but verify" for agents', definition: 'Check the output.' },
			{ id: 'token-again', name: 'token', definition: 'A duplicate name in another topic.' },
		],
	},
];
const bibliography = {
	'AEC-02': {
		type: 'course',
		title: 'How agents think',
		container: 'Agent Engineer Course',
		author: 'A. Osmani',
		url: 'https://example.com/aec',
	},
	'Brilliant TAS': {
		type: 'reference',
		title: 'Taste: what is worth building',
		container: 'Brilliant',
		author: null,
		url: null,
	},
	'Liu 2024': {
		type: 'paper',
		title: 'Lost in the Middle',
		container: 'TACL 12 (2024), 157-173',
		author: 'N. Liu and 6 others',
		url: 'https://aclanthology.org/2024.tacl-1.9/',
	},
};

type Node = {
	type: string;
	value?: string;
	url?: string;
	title?: string;
	children?: Node[];
	data?: { hProperties?: Record<string, unknown> };
};

const docsDir = '/repo/site/src/content/docs/';

/**
 * Run both plugins over MDX source the way astro.config.mjs wires them. `lessons`
 * is the lesson list the terms plugin reads (spec S11): by default the page at
 * `path` is a lesson covering `concepts/how-models-work`.
 */
async function run(
	source: string,
	lessons: { id: string; covers: string }[] = [{ id: 'concepts/how-models-work', covers: 'concepts/how-models-work' }],
	path = `${docsDir}concepts/how-models-work.mdx`,
): Promise<Node> {
	const processor = unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkTerms, { topics, lessons, docsDir })
		.use(remarkCitations, { bibliography });
	const file = { path, value: source, data: {} };
	const tree = processor.parse(file);
	return (await processor.run(tree, file)) as Node;
}

function allLinks(tree: Node): Node[] {
	const out: Node[] = [];
	const visit = (n: Node) => {
		if (n.type === 'link') out.push(n);
		for (const c of n.children ?? []) visit(c);
	};
	visit(tree);
	return out;
}

/** The links the plugins emitted with the given class (`term` or `citation`). */
function links(tree: Node, cls: string): Node[] {
	return allLinks(tree).filter((n) => (n.data?.hProperties?.className as string[] | undefined)?.includes(cls));
}

/** The plain text of a node, code spans included. */
function text(n: Node): string {
	if (n.type === 'text' || n.type === 'inlineCode') return n.value ?? '';
	return (n.children ?? []).map(text).join('');
}

describe('remarkTerms', () => {
	it('marks the first mention of a covered concept, with the definition as title, and leaves later mentions plain', async () => {
		const tree = await run('A **token** is small. Another token follows.\n');
		expect(links(tree, 'term').map((t) => [t.url, t.title, text(t)])).toEqual([
			['/glossary/#token', 'The unit a model reads.', 'token'],
		]);
	});

	it('matches whole phrases case-insensitively with an optional plural, and skips word parts', async () => {
		const tree = await run('Tokens and tokenizers and the context window.\n');
		expect(links(tree, 'term').map((t) => [t.url, text(t)])).toEqual([
			['/glossary/#token', 'Tokens'],
			['/glossary/#context-window', 'context window'],
		]);
	});

	it('matches curly quotes where the concept name has straight quotes', async () => {
		const tree = await run('Apply “Trust but verify” for agents here.\n', [
			{ id: 'concepts/how-models-work', covers: 'safety/verification' },
		]);
		expect(links(tree, 'term').map((t) => t.url)).toEqual(['/glossary/#trust-but-verify-for-agents']);
	});

	it("marks the covered topic's concept when another topic shares the name", async () => {
		const tree = await run('A token and a token.\n', [
			{ id: 'concepts/how-models-work', covers: 'safety/verification' },
		]);
		expect(links(tree, 'term').map((t) => t.url)).toEqual(['/glossary/#token-again']);
	});

	it('never marks text inside headings, links, code or MDX components', async () => {
		const src = [
			'## The token',
			'',
			'[a token](/x/) and `token`',
			'',
			'<Choice id="q">',
			'',
			'What is a token?',
			'',
			'</Choice>',
			'',
			'Finally a token.',
			'',
		].join('\n');
		const tree = await run(src);
		expect(links(tree, 'term').map((t) => t.url)).toEqual(['/glossary/#token']);
		// The one term is the body mention after the component.
		const last = tree.children?.at(-1);
		expect(last && links(last, 'term')).toHaveLength(1);
	});

	it('does nothing on a page that is not a lesson', async () => {
		expect(links(await run('A token.\n', []), 'term')).toHaveLength(0);
		expect(links(await run('A token.\n', undefined, `${docsDir}guides/how-models-work.mdx`), 'term')).toHaveLength(0);
	});
	it('refuses to run without the lesson list and docs directory', () => {
		expect(() => remarkTerms({ topics } as never)).toThrow(/lesson list/);
	});

	it('fails the build on a hand-written link to an unknown glossary anchor, also inside a component', async () => {
		await expect(run('See [this](/glossary/#no-such-concept).\n')).rejects.toThrow(
			'link to unknown glossary anchor "/glossary/#no-such-concept". No concept has the id "no-such-concept"',
		);
		await expect(run('<Recap>\n\nSee [this](/glossary/#nope).\n\n</Recap>\n', [])).rejects.toThrow('"/glossary/#nope"');
		await expect(run('See [this](/glossary/#token).\n', [])).resolves.toBeTruthy();
	});
});

describe('remarkCitations', () => {
	it('citationKeys lists each cited key once, trimmed, in order of first appearance', () => {
		expect(citationKeys('One (@AEC-02). Two (@ Brilliant TAS ). One again (@AEC-02). Not (@) this.\n')).toEqual([
			'AEC-02',
			'Brilliant TAS',
		]);
		expect(citationKeys('No citation here.\n')).toEqual([]);
	});
	it('splitCitations keeps the text runs around each token and returns plain text as one part', () => {
		expect(splitCitations('A (@K-1) b (@ K-2 ).')).toEqual([
			{ type: 'text', value: 'A ' },
			{ type: 'citation', key: 'K-1' },
			{ type: 'text', value: ' b ' },
			{ type: 'citation', key: 'K-2' },
			{ type: 'text', value: '.' },
		]);
		expect(splitCitations('plain')).toEqual([{ type: 'text', value: 'plain' }]);
		expect(splitCitations('')).toEqual([{ type: 'text', value: '' }]);
	});
	it('numbers citations by first appearance, links them page-absolute, and appends a References section', async () => {
		const tree = await run('One (@AEC-02). Two (@Brilliant TAS). One again (@AEC-02).\n');
		const cites = links(tree, 'citation');
		expect(cites.map((c) => [c.url, text(c)])).toEqual([
			['/concepts/how-models-work/#ref-1', '[1]'],
			['/concepts/how-models-work/#ref-2', '[2]'],
			['/concepts/how-models-work/#ref-1', '[1]'],
		]);
		const heading = tree.children?.at(-2);
		const list = tree.children?.at(-1);
		expect(heading?.type).toBe('heading');
		expect(text(heading as Node)).toBe('References');
		expect(list?.type).toBe('list');
		expect(list?.children?.map((li) => li.data?.hProperties?.id)).toEqual(['ref-1', 'ref-2']);
		expect(text(list?.children?.[0] as Node)).toBe(
			'A. Osmani. How agents think. Agent Engineer Course. Course. AEC-02',
		);
		expect(links(list?.children?.[0] as Node, 'citation')).toHaveLength(0);
		const [first, second] = list?.children ?? [];
		expect(first && allLinks(first).map((l) => l.url)).toEqual(['https://example.com/aec']);
		expect(second && allLinks(second)).toEqual([]);
		expect(text(list?.children?.[1] as Node)).toBe(
			'Taste: what is worth building. Brilliant. Reference. Brilliant TAS',
		);
	});

	it('renders a paper with its authors, venue and year, and links the title to the published page', async () => {
		const tree = await run('Cite (@Liu 2024).\n');
		const list = tree.children?.at(-1);
		const [entry] = list?.children ?? [];
		expect(entry && text(entry)).toBe(
			'N. Liu and 6 others. Lost in the Middle. TACL 12 (2024), 157-173. Paper. Liu 2024',
		);
		expect(entry && allLinks(entry).map((l) => l.url)).toEqual(['https://aclanthology.org/2024.tacl-1.9/']);
	});

	it('never marks a term inside the appended References list', async () => {
		const tree = await run('Cite (@Brilliant TAS).\n', [
			{ id: 'concepts/how-models-work', covers: 'safety/verification' },
		]);
		expect(links(tree, 'term')).toHaveLength(0);
	});

	it('cites inside a component such as a Recap and maps index pages to their directory URL', async () => {
		const tree = await run('<Recap>\n\n1. A point (@AEC-02).\n\n</Recap>\n', [], `${docsDir}concepts/index.mdx`);
		expect(links(tree, 'citation').map((c) => c.url)).toEqual(['/concepts/#ref-1']);
	});

	it('adds no References section to a page without citations', async () => {
		const tree = await run('Plain text.\n');
		expect(tree.children?.map((c) => c.type)).toEqual(['paragraph']);
	});

	it('fails the build on an unknown key, and on a citation inside a heading or link', async () => {
		await expect(run('Body (@NOPE).\n')).rejects.toThrow('unknown citation key "NOPE"');
		await expect(run('## Loops (@AEC-02)\n')).rejects.toThrow('citation (@AEC-02) inside a heading');
		await expect(run('[the loop (@AEC-02)](/x/)\n')).rejects.toThrow('inside a link');
	});

	it('leaves a citation inside code alone', async () => {
		const tree = await run('Use `(@AEC-02)` literally.\n');
		expect(links(tree, 'citation')).toHaveLength(0);
	});

	it('refuses a page outside src/content/docs and a missing bibliography', async () => {
		await expect(run('Body (@AEC-02).\n', [], '/repo/site/README.md')).rejects.toThrow(
			'only works in a page under src/content/docs/',
		);
		expect(() => remarkCitations({ bibliography: undefined as unknown as Record<string, unknown> })).toThrow(
			'needs the parsed bibliography',
		);
		expect(() => remarkTerms({ topics: undefined as unknown as [], lessons: [], docsDir })).toThrow(
			'needs the parsed topic list',
		);
	});
});

describe('walkText', () => {
	const tree = (): Node => ({
		type: 'root',
		children: [
			{ type: 'heading', children: [{ type: 'text', value: 'h' }] },
			{ type: 'mdxJsxFlowElement', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'c' }] }] },
			{
				type: 'paragraph',
				children: [
					{ type: 'text', value: 'p' },
					{ type: 'inlineCode', value: 'x' },
				],
			},
		],
	});

	it('rewrites body text, reports guarded text, and freezes components by default', () => {
		const t = tree();
		const guarded: string[] = [];
		const seen: string[] = [];
		walkText(t, {
			onNode: (n) => seen.push(n.type),
			onGuardedText: (n, parent) => guarded.push(`${parent.type}:${n.value}`),
			onText: (n) => [{ type: 'text', value: `${n.value}!` }],
		});
		expect(guarded).toEqual(['heading:h']);
		expect(text(t)).toBe('hcp!x');
		expect(seen).toContain('mdxJsxFlowElement');
		expect(seen).toContain('inlineCode');
	});

	it('lets a plugin choose a smaller frozen set', () => {
		const t = tree();
		walkText(t, { frozen: CODE_ONLY, onText: (n) => [{ type: 'text', value: `${n.value}!` }] });
		expect(text(t)).toBe('hc!p!x');
		expect([...CODE_AND_COMPONENTS]).toEqual(['code', 'inlineCode', 'mdxJsxFlowElement', 'mdxJsxTextElement']);
	});
});
