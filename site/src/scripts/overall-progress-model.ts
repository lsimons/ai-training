/**
 * The DOM-free part of the overall progress bar (spec S04 "Progress
 * display"): the summary line and where the continue button points.
 * `overall-progress.ts` draws the bar from these and from `overview.ts`.
 */
import type { Overall } from './overview';

/** The summary line under the bar on the progress page. */
export function overallText(o: Overall): string {
	if (!o.any) return `${o.lessons} lessons and ${o.checkpoints} checkpoints across six courses. Nothing started yet.`;
	const started = o.started ? `, ${o.started} in progress` : '';
	return `${o.finished} of ${o.lessons} lessons finished${started}; ${o.passed} of ${o.checkpoints} checkpoints passed.`;
}

export interface ContinueLink {
	href: string;
	text: string;
}

/**
 * The continue button once there is progress: the next unfinished lesson;
 * with none left, the first skipped one; with nothing skipped either, the
 * topic map. Null without progress, so the rendered "Start with" link stays.
 */
export function continueLink(o: Overall, base: string): ContinueLink | null {
	if (!o.any) return null;
	const target = o.next ?? o.firstSkipped;
	if (target && (o.next || o.finished === 0))
		return { href: `${base}/${target.id}/`, text: `Continue with: ${target.title}` };
	if (target) return { href: `${base}/${target.id}/`, text: `All lessons finished, ${o.skipped} skipped` };
	return { href: `${base}/map/`, text: 'All lessons finished: see the topic map' };
}
