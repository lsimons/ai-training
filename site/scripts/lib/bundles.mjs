/**
 * The lesson bundle check's logic (spec S08 "Build"): the build writes one
 * `dist/data/lessons/<area>/<lesson>.json` per lesson page, and this reads
 * them back. `checkBundles` reports a problem when
 *
 * - a lesson page has no bundle file, or a bundle file has no lesson page;
 * - a bundle is not JSON, its `version` is not `BUNDLE_VERSION`, its `id` is
 *   not its path, or its `url` is not an absolute URL ending in `/<id>/`;
 * - a field S08 "Format" names is missing or has the wrong type, or `mode`
 *   is not `tutorial` or `explanation`;
 * - a fenced code block of the page (```` ``` ```` or `~~~`, three or more) is
 *   not in the bundle's `prose` byte for byte. The prose pass in
 *   `src/lib/lesson-bundles.ts` sets code aside so its rewrites skip it, and
 *   this is the check that it did.
 *
 * The bundles are written by `src/pages/data/lessons/[...id].json.ts` from
 * the same content collections as the pages, and their unit tests run on
 * fixture lessons. This check reads the built files, so a rewrite that only
 * shows on a real lesson page fails in CI rather than on the tutor.
 * `scripts/check-bundles.mjs` is the command-line entry; tests import this.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUNDLE_VERSION } from '../../src/lib/bundle-version.ts';
import { readAreaTree } from './area-tree.mjs';
import { lessonPages, walk } from './data.mjs';

/** Field name to the `typeof` it must have; the array fields follow. */
export const REQUIRED = {
	version: 'number',
	id: 'string',
	url: 'string',
	title: 'string',
	mode: 'string',
	prose: 'string',
};

/** The fields S08 "Format" lists as arrays. */
export const ARRAYS = ['topics', 'objectives', 'assumes', 'checkpoints', 'extends_to'];

export const MODES = new Set(['tutorial', 'explanation']);

/**
 * Every fenced code block in `src`, opening line to closing line, as the
 * page holds it. A fence is a line that starts with three or more backticks
 * or tildes (after optional indentation), closed by a line of the same
 * character at least as long, or by the end of the text.
 */
export function fencedBlocks(src) {
	const lines = src.split('\n');
	const out = [];
	for (let i = 0; i < lines.length; i++) {
		const open = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
		if (!open) continue;
		const fence = open[1];
		const block = [lines[i]];
		for (i++; i < lines.length; i++) {
			block.push(lines[i]);
			const close = /^\s*(`{3,}|~{3,})\s*$/.exec(lines[i]);
			if (close && close[1][0] === fence[0] && close[1].length >= fence.length) break;
		}
		out.push(block.join('\n'));
	}
	return out;
}

/** `<area>/<lesson>` for every `.json` under `bundlesDir`. */
export function bundleIds(bundlesDir) {
	const out = new Set();
	if (!existsSync(bundlesDir)) return out;
	for (const p of walk(bundlesDir)) {
		if (p.endsWith('.json')) out.add(p.slice(bundlesDir.length + 1).replace(/\.json$/, ''));
	}
	return out;
}

/** Whether `url` is an absolute URL whose path ends in `/<id>/`, the lesson page under the site's origin and base. */
export function isLessonUrl(url, id) {
	try {
		return new URL(url).pathname.endsWith(`/${id}/`);
	} catch {
		return false;
	}
}

/** The problems of one bundle `id` at `file` against its page source `src`. */
export function checkBundle(id, file, src) {
	const errors = [];
	let bundle;
	try {
		bundle = JSON.parse(readFileSync(file, 'utf8'));
	} catch (e) {
		return [`${id}: not JSON: ${e.message}`];
	}
	if (bundle === null || typeof bundle !== 'object' || Array.isArray(bundle)) return [`${id}: not a JSON object`];
	for (const [field, type] of Object.entries(REQUIRED)) {
		if (typeof bundle[field] !== type) errors.push(`${id}: ${field} must be a ${type}`);
	}
	for (const field of ARRAYS) {
		if (!Array.isArray(bundle[field])) errors.push(`${id}: ${field} must be a list`);
	}
	if (bundle.version !== BUNDLE_VERSION)
		errors.push(`${id}: version is ${JSON.stringify(bundle.version)}, expected ${BUNDLE_VERSION}`);
	if (typeof bundle.id === 'string' && bundle.id !== id) errors.push(`${id}: id is ${JSON.stringify(bundle.id)}`);
	if (typeof bundle.url === 'string' && !isLessonUrl(bundle.url, id))
		errors.push(`${id}: url is ${JSON.stringify(bundle.url)}, expected an absolute URL ending in /${id}/`);
	if (typeof bundle.mode === 'string' && !MODES.has(bundle.mode))
		errors.push(`${id}: mode is ${JSON.stringify(bundle.mode)}, expected tutorial or explanation`);
	if (typeof bundle.prose === 'string') {
		for (const block of fencedBlocks(src)) {
			if (!bundle.prose.includes(block)) {
				const first = block.split('\n')[0];
				errors.push(`${id}: the fenced block starting ${JSON.stringify(first)} is not in prose unchanged`);
			}
		}
	}
	return errors;
}

/**
 * Check the bundles under `bundlesDir` (site/dist/data/lessons) against the
 * lesson pages under `contentDir` and the data tree under `dataDir`. Returns
 * `{ errors: string[], bundles: number }`.
 */
export function checkBundles(bundlesDir, contentDir, dataDir) {
	if (!existsSync(bundlesDir)) return { errors: [`${bundlesDir} does not exist; run site-build first`], bundles: 0 };
	const errors = [];
	const areaIds = new Set(readAreaTree(dataDir).areas.map((a) => a.dir));
	const pages = lessonPages(contentDir, areaIds);
	const built = bundleIds(bundlesDir);
	for (const id of [...pages.keys()].sort()) {
		if (!built.has(id)) {
			errors.push(`${id}: lesson page without a bundle`);
			continue;
		}
		errors.push(
			...checkBundle(id, join(bundlesDir, `${id}.json`), readFileSync(join(contentDir, `${id}.mdx`), 'utf8')),
		);
	}
	for (const id of [...built].sort()) {
		if (!pages.has(id)) errors.push(`${id}: bundle without a lesson page`);
	}
	return { errors, bundles: built.size };
}
