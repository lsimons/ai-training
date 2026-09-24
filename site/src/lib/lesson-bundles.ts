import { getCollection } from 'astro:content';
import { buildCheckpointExport, type CheckpointItem } from './checkpoint-items';
import { KIND_OF_TAG } from './checkpoint-rules';
import { openingTagEnd, parseAttrs } from './checkpoint-source';
import { getLessons, type Lesson } from './lessons';

/**
 * Lesson bundles (spec S08 "Lesson bundles"): one JSON file per live lesson,
 * written by the build to `<base>/data/lessons/<area>/<lesson>.json` and
 * read by the published tutor skill. Everything here is built from the same
 * content collections as the lesson page. `bundleOf` and `proseOf` are pure,
 * so the tests run them on the fixture lessons, and `buildLessonBundles`
 * is the one function that reads the collections.
 */

/** Bumped when a field changes meaning; equal to the tutor instruction file's `version` (S08). */
export const BUNDLE_VERSION = 1;

/** Astro's `site` (an origin such as `https://lsimons.github.io`) and `base` (`/ai-training`, no trailing slash). */
export interface SiteInfo {
	site: string;
	base: string;
}

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
	site: SiteInfo;
}

/** A root-relative path (`/guides/foo/`) as an absolute URL. A path that already has the base keeps it; an absolute URL is returned as is. */
export function absoluteUrl(path: string, { site, base }: SiteInfo): string {
	if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
	if (!path.startsWith('/')) throw new Error(`absoluteUrl() takes a root-relative path or a URL, got ${path}`);
	const origin = site.replace(/\/$/, '');
	return path === base || path.startsWith(`${base}/`) ? `${origin}${path}` : `${origin}${base}${path}`;
}

/** The lesson page URL for a lesson id, `<site><base>/<area>/<lesson>/`. */
export function lessonUrl(id: string, site: SiteInfo): string {
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

/** The component names imported from `@components/widgets/`; their tags leave nothing in the prose. */
function widgetNames(src: string): Set<string> {
	const names = new Set<string>();
	for (const m of src.matchAll(/^import\s+(\w+)\s+from\s+['"]@components\/widgets\/[^'"]+['"];?\s*$/gm)) {
		names.add(m[1] as string);
	}
	return names;
}

/** One component, as plain Markdown. `children` is already rendered. */
function renderTag(
	name: string,
	attrs: Map<string, { value: string }>,
	children: string,
	widgets: Set<string>,
): string {
	const str = (n: string) => attrs.get(n)?.value;
	const body = children.trim();
	const withHeading = (heading: string) => (body ? `${heading}\n\n${body}` : heading);
	if (widgets.has(name)) return '';
	if (CHECKPOINT_TAGS.has(name)) {
		// A <Predict> without an objective is a worked example, not a checkpoint (S03 "Examples").
		const label = attrs.has('objective') ? 'Checkpoint' : 'Example';
		const title = str('title') ?? str('id') ?? name;
		return withHeading(`#### ${label}: ${title}`);
	}
	switch (name) {
		case 'Pitfall':
			return withHeading(`#### Pitfall: ${str('title') ?? ''}`.trimEnd());
		case 'Prompt':
			return `#### Prompt\n\n${fenced(body)}`;
		case 'Response':
			return `#### Response\n\n${fenced(body)}`;
		case 'Exercise': {
			const stretch = str('stretch');
			return withHeading('## Exercise') + (stretch ? `\n\nStretch: ${stretch}` : '');
		}
		case 'Recap':
			return withHeading('## Recap');
		default:
			return body;
	}
}

/**
 * The component tags in `src`, rendered to Markdown (`renderTag`), children
 * first. A tag is `<Name ...>` with a capitalized name, self-closing or
 * closed by the first `</Name>` after it; components of one kind don't nest.
 */
function renderComponents(src: string, widgets: Set<string>): string {
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
			children = renderComponents(src.slice(openEnd, closeAt), widgets);
			end = closeAt + close.length;
		}
		// A component is a block of its own, so blank lines set it off from its neighbors.
		const rendered = renderTag(name, attrs, children, widgets);
		out += src.slice(pos, start) + (rendered ? `\n\n${rendered}\n\n` : '');
		pos = end;
	}
	return out + src.slice(pos);
}

/** Every root-relative link and image in Markdown and raw HTML, made absolute. Links with a scheme, `#` and `mailto:` are left alone. */
function absolutizeLinks(md: string, site: SiteInfo): string {
	return md
		.replace(/(!?\[[^\]]*\]\()(\/(?!\/)[^)\s]*)/g, (_, pre: string, path: string) => pre + absoluteUrl(path, site))
		.replace(/((?:href|src)=")(\/(?!\/)[^"]*)/g, (_, pre: string, path: string) => pre + absoluteUrl(path, site));
}

/**
 * The lesson body as Markdown for a reader without the components: imports
 * dropped, components rendered to plain text (a `Pitfall` becomes a titled
 * paragraph, a `Prompt` a fenced block), widgets omitted, links absolute.
 */
export function proseOf(body: string, site: SiteInfo): string {
	const widgets = widgetNames(body);
	const withoutImports = body.replace(/^import\s[^\n]*\n/gm, '');
	const rendered = renderComponents(withoutImports, widgets);
	return `${absolutizeLinks(rendered, site)
		.replace(/\n{3,}/g, '\n\n')
		.trim()}\n`;
}

/** The bundle of one lesson. Throws when `covers` names an unknown topic or a served objective is in no competency. */
export function bundleOf(lesson: Lesson, sources: BundleSources): LessonBundle {
	const { site } = sources;
	const { data } = lesson;
	const topic = sources.topics.find((t) => t.id === data.covers);
	if (data.covers && !topic) throw new Error(`${lesson.id}: covers ${data.covers}, which is not a topic`);
	const objectives = (data.serves ?? []).map((id): BundleObjective => {
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
	const assumes = (data.assumes ?? []).map(
		(a): BundleAssumed => ({
			objective: a.objective,
			lesson: a.lesson ?? null,
			section: a.section ?? null,
			url: a.lesson ? `${lessonUrl(a.lesson, site)}${a.section ? `#${a.section}` : ''}` : null,
		}),
	);
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
		topics: topic
			? [
					{
						id: topic.id,
						name: topic.name,
						definition: topic.definition,
						url: absoluteUrl(`/topics/${topic.id}/`, site),
						concepts: topic.concepts.map((c) => ({ id: c.id, name: c.name, definition: c.definition })),
					},
				]
			: [],
		objectives,
		assumes,
		checkpoints,
		extends_to: (data['extends-to'] ?? []).map((e) => ({ label: e.label, url: absoluteUrl(e.href, site) })),
	};
}

/** One bundle per live lesson (every lesson page), in lesson id order, so the output is the same on every build. */
export async function buildLessonBundles(site: SiteInfo): Promise<LessonBundle[]> {
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
		site,
	};
	return lessons.map((l) => bundleOf(l, sources));
}
