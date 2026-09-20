/**
 * The learner's reference (spec S02 "Learner's reference"), the pure part: which
 * lessons are unlocked and how the `/reference/` page groups them. The topic
 * page and the reference page scripts read the record and call these. No DOM.
 */
import type { ProgressRecord } from './progress-model';

export interface ReferenceTopic {
	id: string;
	name: string;
}

export interface ReferenceLesson {
	id: string;
	title: string;
	topics: ReferenceTopic[];
}

export interface ReferenceArea {
	area: string;
	title: string;
	lessons: ReferenceLesson[];
}

/** A lesson's reference is shown when the lesson is `finished`. Read and skipped do not unlock it. */
export function isUnlocked(record: ProgressRecord, lessonId: string): boolean {
	return record.lessons[lessonId]?.state === 'finished';
}

/** The catalog reduced to finished lessons, keeping only the areas with at least one. */
export function finishedByArea(catalog: ReferenceArea[], record: ProgressRecord): ReferenceArea[] {
	return catalog
		.map((a) => ({ ...a, lessons: a.lessons.filter((l) => isUnlocked(record, l.id)) }))
		.filter((a) => a.lessons.length > 0);
}
