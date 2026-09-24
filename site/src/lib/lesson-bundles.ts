import { getCollection } from 'astro:content';
import { BUNDLE_VERSION } from './bundle-version';
import { buildCheckpointExport, type CheckpointItem } from './checkpoint-items';
import { KIND_OF_TAG } from './checkpoint-rules';
import { openingTagEnd, parseAttrs } from './jsx-source';
import { getLessons, type Lesson } from './lessons';
import { absoluteUrl } from './url';

/**
 * Lesson bundles (spec S08 "Lesson bundles"): one JSON file per live lesson,
 * written by the build to `<base>/data/lessons/<area>/<lesson>.json` and
 * read by the published tutor skill. Everything here is built from the same
 * content collections as the lesson page. `bundleOf` and `proseOf` are pure,
 * so the tests run them on the fixture lessons, and `buildLessonBundles`
 * is the one function that reads the collections.
 */

export { BUNDLE_VERSION };

export interface BundleTopic {
	id: string;
	name: string;
	definition: string;
	url: string;
	concepts: { id: string; name: string; definition: string }[];
}

export interface BundleObjective {
	id: string;
	statement: string;
	level: 'base' | 'expert';
	competency_url: string;
	behaviors: { claim: string; why: string; example: string }[];
}

export interface BundleAssumed {
	objective: string;
	lesson: string | null;
	section: string | null;
	/** The section's absolute URL, or null while the teaching lesson is unknown. */
	url: string | null;
}

/** A checkpoint export item without its `lesson`: the bundle's `id` says which lesson. */
export type BundleCheckpoint = Omit<CheckpointItem, 'lesson'>;

export interface LessonBundle {
	version: typeof BUNDLE_VERSION;
	id: string;
	url: string;
	title: string;
	mode: 'tutorial' | 'explanation';
	prose: string;
	topics: BundleTopic[];
	objectives: BundleObjective[];
	assumes: BundleAssumed[];
	checkpoints: BundleCheckpoint[];
	extends_to: { label: string; url: string }[];
}

/** What `bundleOf` reads besides the lesson, as the collections hold it. */
export interface BundleSources {
	topics: Omit<BundleTopic, 'url'>[];
	competencies: { id: string; objectives: Omit<BundleObjective, 'competency_url'>[] }[];
	/** Every item of the site-wide checkpoint export. */
	items: CheckpointItem[];
	/** Every lesson page's id, so an `assumes[].lesson` that names no page fails the build. */
	lessonIds: Set<string>;
	/** Astro's `site`, the origin the absolute URLs start with. */
	site: string;
}

/** The lesson page URL for a lesson id, `<site><base>/<area>/<lesson>/`. */
export function lessonUrl(id: string, site: string): string {
	return absoluteUrl(`/${id}/`, site);
}

/** A fence long enough to hold `text`, which may itself contain fenced blocks. */
function fenceFor(text: string): string {
	const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
	return '`'.repeat(longest + 1);
}

function fenced(text: string, lang = 'text'): string {
	const fence = fenceFor(text);
	return `${fence}${lang}\n${text.trim()}\n${fence}`;
}

const CHECKPOINT_TAGS = new Set(Object.keys(KIND_OF_TAG));

/**
 * Code set aside while the prose passes run. A fenced block or an inline
 * code span is swapped for a placeholder no lesson text contains, and `restore`
 * puts the code back, so a `<Tag>` or a `](/path)` inside code is never read
 * as a component or a link.
 */
interface CodeAside {
	text: string;
	/** Sets more text aside, so it is copied unchanged through the passes that follow. */
	keep: (code: string) => string;
	restore: (s: string) => string;
}

// Private-use characters, which no lesson text contains.
const PLACEHOLDER = /\uE000(\d+)\uE001/g;

