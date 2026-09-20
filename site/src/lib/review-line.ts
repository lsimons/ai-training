/**
 * The review line of a lesson with a `review-by` date (spec S03 "Frontmatter"):
 * when its sources were last checked (Starlight's `lastUpdated`, when that is
 * a date) and by when they must be checked again.
 */

/** `2027-03-20`, for the `data-review-by` attribute. */
export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** `March 20, 2027`: American English, in UTC so a YAML date renders the same on every machine. */
export function longDate(date: Date): string {
	return date.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });
}

/**
 * The sentence the lesson page shows, or `null` when the lesson has no
 * `review-by`. `lastUpdated` is Starlight's frontmatter field, which may be a
 * boolean; only a date is used.
 */
export function reviewLine(reviewBy: Date | undefined, lastUpdated: Date | boolean | undefined): string | null {
	if (!reviewBy) return null;
	const due = `Review due by ${longDate(reviewBy)}.`;
	if (lastUpdated instanceof Date) return `Sources checked on ${longDate(lastUpdated)}. ${due}`;
	return due;
}
