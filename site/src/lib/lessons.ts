import { type CollectionEntry, getCollection } from 'astro:content';
import {
	type CheckpointKind,
	type CheckpointTag,
	DEFAULT_REVISION,
	isReviewable,
	KIND_OF_TAG,
} from './checkpoint-rules';

export type Lesson = CollectionEntry<'docs'>;

export interface CheckpointInfo {
	id: string;
	title: string;
	kind: CheckpointKind;
	reviewable: boolean;
	/** Bumped by authors when the answer changes (spec S05 "Content changes"). */
	revision: number;
}

const TAG_START = new RegExp(`<(${Object.keys(KIND_OF_TAG).join('|')})\\b`, 'g');

/** Every lesson: a docs entry with `mode` in its frontmatter. */
export async function getLessons(area?: string): Promise<Lesson[]> {
	const docs = await getCollection('docs');
	return docs
		.filter((d) => Boolean(d.data.mode))
		.filter((d) => !area || d.id.startsWith(`${area}/`))
		.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The text of a JSX opening tag from `<` up to and including its `>`, skipping
 * any `>` inside quoted strings or `{...}` expressions (option arrays, template
 * literals).
 */
function openingTag(src: string, start: number): string {
	let depth = 0;
	let quote: string | null = null;
	for (let i = start; i < src.length; i++) {
		const ch = src[i];
		if (quote) {
			if (ch === '\\') i++;
			else if (ch === quote) quote = null;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') quote = ch;
		else if (ch === '{') depth++;
		else if (ch === '}') depth--;
		else if (ch === '>' && depth === 0) return src.slice(start, i + 1);
	}
	throw new Error(`unterminated tag starting at offset ${start}: ${src.slice(start, start + 60)}`);
}

/** A simple attribute value: `name="text"` or `name={expr}` (single-line expr). */
function attrValue(tag: string, name: string): string | undefined {
	const m = new RegExp(`\\b${name}=(?:"([^"]*)"|\\{([^}]*)\\})`).exec(tag);
	if (!m) return undefined;
	return (m[1] ?? m[2] ?? '').trim();
}

function hasAttr(tag: string, name: string): boolean {
	return new RegExp(`\\b${name}=`).test(tag);
}

/**
 * The checkpoints of a lesson, read from its MDX source. Component ids are
 * the checkpoint ids (spec S03). Reviewability follows the same rule the
 * component uses for `data-reviewable` (`lib/checkpoint-rules.ts`).
 */
export function checkpointsOf(lesson: Lesson): CheckpointInfo[] {
	const src = lesson.body ?? '';
	const out: CheckpointInfo[] = [];
	for (const m of src.matchAll(TAG_START)) {
		const tag = openingTag(src, m.index);
		const kind: CheckpointKind | undefined = KIND_OF_TAG[m[1] as CheckpointTag];
		if (!kind) throw new Error(`${lesson.id}: unknown checkpoint tag <${m[1]}>`);
		const id = attrValue(tag, 'id');
		if (!id) throw new Error(`${lesson.id}: <${m[1]}> without an id: ${tag.slice(0, 80)}`);
		const title = attrValue(tag, 'title') ?? id;
		const reviewAttr = attrValue(tag, 'review');
		if (reviewAttr !== undefined && reviewAttr !== 'true' && reviewAttr !== 'false') {
			throw new Error(`${lesson.id}#${id}: review must be {true} or {false}, got ${reviewAttr}`);
		}
		const revisionAttr = attrValue(tag, 'revision');
		const revision = revisionAttr === undefined ? DEFAULT_REVISION : Number(revisionAttr);
		if (!Number.isInteger(revision) || revision < 1)
			throw new Error(`${lesson.id}#${id}: revision must be a positive integer, got ${revisionAttr}`);
		const honor = kind === 'predict' && !hasAttr(tag, 'answer');
		out.push({
			id,
			title,
			kind,
			revision,
			reviewable: isReviewable({ kind, review: reviewAttr === undefined ? undefined : reviewAttr === 'true', honor }),
		});
	}
	return out;
}

/**
 * Levels for the lesson graph (spec S02 "Course page as lesson graph"): a
 * lesson sits one level below the deepest lesson it assumes, within the course.
 */
export function levelsOf(lessons: Lesson[]): Map<string, number> {
	const ids = new Set(lessons.map((l) => l.id));
	const level = new Map<string, number>();
	const visit = (l: Lesson, seen: Set<string>): number => {
		if (level.has(l.id)) return level.get(l.id)!;
		if (seen.has(l.id)) return 0;
		seen.add(l.id);
		const deps = (l.data.assumes ?? []).map((a) => a.lesson).filter((id) => ids.has(id) && id !== l.id);
		const depth = deps.length ? Math.max(...deps.map((id) => visit(lessons.find((x) => x.id === id)!, seen))) + 1 : 0;
		level.set(l.id, depth);
		return depth;
	};
	for (const l of lessons) visit(l, new Set());
	return level;
}
