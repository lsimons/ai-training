#!/usr/bin/env bun
/**
 * Lesson bundle check (`mise run bundles`, after `site-build`): the built
 * dist/data/lessons/<area>/<lesson>.json files must be one per lesson page,
 * carry every field spec S08 "Format" names, and hold every fenced code block
 * of their page unchanged. The logic and the list of what it rejects are in
 * scripts/lib/bundles.mjs, which tests/scripts/bundles-export.test.ts covers;
 * this file only reports.
 */
import { join } from 'node:path';
import { checkBundles } from './lib/bundles.mjs';

const root = new URL('..', import.meta.url).pathname;
const { errors, bundles } = checkBundles(
	join(root, 'dist/data/lessons'),
	join(root, 'src/content/docs'),
	join(root, 'src/data'),
);

if (errors.length) {
	for (const e of errors) console.error(`bundles: ${e}`);
	console.error(`bundles: ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
	process.exit(1);
}
console.log(`bundles: ${bundles} bundle${bundles === 1 ? '' : 's'} under dist/data/lessons, one per lesson page`);
