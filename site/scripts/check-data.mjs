#!/usr/bin/env bun
/**
 * Data tree check (`mise run data`): the YAML under site/src/data must agree
 * with itself and with the lesson pages (specs S09, S10, S11). The logic and
 * the list of what it rejects are in scripts/lib/data.mjs, which
 * tests/scripts/data.test.ts covers; this file only reports.
 */
import { join } from 'node:path';
import { checkData } from './lib/data.mjs';

const root = new URL('..', import.meta.url).pathname;
const { errors, warnings, lessons, pages } = checkData(join(root, 'src/data'), join(root, 'src/content/docs'));

for (const w of warnings) console.warn(`data: warning: ${w}`);
if (errors.length) {
	for (const e of errors) console.error(`data: ${e}`);
	console.error(`data: ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
	process.exit(1);
}
console.log(
	`data: ${lessons} lesson plan${lessons === 1 ? '' : 's'}, ${pages} lesson page${pages === 1 ? '' : 's'}, all consistent${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}`,
);
