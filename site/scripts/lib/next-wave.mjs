/**
 * The wave picker's logic (`mise run next-wave`, docs/agents/meta-orchestration.md,
 * "The loop", step 1): which planned lessons the next wave of builders should
 * take on. `pickWave` reads the data tree and the set of live lesson pages,
 * and gets the `ready-for-agent` issues from the caller, so it never touches
 * the network. `scripts/next-wave.mjs` is the command-line entry and
 * tests/scripts/next-wave.test.ts covers this module.
 *
 * A lesson is a candidate when its plan file names an `issue`, it has no
 * page yet, and that issue is ready and unassigned. It is blocked when one
 * of its `assumes` entries names a lesson that has no page: `mise run data`
 * rejects a live lesson that assumes a planned one, so the builder could
 * not land it. An `after` entry that is still planned does not block. It is
 * reported per lesson so the wave lead can stack the two branches.
 */
import { courseLessonIds } from './area-tree.mjs';

/**
 * @typedef {{ number: number, title: string, assignees: string[] }} ReadyIssue
 * @typedef {{ issue: number, id: string, title: string, area: string, course: string, position: number | null, afterPlanned: string[] }} WaveEntry
 * @typedef {{ issue: number, id: string, blockedBy: string[] }} BlockedEntry
 * @typedef {{ issue: number, id: string, reason: string }} SkippedEntry
 * @typedef {{ wave: WaveEntry[], blocked: BlockedEntry[], skipped: SkippedEntry[], waiting: WaveEntry[] }} Wave
 */

/**
 * Pick the next wave.
 *
 * Within an area, candidates with no planned `after` come first, then course
 * position (a lesson no course lists has position `null` and sorts last).
 * The wave takes one lesson per area in turn, in the tree's area order,
 * until `size` is reached or the areas run out, so every area gets progress.
 * Every candidate ends up in exactly one of the four lists: `wave`,
 * `blocked` (an `assumes` lesson has no page), `skipped` (the issue is not
 * ready or is assigned) or `waiting` (fit for a wave, but this one is full).
 *
 * @param {{ tree: import('./area-tree.mjs').AreaTree, livePageIds: Iterable<string>, readyIssues: ReadyIssue[], size?: number }} input
 * @returns {Wave}
 */
export function pickWave({ tree, livePageIds, readyIssues, size = 6 }) {
	const live = new Set(livePageIds);
	const ready = new Map(readyIssues.map((i) => [i.number, i]));
	/** @type {WaveEntry[][]} */
	const perArea = [];
	/** @type {BlockedEntry[]} */
	const blocked = [];
	/** @type {SkippedEntry[]} */
	const skipped = [];

	for (const a of tree.areas) {
		const order = a.courses.flatMap((c) => courseLessonIds(c.data));
		const course = a.courses[0]?.data?.id ?? a.dir;
		/** @type {WaveEntry[]} */
		const candidates = [];
		for (const { data: l } of a.lessons) {
			if (typeof l?.issue !== 'number' || typeof l?.id !== 'string') continue;
			if (live.has(l.id)) continue;
			const issue = ready.get(l.issue);
			if (!issue) {
				skipped.push({ issue: l.issue, id: l.id, reason: 'issue is not ready-for-agent' });
				continue;
			}
			if (issue.assignees.length) {
				skipped.push({ issue: l.issue, id: l.id, reason: `issue is assigned to ${issue.assignees.join(', ')}` });
				continue;
			}
			const blockedBy = [...new Set((l.assumes ?? []).map((x) => x?.lesson).filter((x) => x && !live.has(x)))];
			if (blockedBy.length) {
				blocked.push({ issue: l.issue, id: l.id, blockedBy });
				continue;
			}
			const index = order.indexOf(l.id);
			candidates.push({
				issue: l.issue,
				id: l.id,
				title: l.title ?? issue.title,
				area: a.dir,
				course,
				position: index === -1 ? null : index + 1,
				afterPlanned: (l.after ?? []).filter((x) => !live.has(x)),
			});
		}
		const rank = (c) => c.position ?? Number.POSITIVE_INFINITY;
		candidates.sort(
			(x, y) => Number(x.afterPlanned.length > 0) - Number(y.afterPlanned.length > 0) || rank(x) - rank(y),
		);
		perArea.push(candidates);
	}

	/** @type {WaveEntry[]} */
	const wave = [];
	let taken = true;
	while (wave.length < size && taken) {
		taken = false;
		for (const candidates of perArea) {
			if (wave.length >= size) break;
			const next = candidates.shift();
			if (!next) continue;
			wave.push(next);
			taken = true;
		}
	}
	return { wave, blocked, skipped, waiting: perArea.flat() };
}
