import { type CollectionEntry, getCollection } from 'astro:content';
import { type CheckpointKind, DEFAULT_REVISION, isReviewable } from './checkpoint-rules';
import { type CheckpointTagInfo, CONCEPTS_FORM, propValue, scanCheckpointTags, stringProp } from './checkpoint-source';

export type Lesson = CollectionEntry<'docs'>;

export type { CheckpointAttr, CheckpointTagInfo } from './checkpoint-source';
export { CONCEPTS_FORM, parseAttrs } from './checkpoint-source';

export interface CheckpointInfo {
	id: string;
	title: string;
	kind: CheckpointKind;
	reviewable: boolean;
	/** Bumped by authors when the answer changes (spec S05 "Content changes"). */
	revision: number;
	/** The one learning objective the checkpoint evidences (spec S03 "Checkpoints"). */
	objective: string;
	/** The S02 concept ids the checkpoint exercises, at least one (spec S03 "Checkpoints"). */
	concepts: string[];
	/** One paragraph that makes the item readable outside its lesson, shown on the review page. */
	context: string | undefined;
	hint: string;
	/** The children of the tag, as Markdown source. Empty for a self-closing tag. */
	stem: string;
}

/** Every lesson: a docs entry with `mode` in its frontmatter. */
export async function getLessons(area?: string): Promise<Lesson[]> {
	const docs = await getCollection('docs');
	return docs
		.filter((d) => Boolean(d.data.mode))
		.filter((d) => !area || d.id.startsWith(`${area}/`))
		.sort((a, b) => a.id.localeCompare(b.id));
}

/** The checkpoint tags of a lesson, read from its MDX source (`lib/checkpoint-source.ts`). */
export function checkpointTagsOf(lesson: Lesson): CheckpointTagInfo[] {
	return scanCheckpointTags(lesson.body ?? '', lesson.id);
}

/**
 * The `concepts` prop as a list of ids: the array-literal form, evaluated
 * the same way the component receives it, non-empty and all strings. The
 * ids are checked against the topics by the caller (`lib/concepts.ts`).
 */
export function conceptsProp(where: string, attrs: CheckpointTagInfo['attrs']): string[] {
	const attr = attrs.get('concepts');
	if (!attr?.expr) throw new Error(`${where}: ${CONCEPTS_FORM} is required`);
	const value = propValue(where, attrs, 'concepts');
	if (!Array.isArray(value) || !value.every((c) => typeof c === 'string')) {
		throw new Error(`${where}: concepts must be an array of concept ids, as ${CONCEPTS_FORM}`);
	}
	if (value.length === 0) throw new Error(`${where}: concepts needs at least one concept id`);
	return value as string[];
}

/**
 * One checkpoint from its tag. Component ids are the checkpoint ids (spec
 * S03). Reviewability follows the same rule the component uses for
 * `data-reviewable` (`lib/checkpoint-rules.ts`).
 */
export function checkpointOf(lesson: Lesson, { tag, kind, attrs, stem }: CheckpointTagInfo): CheckpointInfo {
	const id = stringProp(`${lesson.id} <${tag}>`, attrs, 'id');
	if (!id) throw new Error(`${lesson.id}: <${tag}> without an id`);
	const where = `${lesson.id}#${id}`;
	const str = (name: string) => stringProp(where, attrs, name);
	const title = str('title') ?? id;
	const reviewAttr = attrs.get('review')?.value;
	if (reviewAttr !== undefined && reviewAttr !== 'true' && reviewAttr !== 'false') {
		throw new Error(`${where}: review must be {true} or {false}, got ${reviewAttr}`);
	}
	const revisionAttr = attrs.get('revision')?.value;
	const revision = revisionAttr === undefined ? DEFAULT_REVISION : Number(revisionAttr);
	if (!Number.isInteger(revision) || revision < 1)
		throw new Error(`${where}: revision must be a positive integer, got ${revisionAttr}`);
	const honor = kind === 'predict' && !attrs.has('answer');
	return {
		id,
		title,
		kind,
		revision,
		reviewable: isReviewable({ kind, review: reviewAttr === undefined ? undefined : reviewAttr === 'true', honor }),
		objective: str('objective') ?? '',
		concepts: conceptsProp(where, attrs),
		context: str('context'),
		hint: str('hint') ?? '',
		stem,
	};
}

/** The checkpoints of a lesson, read from its MDX source. */
export function checkpointsOf(lesson: Lesson): CheckpointInfo[] {
	return checkpointTagsOf(lesson).map((t) => checkpointOf(lesson, t));
}
