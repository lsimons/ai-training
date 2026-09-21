import { getCollection } from 'astro:content';

/**
 * Concept ids (spec S02) are unique across every topic, and the glossary
 * anchors (`/glossary/#<id>`) rely on that. Checkpoints tag the concepts they
 * exercise with these ids (spec S03 "Checkpoints"), so both the component
 * and the export check them here.
 */
export async function knownConceptIds(): Promise<Set<string>> {
	const topics = await getCollection('topics');
	return new Set(topics.flatMap((t) => t.data.concepts.map((c) => c.id)));
}

/** Throws when `concepts` is empty or names an id that is not a concept. `where` names the checkpoint in the message. */
export function assertKnownConcepts(where: string, concepts: readonly string[], known: ReadonlySet<string>): void {
	if (concepts.length === 0) throw new Error(`${where}: concepts needs at least one concept id`);
	const unknown = concepts.filter((c) => !known.has(c));
	if (unknown.length) {
		throw new Error(
			`${where}: unknown concept id${unknown.length === 1 ? '' : 's'} ${unknown.map((c) => JSON.stringify(c)).join(', ')} (see site/src/data/areas/<area>/topics/)`,
		);
	}
}
