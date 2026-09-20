/**
 * Due review counts per course for the surfaces outside the course page
 * (spec S05 "Where reviews surface"): the sidebar count next to each course
 * and the "Concepts: 3 items due" lines on the landing and progress pages.
 * DOM-free; `day` is a parameter so tests can pin it. The count is the same
 * `dueReviewIdsOn` the course page card uses, uncapped.
 */
import { dueReviewIdsOn, type ProgressRecord } from './progress-model';

export interface DueCourse {
	area: string;
	title: string;
	/** Items due on or before `day`, uncapped. Always greater than zero. */
	due: number;
}

/** Courses with at least one item due, in the order of `courses`. */
export function dueByCourse(
	courses: readonly { area: string; title: string }[],
	record: ProgressRecord,
	day: string,
): DueCourse[] {
	return courses
		.map((c) => ({ area: c.area, title: c.title, due: dueReviewIdsOn(record, `${c.area}/`, day).length }))
		.filter((c) => c.due > 0);
}

/** The landing and progress page line: "Concepts: 3 items due". */
export function dueLine(course: DueCourse): string {
	return `${course.title}: ${course.due} ${course.due === 1 ? 'item' : 'items'} due`;
}

/** The screen-reader text after the sidebar count, so the link reads "Concepts 3 review items due". */
export function dueCountLabel(due: number): string {
	return due === 1 ? ' review item due' : ' review items due';
}
