import { BUNDLE_VERSION } from './lesson-bundles';
import { absoluteUrl } from './url';

/**
 * The published tutor instruction file (spec S08 "Published instruction
 * file"): the Markdown source `site/src/tutor/instructions.md` with a YAML
 * frontmatter block the build fills in, written to `<base>/data/tutor.md`.
 * The installed tutor skill fetches it first, then a lesson bundle.
 * `renderTutorInstructions` is pure, so the tests run it on a small body,
 * and the route imports the source with Vite's `?raw` (a `node:fs` read
 * breaks once the route is bundled for prerendering).
 */

/** The bundle URL template the frontmatter ships, root-relative (S08 "URL scheme"). */
export const BUNDLE_URL_TEMPLATE = '/data/lessons/{area}/{lesson}.json';

export interface TutorInstructionsInput {
	/** The Markdown body, as the source file holds it. */
	body: string;
	/** Astro's `site`, the origin the absolute URLs start with. */
	site: string;
	/** ISO date of the build that emits the file. */
	built: string;
}

/** `date` as the ISO date `YYYY-MM-DD`, in UTC. */
export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/**
 * The published file: frontmatter (`version`, `built`, `bundle_url`, `site`,
 * the base URL without a trailing slash so `{site}/glossary/` joins cleanly)
 * and the body unchanged. The body writes `{site}` where it means the
 * frontmatter's `site` field, and says so, so nothing is substituted.
 */
export function renderTutorInstructions({ body, site, built }: TutorInstructionsInput): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(built)) throw new Error(`built must be an ISO date, got ${built}`);
	const frontmatter = [
		'---',
		`version: ${BUNDLE_VERSION}`,
		`built: ${built}`,
		`bundle_url: ${absoluteUrl(BUNDLE_URL_TEMPLATE, site)}`,
		`site: ${absoluteUrl('/', site).replace(/\/$/, '')}`,
		'---',
	].join('\n');
	return `${frontmatter}\n\n${body.trim()}\n`;
}
