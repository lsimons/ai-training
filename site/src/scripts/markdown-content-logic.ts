/**
 * The lesson frame of `overrides/MarkdownContent.astro`, the pure part: which
 * routing card shows (spec S02 "Differentiation by routing"), how many
 * checkpoints still block finishing, and what the finish and skip controls
 * say (spec S04 "Lesson states"). `markdown-content.ts` reads the record and
 * the page and calls these. No DOM.
 */
import type { CheckpointEntry, Comfort, LessonEntry } from './progress-model';

/** Whether each routing card is hidden. */
export interface RouteView {
	behindHidden: boolean;
	aheadHidden: boolean;
}

/**
 * A failed or skipped checkpoint, or comfort `less`, shows the "worth
 * revisiting first" card. Every checkpoint passed on the first try, or
 * comfort `more`, shows the extensions. `states` holds the record entry of
 * each counting checkpoint, `undefined` for one not answered yet.
 */
export function routeView(states: readonly (CheckpointEntry | undefined)[], comfort: Comfort | undefined): RouteView {
	const anyStuck = states.some((s) => s && s.state !== 'passed');
	const allClean = states.length > 0 && states.every((s) => s?.state === 'passed' && s.attempts === 1);
	return { behindHidden: !(anyStuck || comfort === 'less'), aheadHidden: !(allClean || comfort === 'more') };
}

/** The checkpoints neither passed nor skipped: `finished` needs this to be zero (spec S04 "Lesson states"). */
export function openCount(states: readonly (CheckpointEntry | undefined)[]): number {
	return states.filter((s) => s?.state !== 'passed' && s?.state !== 'skipped').length;
}

/** The finish button and the note under it. */
export interface FinishView {
	disabled: boolean;
	label: string;
	note: string;
}

export function finishView(lesson: LessonEntry | undefined, open: number): FinishView {
	const finished = lesson?.state === 'finished';
	return {
		disabled: finished || open > 0,
		label: finished ? `Finished ✓ (${lesson.at})` : 'Mark lesson finished',
		note:
			!finished && open > 0
				? `Pass or skip ${open} more checkpoint${open === 1 ? '' : 's'} to finish this lesson.`
				: '',
	};
}

/** A skip button: disabled once the lesson is skipped or finished. */
export function skipView(lesson: LessonEntry | undefined): { disabled: boolean; label: string } {
	return {
		disabled: lesson?.state === 'skipped' || lesson?.state === 'finished',
		label: lesson?.state === 'skipped' ? `Skipped (${lesson.at})` : 'I know this, skip it',
	};
}