/** The fenced blocks (```` ``` ```` or `~~~`, three or more, closed by a fence of the same character at least as long) and inline code spans of `src`, set aside. */
export function setAsideCode(src: string): CodeAside {
	const kept: string[] = [];
	const keep = (code: string) => {
		kept.push(code);
		return `\uE000${kept.length - 1}\uE001`;
	};
	const lines = src.split('\n');
	const out: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] as string;
		const open = /^(\s*)(`{3,}|~{3,})/.exec(line);
		if (!open) {
			out.push(line);
			continue;
		}
		const fence = open[2] as string;
		const block = [line];
		for (i++; i < lines.length; i++) {
			block.push(lines[i] as string);
			const close = /^\s*(`{3,}|~{3,})\s*$/.exec(lines[i] as string);
			if (close && close[1]?.[0] === fence[0] && (close[1]?.length ?? 0) >= fence.length) break;
		}
		out.push(keep(block.join('\n')));
	}
	// Inline spans are matched over the whole text, since a span may wrap across a line break. A blank line
	// ends a paragraph and so a span, so the body pattern excludes one and a stray backtick before a blank
	// line pairs with nothing. The fenced blocks are placeholders by now, so no backtick is theirs.
	// A backtick next to a brace (`={\`` and `\`}`) delimits a template literal in a component attribute, and
	// is never a span's edge, so two such attributes on adjacent lines don't pair up as one span.
	// The body's edges are not backticks, and its middle may hold one, so ``a ` b`` is one span.
	const edge = '(?:[^`\\n]|\\n(?![ \\t]*\\n))';
	const middle = '(?:[^\\n]|\\n(?![ \\t]*\\n))';
	const span = new RegExp(`(?<!\\{)(\`+)(?!\\})(${edge}|${edge}${middle}*?${edge})(?<!\\{)\\1(?!\`)(?!\\})`, 'g');
	const text = out.join('\n').replace(span, (m) => keep(m));
	return {
		text,
		keep,
		restore: (s) => s.replace(PLACEHOLDER, (_, n: string) => kept[Number(n)] ?? ''),
	};
}

/**
 * One component, as plain Markdown. `children` is already rendered, with code set aside. A `Prompt` or
 * `Response` body is restored and fenced here, and the fenced block is set aside again, so the link pass
 * that follows leaves a code span inside it alone.
 */
function renderTag(name: string, attrs: Map<string, { value: string }>, children: string, aside: CodeAside): string {
	const str = (n: string) => attrs.get(n)?.value;
	const body = children.trim();
	const withHeading = (heading: string) => (body ? `${heading}\n\n${body}` : heading);
	if (CHECKPOINT_TAGS.has(name)) {
		// A <Predict> without an objective is a worked example, not a checkpoint (S03 "Examples").
		const label = attrs.has('objective') ? 'Checkpoint' : 'Example';
		const title = str('title') ?? str('id') ?? name;
		return withHeading(`#### ${label}: ${title}`);
	}
	switch (name) {
		case 'Pitfall':
			return withHeading(`#### Pitfall: ${str('title') ?? ''}`.trimEnd());
		case 'Prompt': {
			// The same caption `Prompt.astro` shows, so an invented transcript is marked as one here too.
			const model = str('model') ?? '';
			const recorded = str('recorded') ?? '';
			const illustrative = model === 'illustrative' || recorded === 'illustrative';
			const heading = illustrative
				? 'Prompt (illustrative, not a recorded transcript)'
				: `Prompt · ${model}, recorded ${recorded}`;
			return `#### ${heading}\n\n${aside.keep(fenced(aside.restore(body)))}`;
		}
		case 'Response':
			return `#### Response\n\n${aside.keep(fenced(aside.restore(body)))}`;
		case 'Exercise': {
			const stretch = str('stretch');
			return withHeading('## Exercise') + (stretch ? `\n\nStretch: ${stretch}` : '');
		}
		case 'Recap':
			return withHeading('## Recap');
		default:
			// Any other component, a widget included, is its children. A self-closing widget leaves nothing.
			return body;
	}
}

/**
 * The component tags in `src`, rendered to Markdown (`renderTag`), children
 * first. A tag is `<Name ...>` with a capitalized name, self-closing or
 * closed by the first `</Name>` after it; components of one kind don't nest.
 * `src` has its code set aside, so a tag inside code is not seen.
 */
function renderComponents(src: string, aside: CodeAside): string {
	let out = '';
	let pos = 0;
	const tagStart = /<([A-Z][A-Za-z]*)\b/g;
	for (;;) {
		tagStart.lastIndex = pos;
		const m = tagStart.exec(src);
		if (!m) break;
		const name = m[1] as string;
		const start = m.index;
		const openEnd = openingTagEnd(src, start);
		const opening = src.slice(start, openEnd);
		const attrs = parseAttrs(opening);
		let children = '';
		let end = openEnd;
		if (!opening.endsWith('/>')) {
			const close = `</${name}>`;
			const closeAt = src.indexOf(close, openEnd);
			if (closeAt === -1) throw new Error(`unclosed <${name}> at offset ${start}`);
			children = renderComponents(src.slice(openEnd, closeAt), aside);
			end = closeAt + close.length;
		}
		// A component is a block of its own, so blank lines set it off from its neighbors.
		const rendered = renderTag(name, attrs, children, aside);
		out += src.slice(pos, start) + (rendered ? `\n\n${rendered}\n\n` : '');
		pos = end;
	}
	return out + src.slice(pos);
}

