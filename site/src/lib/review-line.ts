/**
 * The review line of a lesson with a `review-by` date (spec S03 "Frontmatter"):
 * when its sources were last checked (`sources-checked`) and by when they must
 * be checked again. Starlight's `lastUpdated` is not read: it is about the
 * page, and a prose fix moves it without re-checking the sources.
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
 * `review-by`. Without `sources-checked` only the due date is shown.
 */
export function reviewLine(reviewBy: Date | undefined, sourcesChecked: Date | undefined): string | null {
	if (!reviewBy) return null;
	const due = `Review due by ${longDate(reviewBy)}.`;
	if (sourcesChecked) return `Sources checked on ${longDate(sourcesChecked)}. ${due}`;
	return due;
}
