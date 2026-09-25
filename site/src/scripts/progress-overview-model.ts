/**
 * The DOM-free part of the progress page (spec S04 "Export and import"): the
 * ids the build still knows, and the labels on each course card.
 * `progress-overview.ts` draws the page from these.
 */
import type { CatalogHabit } from './overview';
import type { CheckpointEntry } from './progress-model';

/** Mirrors the part of `lib/catalog.ts` this page reads (that module imports astro:content). */
export interface CatalogCheckpoint {
	id: string;
	reviewable: boolean;
	revision: number;
}
export interface CatalogLesson {
	id: string;
	title: string;
	checkpoints: CatalogCheckpoint[];
	practice: string[];
	habits: CatalogHabit[];
}
export interface CatalogCourse {
	area: string;
	title: string;
	lessons: CatalogLesson[];
}

/** Every progress id the build knows, per record section, for `progress.pruneOrphans` (spec S04 "Content changes"). */
export interface KnownIds {
	lessons: string[];
	checkpoints: string[];
	practice: string[];
	habits: string[];
}

export function knownIds(catalog: readonly CatalogCourse[]): KnownIds {
	const all = catalog.flatMap((c) => c.lessons);
	return {
		lessons: all.map((l) => l.id),
		checkpoints: all.flatMap((l) => l.checkpoints.map((c) => `${l.id}#${c.id}`)),
		practice: all.flatMap((l) => l.practice.map((id) => `${l.id}#${id}`)),
		habits: all.flatMap((l) => l.habits.map((h) => `${l.id}#${h.id}`)),
	};
}

/** The review link on a course card and the course page: "Review due: 2 items" or "Review: nothing due yet". */
export function reviewDueLabel(due: number): string {
	return due ? `Review due: ${due} item${due === 1 ? '' : 's'}` : 'Review: nothing due yet';
}

/** The hover text of one checkpoint square: "c1: passed" or "c1: not attempted". */
export function checkpointTitle(checkpointId: string, entry: CheckpointEntry | undefined): string {
	return `${checkpointId}: ${entry?.state ?? 'not attempted'}`;
}
