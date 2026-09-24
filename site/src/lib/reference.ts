/**
 * What the learner's reference shows for a lesson (spec S02 "Learner's
 * reference"): the recap takeaways and the canonical example, both read from
 * the lesson's MDX source at build time, like `checkpointsOf`. The topic page
 * renders the result hidden and a client script reveals it for finished
 * lessons. Pure: no DOM, no Astro.
 */
import {
	attrsOf,
	type CheckpointAttr,
	childrenSource,
	isJsxElement,
	type MdxNode,
	parseMdx,
	propValue,
	stringProp,
} from './checkpoint-tags';
import { CODE_SPAN, EMPHASIS, LINK, STRONG } from './inline-markdown';
import type { Lesson } from './lessons';
import { href } from './url';

/** A run of an example body: prose (rendered to HTML) or one fenced code block. */
export type Segment = { kind: 'text'; html: string } | { kind: 'code'; lang: string; code: string };

export interface PredictExample {
	kind: 'predict';
	id: string;
	title: string;
	body: Segment[];
	/** The graded answer; absent for the honor-system variant. */
	answer?: string;
	/** The fixture CI runs, when the example is verified there. */
	run?: string;
}

export interface PromptExample {
	kind: 'prompt';
	/** The `Prompt` props, so the topic page renders the same block with the same caption. */
	model: string;
	recorded: string;
	illustrative: boolean;
	prompt: Segment[];
	response?: Segment[];
}

export type CanonicalExample = PredictExample | PromptExample;

export interface LessonReference {
	takeaways: string[];
	example: CanonicalExample | undefined;
}

/** A fenced code block; the info string after the language (`title=...`, `frame=none`) is dropped. */
const FENCE = /^```(\w*)[^\n]*\n([\s\S]*?)\n```$/m;
/** A bare `canonical` prop or `canonical={true}` (spec S03 "Examples"). */
function isCanonical(attrs: Map<string, CheckpointAttr>): boolean {
	return attrs.get('canonical')?.value === true;
}

/** A component block in the lesson's MDX tree: its name, its props, its children as source, and where it sits. */
interface Block {
	name: string;
	attrs: Map<string, CheckpointAttr>;
	body: string;
	/** The node's parent and its index there, so a following block can be told from a following sibling. */
	parent: object;
	index: number;
}

/** Every named component in the lesson body, in source order, read from the MDX tree (`lib/checkpoint-tags.ts`). */
function blocksOf(lesson: Lesson): Block[] {
	const src = lesson.body ?? '';
	const out: Block[] = [];
	const walk = (parent: MdxNode) => {
		for (const [index, node] of (parent.children ?? []).entries()) {
			if (isJsxElement(node) && node.name !== null) {
				out.push({ name: node.name, attrs: attrsOf(node, lesson.id), body: childrenSource(node, src), parent, index });
			}
			walk(node);
		}
	};
	walk(parseMdx(src));
	return out;
}

export function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Root-relative links get the deploy base, as the rehype plugin does for Markdown the topic page never sees. */
function linkHref(url: string): string {
	return url.startsWith('/') && !url.startsWith('//') ? href(url) : url;
}

function renderProse(md: string): string {
	return escapeHtml(md)
		.replace(/\s*\(@[A-Za-z0-9-]+\)/g, '')
		.replace(STRONG, '<strong>$1</strong>')
		.replace(EMPHASIS, '<em>$1</em>')
		.replace(LINK, (_, text: string, url: string) => `<a href="${linkHref(url)}">${text}</a>`);
}

/**
 * The inline Markdown the recaps and prompt blocks use, as HTML: code spans,
 * strong, emphasis, links, and `(@key)` citations, which are dropped because
 * the topic page has its own Sources section. Everything else is escaped text.
 * The patterns are in `lib/inline-markdown.ts`, next to `unsupportedInline`.
 */
export function renderInline(md: string): string {
	const parts: string[] = [];
	let last = 0;
	for (const m of md.matchAll(CODE_SPAN)) {
		parts.push(renderProse(md.slice(last, m.index)));
		parts.push(`<code>${escapeHtml(m[1] ?? '')}</code>`);
		last = m.index + m[0].length;
	}
	parts.push(renderProse(md.slice(last)));
	return parts.join('');
}

/**
 * Block-level Markdown as the lesson bodies use it: paragraphs and `- ` lists,
 * separated by blank lines. Fenced code is split off by `segmentsOf` before
 * this runs.
 */
