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

/**
 * Where the build publishes the instruction file, root-relative. The route
 * file `src/pages/data/tutor.md.ts` fixes the path, and the bootstrap test
 * checks that the route file is at this path and that `SKILL.md` names it.
 */
export const TUTOR_INSTRUCTIONS_PATH = '/data/tutor.md';

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

/** The local base the bootstrap accepts besides the published one, as `SKILL.md` writes it. */
export const LOCAL_TUTOR_BASE = 'http://localhost:<port>/ai-training/';

/**
 * The fetch base for a lesson URL the learner pasted, or null when the bootstrap
 * must refuse it (spec S08 "Bootstrap contract", #351). The bootstrap follows the
 * fetched `tutor.md` as instructions, so a base on another host would load someone
 * else's. Only the published base (from Astro's `site`) and a local build on
 * `http://localhost:<port>/ai-training/` are allowed. `SKILL.md` states the same
 * rule in words, and the bootstrap test checks the two agree.
 */
export function tutorBase(lessonUrl: string, site: string): string | null {
	let url: URL;
	try {
		url = new URL(lessonUrl);
	} catch {
		return null;
	}
	const published = absoluteUrl('/', site);
	if (url.username !== '' || url.password !== '') return null;
	if (url.pathname !== '/ai-training/' && !url.pathname.startsWith('/ai-training/')) return null;
	const base = `${url.origin}/ai-training/`;
	if (base === published) return base;
	if (url.protocol === 'http:' && url.hostname === 'localhost' && url.port !== '') return base;
	return null;
}