/** Every root-relative link and image in Markdown and raw HTML, made absolute. Links with a scheme, `#` and `mailto:` are left alone. */
function absolutizeLinks(md: string, site: string): string {
	return md
		.replace(/(!?\[[^\]]*\]\()(\/(?!\/)[^)\s]*)/g, (_, pre: string, path: string) => pre + absoluteUrl(path, site))
		.replace(/((?:href|src)=")(\/(?!\/)[^"]*)/g, (_, pre: string, path: string) => pre + absoluteUrl(path, site));
}

/** The MDX import block: the `import` lines (and blank lines between them) before the first line of content. */
function withoutImportBlock(body: string): string {
	const lines = body.split('\n');
	let i = 0;
	while (i < lines.length && (/^import\s/.test(lines[i] as string) || (lines[i] as string).trim() === '')) i++;
	return lines.slice(i).join('\n');
}

/**
 * The lesson body as Markdown for a reader without the components: the
 * import block dropped, components rendered to plain text (a `Pitfall`
 * becomes a titled paragraph, a `Prompt` a fenced block), widgets omitted,
 * links absolute. Fenced blocks and inline code are copied unchanged.
 */
export function proseOf(body: string, site: string): string {
	const aside = setAsideCode(withoutImportBlock(body));
	// Runs of blank lines are collapsed before the code comes back, so a double blank line inside a fence stays.
	const rendered = absolutizeLinks(renderComponents(aside.text, aside), site).replace(/\n{3,}/g, '\n\n');
	return `${aside.restore(rendered).trim()}\n`;
}

/**
 * The bundle of one lesson. Throws when `covers` names an unknown topic, a
 * served objective is in no competency, or an `assumes` entry names a lesson
 * that has no page, so its `url` would be a 404.
 */
export function bundleOf(lesson: Lesson, sources: BundleSources): LessonBundle {
	const { site } = sources;
	const { data } = lesson;
	const topic = sources.topics.find((t) => t.id === data.covers);
	if (!topic) throw new Error(`${lesson.id}: covers ${data.covers}, which is not a topic`);
	const objectives = data.serves.map((id): BundleObjective => {
		const owner = sources.competencies.find((c) => c.objectives.some((o) => o.id === id));
		const objective = owner?.objectives.find((o) => o.id === id);
		if (!owner || !objective) throw new Error(`${lesson.id}: serves ${id}, which is in no competency`);
		const tail = id.split('/').at(-1) ?? id;
		return {
			id,
			statement: objective.statement,
			level: objective.level,
			competency_url: absoluteUrl(`/competencies/${owner.id}/#${tail}`, site),
			behaviors: objective.behaviors,
		};
	});
	const assumes = (data.assumes ?? []).map((a): BundleAssumed => {
		if (a.lesson && !sources.lessonIds.has(a.lesson))
			throw new Error(`${lesson.id}: assumes ${a.objective} from ${a.lesson}, which is not a lesson page`);
		return {
			objective: a.objective,
			lesson: a.lesson ?? null,
			section: a.section ?? null,
			url: a.lesson ? `${lessonUrl(a.lesson, site)}${a.section ? `#${a.section}` : ''}` : null,
		};
	});
	const checkpoints = sources.items
		.filter((i) => i.lesson === lesson.id)
		.map(({ lesson: _lesson, ...rest }): BundleCheckpoint => rest);
	return {
		version: BUNDLE_VERSION,
		id: lesson.id,
		url: lessonUrl(lesson.id, site),
		title: data.title,
		mode: data.mode,
		prose: proseOf(lesson.body ?? '', site),
		topics: [
			{
				id: topic.id,
				name: topic.name,
				definition: topic.definition,
				url: absoluteUrl(`/topics/${topic.id}/`, site),
				concepts: topic.concepts.map((c) => ({ id: c.id, name: c.name, definition: c.definition })),
			},
		],
		objectives,
		assumes,
		checkpoints,
		extends_to: (data['extends-to'] ?? []).map((e) => ({ label: e.label, url: absoluteUrl(e.href, site) })),
	};
}

/** One bundle per live lesson (every lesson page), in lesson id order, so the output is the same on every build. */
export async function buildLessonBundles(site: string): Promise<LessonBundle[]> {
	const [topics, competencies, lessons, { items }] = await Promise.all([
		getCollection('topics'),
		getCollection('competencies'),
		getLessons(),
		buildCheckpointExport(),
	]);
	const sources: BundleSources = {
		topics: topics.map((t) => t.data),
		competencies: competencies.map((c) => c.data),
		items,
		lessonIds: new Set(lessons.map((l) => l.id)),
		site,
	};
	return lessons.map((l) => bundleOf(l, sources));
}