export function renderBlocks(md: string): string {
	return md
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean)
		.map((block) => {
			const lines = block.split('\n');
			if (/^-\s/.test(lines[0] ?? '')) {
				const items: string[] = [];
				for (const l of lines) {
					if (/^-\s/.test(l)) items.push(l.replace(/^-\s+/, ''));
					else items[items.length - 1] = `${items[items.length - 1]} ${l.trim()}`;
				}
				return `<ul>${items.map((i) => `<li>${renderInline(i)}</li>`).join('')}</ul>`;
			}
			return `<p>${renderInline(lines.map((l) => l.trim()).join(' '))}</p>`;
		})
		.join('');
}

/** The body of a JSX block as text and fenced-code segments, in source order. */
export function segmentsOf(body: string): Segment[] {
	const out: Segment[] = [];
	let rest = body;
	for (let m = FENCE.exec(rest); m; m = FENCE.exec(rest)) {
		const before = rest.slice(0, m.index);
		if (before.trim()) out.push({ kind: 'text', html: renderBlocks(before) });
		out.push({ kind: 'code', lang: m[1] ?? '', code: m[2] ?? '' });
		rest = rest.slice(m.index + m[0].length);
	}
	if (rest.trim()) out.push({ kind: 'text', html: renderBlocks(rest) });
	return out;
}

/** The numbered takeaways inside the lesson's `<Recap>`, each as inline HTML. */
export function takeawaysOf(lesson: Lesson): string[] {
	const recap = blocksOf(lesson).find((b) => b.name === 'Recap');
	if (!recap) return [];
	const items: string[] = [];
	const { body } = recap;
	for (const line of body.split('\n')) {
		if (/^\d+\.\s/.test(line)) items.push(line.replace(/^\d+\.\s+/, '').trim());
		else if (items.length && /^\s+\S/.test(line)) items[items.length - 1] = `${items[items.length - 1]} ${line.trim()}`;
	}
	return items.map(renderInline);
}

function predictOf(lesson: Lesson, { attrs, body }: Block): PredictExample {
	const id = stringProp(lesson.id, attrs, 'id');
	if (!id) throw new Error(`${lesson.id}: <Predict> without an id`);
	const where = `${lesson.id}#${id}`;
	const out: PredictExample = {
		kind: 'predict',
		id,
		title: stringProp(where, attrs, 'title') ?? id,
		body: segmentsOf(body),
	};
	const answer = stringProp(where, attrs, 'answer');
	if (answer !== undefined) out.answer = answer;
	const run = stringProp(where, attrs, 'run');
	if (run !== undefined) out.run = run;
	return out;
}

/**
 * A `Prompt` block and the `Response` block that follows it, when the next
 * block in the tree is one. Prose between the two makes the response
 * a block of its own.
 */
function promptOf(lesson: Lesson, block: Block, blocks: Block[]): PromptExample {
	const { attrs, body } = block;
	const model = stringProp(lesson.id, attrs, 'model') ?? '';
	const recorded = stringProp(lesson.id, attrs, 'recorded') ?? '';
	const illustrative = model === 'illustrative' || recorded === 'illustrative';
	const out: PromptExample = { kind: 'prompt', model, recorded, illustrative, prompt: segmentsOf(body) };
	// The next sibling in the tree, not the next block in reading order: a JSX child of the Prompt comes first there.
	const next = blocks.find((b) => b.parent === block.parent && b.index === block.index + 1);
	if (next?.name === 'Response') out.response = segmentsOf(next.body);
	return out;
}

/**
 * The canonical example (spec S03 "Examples"): the `Predict` or `Prompt`
 * block marked `canonical`, or the first of either in source order. Two
 * marked blocks are an authoring error. A `Predict` alternate (a `phase`
 * other than `first`, spec S03 "Checkpoints") is never the example: a
 * `review` one is hidden on the page and a `practice` one is extra.
 */
export function canonicalExampleOf(lesson: Lesson): CanonicalExample | undefined {
	const blocks = blocksOf(lesson);
	const examples = blocks.filter(
		(b) => (b.name === 'Predict' && (propValue(b.attrs, 'phase') ?? 'first') === 'first') || b.name === 'Prompt',
	);
	const marked = examples.filter((b) => isCanonical(b.attrs));
	if (marked.length > 1) throw new Error(`${lesson.id}: more than one block is marked canonical`);
	const pick = marked[0] ?? examples[0];
	if (!pick) return undefined;
	return pick.name === 'Predict' ? predictOf(lesson, pick) : promptOf(lesson, pick, blocks);
}

export function referenceOf(lesson: Lesson): LessonReference {
	return { takeaways: takeawaysOf(lesson), example: canonicalExampleOf(lesson) };
}
