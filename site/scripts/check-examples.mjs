#!/usr/bin/env bun
/**
 * Example runner (spec S03 "Examples"): every `<Predict run="..."
 * answer="...">` in a lesson names a fixture under site/examples/. This runs
 * each fixture and fails if its stdout is not the answer shown to the
 * learner. The logic is in scripts/lib/examples.mjs, which
 * tests/scripts/examples.test.ts covers; this file only reports.
 */
import { join } from 'node:path';
import { checkExamples } from './lib/examples.mjs';

const root = new URL('..', import.meta.url).pathname;
const { checked, failures } = checkExamples(join(root, 'src/content/docs'), join(root, 'examples'));

if (failures.length) {
	console.error(`examples: ${failures.length} failure(s) of ${checked} checked\n`);
	for (const f of failures) console.error(`${f}\n`);
	process.exit(1);
}
console.log(`examples: ${checked} example output(s) verified`);
