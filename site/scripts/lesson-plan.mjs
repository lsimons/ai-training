#!/usr/bin/env bun
/**
 * Lesson plan (`mise run lesson-plan`): what the wave picker
 * (scripts/next_wave.py, `mise run next-wave`) needs to know about the
 * lessons of this checkout, as JSON on stdout. It is the picker's one
 * boundary with the site (#492): the picker reads this JSON and nothing
 * else from the site's source tree.
 *
 * The output is `{ "lessons": [...] }`, one entry per lesson file whose `id`
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
 *
 * tests/scripts/lesson-plan.test.ts covers `lessonPlan` and runs this file.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseLessonIds, readAreaTree } from './lib/area-tree.mjs';
import { lessonPages } from './lib/data.mjs';

/**
 * @typedef {{ id: string, area: string, title: unknown, issue: number | null, position: number | null, after: unknown, assumes: string[], serves: string[], live: boolean }} PlannedLesson
 */

/**
 * The lesson plan of a data tree, given the ids of the lessons that have a page.
 * @param {import('./lib/area-tree.mjs').AreaTree} tree
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL('..', import.meta.url));
	const tree = readAreaTree(join(root, 'src/data'));
	const livePageIds = lessonPages(join(root, 'src/content/docs'), new Set(tree.areas.map((a) => a.dir))).keys();
	process.stdout.write(`${JSON.stringify(lessonPlan(tree, livePageIds), null, 2)}\n`);
}
