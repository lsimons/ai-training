import type { CheckpointKind } from './checkpoint-rules';
import { assertKnownConcepts, knownConceptIds } from './concepts';
import { type CheckpointInfo, checkpointsOf, checkpointTagsOf, getLessons, type Lesson } from './lessons';

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

/**
 * The value of an expression prop (`options={[...]}`), evaluated. The
 * expressions are JavaScript literals written by the lesson authors in this
 * repository and evaluated at build only, so `Function` is the parser here
 * rather than a second JSX-literal grammar.
 */
function evaluate(where: string, name: string, expr: string): unknown {
	try {
		return new Function(`return (${expr});`)();
	} catch (e) {
		throw new Error(`${where}: cannot evaluate ${name}={...}: ${(e as Error).message}`);
	}
}

/** `options` and `answer` for one checkpoint, per kind. */
function shapeOf(
	where: string,
	kind: CheckpointKind,
	attrs: Map<string, { value: string; expr: boolean }>,
): { options: unknown; answer: unknown } {
	const prop = (name: string): unknown => {
		const a = attrs.get(name);
		if (!a) return undefined;
		return a.expr ? evaluate(where, name, a.value) : a.value;
	};
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
	const tags = checkpointTagsOf(lesson);
	return checkpointsOf(lesson).map((c: CheckpointInfo, i) => {
		const tag = tags[i];
		if (!tag) throw new Error(`${lesson.id}#${c.id}: no tag at index ${i}`);
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
