#!/usr/bin/env bun
/**
 * Example runner (spec S03 "Examples"): every `<Predict run="..."
 * answer="...">` in a lesson names a fixture under site/examples/. This runs
 * each fixture and fails if its stdout is not the answer shown to the
 * learner, and fails on an entry script under site/examples/ that no
 * Predict runs and UNRUN_EXEMPT does not list (#460). The logic is in
 * scripts/lib/examples.mjs, which tests/scripts/examples.test.ts covers;
 * this file only reports.
 */
import { join } from 'node:path';
import { checkExamples, UNRUN_EXEMPT } from './lib/examples.mjs';

const root = new URL('..', import.meta.url).pathname;
const { found, checked, failures, interpreters } = checkExamples(
	join(root, 'src/content/docs'),
	join(root, 'examples'),
);

if (failures.length) {
	console.error(`examples: ${failures.length} failure(s) of ${checked} checked\n`);
	for (const f of failures) console.error(`${f}\n`);
	process.exit(1);
}
console.log(`examples: ${checked} example output(s) verified (${found} example(s) on ${interpreters.join(' and ')})`);
console.log(`examples: ${UNRUN_EXEMPT.size} fixture(s) no Predict runs, exempt in UNRUN_EXEMPT with a reason`);
