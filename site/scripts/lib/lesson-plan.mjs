/**
 * The lesson plan the wave picker (scripts/next_wave.py, `mise run
 * next-wave`) reads, built from the data tree and the ids of the lessons
 * that have a page. scripts/lesson-plan.mjs prints it as JSON, and
 * tests/scripts/lesson-plan.test.ts covers this module.
 *
 * The plan is `{ lessons: [...] }`, one entry per lesson file whose `id`
 * is a string, in the area order of `readAreaTree` and the file order within
 * an area. Each entry has:
 *
 * - `id`, `area` (the area directory) and `title` (`null` when the file has none),
 * - `issue`, the plan's lesson issue number, or `null` when it names none,
 * - `position`, the 1-based place of the lesson in the area's courses read in
 *   file order (`courseLessonIds`), or `null` when no course lists it,
 * - `after`, the `after` entries as the file gives them,
 * - `assumes`, the objectives of the `assumes` entries that name one,
 * - `serves`, the objectives the lesson serves,
 * - `live`, whether the lesson has a page under src/content/docs.
 */
import { courseLessonIds } from './area-tree.mjs';

/**
 * @typedef {{ id: string, area: string, title: unknown, issue: number | null, position: number | null, after: unknown, assumes: string[], serves: string[], live: boolean }} PlannedLesson
 */

/**
 * The lesson plan of a data tree, given the ids of the lessons that have a page.
 * @param {import('./area-tree.mjs').AreaTree} tree
 * @param {Iterable<string>} livePageIds
 * @returns {{ lessons: PlannedLesson[] }}
 */
export function lessonPlan(tree, livePageIds) {
	const live = new Set(livePageIds);
	/** @type {PlannedLesson[]} */
	const lessons = [];
	for (const a of tree.areas) {
		const order = a.courses.flatMap((c) => courseLessonIds(c.data));
		for (const { data: l } of a.lessons) {
			if (typeof l?.id !== 'string') continue;
			const index = order.indexOf(l.id);
			lessons.push({
				id: l.id,
				area: a.dir,
				title: l.title ?? null,
				issue: typeof l.issue === 'number' ? l.issue : null,
				position: index === -1 ? null : index + 1,
				after: l.after ?? [],
				assumes: (l.assumes ?? []).map((x) => x?.objective).filter((o) => typeof o === 'string'),
				serves: (l.serves ?? []).filter((o) => typeof o === 'string'),
				live: live.has(l.id),
			});
		}
	}
	return { lessons };
}
