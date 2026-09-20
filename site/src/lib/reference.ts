/**
 * What the learner's reference shows for a lesson (spec S02 "Learner's
 * reference"): the recap takeaways and the canonical example, both read from
 * the lesson's MDX source at build time, like `checkpointsOf`. The topic page
 * renders the result hidden and a client script reveals it for finished
 * lessons. Pure: no DOM, no Astro.
 */
import { type CheckpointAttr, openingTagEnd, parseAttrs, stringProp } from './checkpoint-source';
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

const BLOCK_START = /<(Predict|Prompt)\b/g;
/** A fenced code block; the info string after the language (`title=...`, `frame=none`) is dropped. */
const FENCE = /^```(\w*)[^\n]*\n([\s\S]*?)\n```$/m;
/** A bare `canonical` prop or `canonical={true}` (spec S03 "Examples"). */
function isCanonical(attrs: Map<string, CheckpointAttr>): boolean {
	const a = attrs.get('canonical');
	return a !== undefined && (a.value === '' || a.value === 'true');
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Root-relative links get the deploy base, as the rehype plugin does for Markdown the topic page never sees. */
function linkHref(url: string): string {
	return url.startsWith('/') && !url.startsWith('//') ? href(url) : url;
}

function renderProse(md: string): string {
	return escapeHtml(md)
		.replace(/\s*\(@[A-Za-z0-9-]+\)/g, '')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, url: string) => `<a href="${linkHref(url)}">${text}</a>`);
}

/**
 * The inline Markdown the recaps and prompt blocks use, as HTML: code spans,
 * strong, emphasis, links, and `(@key)` citations, which are dropped because
 * the topic page has its own Sources section. Everything else is escaped text.
 */
export function renderInline(md: string): string {
	const parts: string[] = [];
	let last = 0;
	for (const m of md.matchAll(/`([^`]+)`/g)) {
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

/** `<Tag ...>` at `start`: its props, its body, and the offset after its closing tag. */
function blockAt(
	src: string,
	start: number,
	tag: string,
): { attrs: Map<string, CheckpointAttr>; body: string; end: number } {
	const bodyStart = openingTagEnd(src, start);
	const attrs = parseAttrs(src.slice(start, bodyStart));
	const close = src.indexOf(`</${tag}>`, bodyStart);
	if (close < 0) throw new Error(`unclosed <${tag}> at offset ${start}`);
	return { attrs, body: src.slice(bodyStart, close), end: close + tag.length + 3 };
}

/** The numbered takeaways inside the lesson's `<Recap>`, each as inline HTML. */
export function takeawaysOf(lesson: Lesson): string[] {
	const src = lesson.body ?? '';
	const start = src.indexOf('<Recap');
	if (start < 0) return [];
	const { body } = blockAt(src, start, 'Recap');
	const items: string[] = [];
	for (const line of body.split('\n')) {
		if (/^\d+\.\s/.test(line)) items.push(line.replace(/^\d+\.\s+/, '').trim());
		else if (items.length && /^\s+\S/.test(line)) items[items.length - 1] = `${items[items.length - 1]} ${line.trim()}`;
	}
	return items.map(renderInline);
}

function predictAt(lesson: Lesson, src: string, start: number): PredictExample {
	const { attrs, body } = blockAt(src, start, 'Predict');
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

function promptAt(lesson: Lesson, src: string, start: number): PromptExample {
	const { attrs, body, end } = blockAt(src, start, 'Prompt');
	const model = stringProp(lesson.id, attrs, 'model') ?? '';
	const recorded = stringProp(lesson.id, attrs, 'recorded') ?? '';
	const illustrative = model === 'illustrative' || recorded === 'illustrative';
	const out: PromptExample = { kind: 'prompt', model, recorded, illustrative, prompt: segmentsOf(body) };
	const m = /^\s*(?=<Response\b)/.exec(src.slice(end));
	if (m) out.response = segmentsOf(blockAt(src, end + m[0].length, 'Response').body);
	return out;
}

/**
 * The canonical example (spec S03 "Examples"): the `Predict` or `Prompt`
 * block marked `canonical`, or the first of either in source order. Two
 * marked blocks are an authoring error.
 */
export function canonicalExampleOf(lesson: Lesson): CanonicalExample | undefined {
	const src = lesson.body ?? '';
	const starts = [...src.matchAll(BLOCK_START)].map((m) => ({ tag: m[1] as 'Predict' | 'Prompt', index: m.index }));
	const marked = starts.filter((s) => isCanonical(parseAttrs(src.slice(s.index, openingTagEnd(src, s.index)))));
	if (marked.length > 1) throw new Error(`${lesson.id}: more than one block is marked canonical`);
	const pick = marked[0] ?? starts[0];
	if (!pick) return undefined;
	return pick.tag === 'Predict' ? predictAt(lesson, src, pick.index) : promptAt(lesson, src, pick.index);
}

export function referenceOf(lesson: Lesson): LessonReference {
	return { takeaways: takeawaysOf(lesson), example: canonicalExampleOf(lesson) };
}
