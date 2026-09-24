import type { CheckpointKind } from './checkpoint-rules';
import { type CheckpointAttr, propValue, stringProp } from './checkpoint-source';
import { assertKnownConcepts, knownConceptIds } from './concepts';
import { checkpointOf, checkpointTagsOf, getLessons, type Lesson } from './lessons';

/**
 * A checkpoint as a standalone item (spec S03 "Checkpoint export"): what the
 * lesson page renders, minus the page around it, so a tutor or a quiz can
 * ask it out of context. `options` is what the learner is shown and `answer`
 * the correct response, both in the form of the kind (see `shapeOf`).
 */
export interface CheckpointItem {
	id: string;
	lesson: string;
	kind: CheckpointKind;
	objective: string;
	concepts: string[];
	context: string | null;
	stem: string;
	options: unknown;
	answer: unknown;
	hint: string;
	reviewable: boolean;
	revision: number;
	/** The `guessable` opt-out (`"<cue>: reason"`), or null. The guessability check in `mise run checkpoints` reads it. */
	guessable: string | null;
}

export interface CheckpointExport {
	/** Bumped when a field changes meaning. Consumers check it before reading items. */
	version: 1;
	items: CheckpointItem[];
}

interface OptionLike {
	text: string;
	correct?: boolean;
}
interface RowLike {
	statement: string;
	option: number;
}
interface ItemLike {
	text: string;
	bucket: number;
}

/** `options` and `answer` for one checkpoint, per kind. */
function shapeOf(
	where: string,
	kind: CheckpointKind,
	attrs: Map<string, CheckpointAttr>,
): { options: unknown; answer: unknown } {
	const prop = (name: string): unknown => propValue(where, attrs, name);
	switch (kind) {
		case 'choice':
		case 'scenario': {
			const options = prop('options') as OptionLike[];
			return { options: options.map((o) => o.text), answer: options.find((o) => o.correct)?.text ?? null };
		}
		case 'multi-choice': {
			const options = prop('options') as OptionLike[];
			return { options: options.map((o) => o.text), answer: options.filter((o) => o.correct).map((o) => o.text) };
		}
		case 'match': {
			const options = prop('options') as string[];
			const rows = prop('rows') as RowLike[];
			return {
				options: { options, statements: rows.map((r) => r.statement) },
				answer: rows.map((r) => ({ statement: r.statement, option: options[r.option] ?? null })),
			};
		}
		case 'order': {
			const steps = prop('steps') as string[];
			return { options: [...steps].sort((a, b) => a.localeCompare(b)), answer: steps };
		}
		case 'sort': {
			const buckets = prop('buckets') as string[];
			const items = prop('items') as ItemLike[];
			return {
				options: { buckets, items: items.map((i) => i.text) },
				answer: items.map((i) => ({ text: i.text, bucket: buckets[i.bucket] ?? null })),
			};
		}
		case 'predict':
			return { options: null, answer: prop('answer') ?? null };
		case 'repair':
			return { options: { broken: prop('broken') ?? '' }, answer: prop('model') ?? null };
	}
}

/** The standalone items of one lesson. Concept ids are not checked here; `buildCheckpointExport` does that. */
export function checkpointItemsOf(lesson: Lesson): CheckpointItem[] {
	return checkpointTagsOf(lesson).map((tag) => {
		const c = checkpointOf(lesson, tag);
		const where = `${lesson.id}#${c.id}`;
		const { options, answer } = shapeOf(where, c.kind, tag.attrs);
		return {
			id: c.id,
			lesson: lesson.id,
			kind: c.kind,
			objective: c.objective,
			concepts: c.concepts,
			context: c.context ?? null,
			stem: c.stem,
			options,
			answer,
			hint: c.hint,
			reviewable: c.reviewable,
			revision: c.revision,
			guessable: stringProp(where, tag.attrs, 'guessable') ?? null,
		};
	});
}

/** Every checkpoint of every lesson, in lesson order, with every concept id checked against the topics. */
export async function buildCheckpointExport(): Promise<CheckpointExport> {
	const known = await knownConceptIds();
	const lessons = await getLessons();
	const items = lessons.flatMap((l) => checkpointItemsOf(l));
	for (const item of items) assertKnownConcepts(`${item.lesson}#${item.id}`, item.concepts, known);
	return { version: 1, items };
}
