import { getCollection, type CollectionEntry } from 'astro:content';

export type Lesson = CollectionEntry<'docs'>;

export interface CheckpointInfo {
	id: string;
	kind: string;
	reviewable: boolean;
}

const CHECKPOINT_TAG = /<(Choice|Scenario|Predict|Order|Sort|Repair)\b[^>]*?\bid="([^"]+)"/g;

/** Every lesson: a docs entry with `mode` in its frontmatter. */
export async function getLessons(area?: string): Promise<Lesson[]> {
	const docs = await getCollection('docs');
	return docs
		.filter((d) => Boolean(d.data.mode))
		.filter((d) => !area || d.id.startsWith(`${area}/`))
		.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The checkpoints of a lesson, read from its MDX source. Component ids are
 * the checkpoint ids (spec S03); `Repair` is not reviewable (spec S05).
 */
export function checkpointsOf(lesson: Lesson): CheckpointInfo[] {
	const out: CheckpointInfo[] = [];
	for (const m of (lesson.body ?? '').matchAll(CHECKPOINT_TAG)) {
		const kind = m[1].toLowerCase();
		out.push({ id: m[2], kind, reviewable: kind !== 'repair' });
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
	lessons.forEach((l) => visit(l, new Set()));
	return level;
}
