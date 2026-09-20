#!/usr/bin/env bun
/**
 * Example runner (spec S03 "Examples", S06 open question 2): every `<Predict
 * run="..." answer="...">` in a lesson names a fixture under docs/examples/.
 * This runs each fixture and fails if its stdout is not the answer shown to
 * the learner. `.sh` fixtures run with bash, `.py` with python3.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const contentDir = join(root, 'src/content/docs');
const examplesDir = join(root, 'examples');

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walk(p);
		else if (name.endsWith('.mdx')) yield p;
	}
}

const TAG = /<Predict\b([^>]*?)>/gs;
// Props are either `name="..."` or a template literal `name={`...`}` (used for multi-line answers).
const ATTR = (name, attrs) =>
	attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? attrs.match(new RegExp(`\\b${name}=\\{\`([^\`]*)\`\\}`))?.[1];

let checked = 0;
const failures = [];
for (const file of walk(contentDir)) {
	const src = readFileSync(file, 'utf8');
	for (const m of src.matchAll(TAG)) {
		const run = ATTR('run', m[1]);
		const answer = ATTR('answer', m[1]);
		const id = ATTR('id', m[1]) ?? '?';
		if (!run) continue;
		if (answer === undefined) {
			failures.push(`${file} #${id}: has run="${run}" but no answer`);
			continue;
		}
		const fixture = join(examplesDir, run);
		const ext = extname(fixture);
		const cmd = ext === '.sh' ? ['bash', fixture] : ext === '.py' ? ['python3', fixture] : null;
		if (!cmd) {
			failures.push(`${file} #${id}: unsupported fixture type ${ext}`);
			continue;
		}
		const res = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', env: { ...process.env, PYTHON_COLORS: '0', NO_COLOR: '1' } });
		checked++;
		const actual = (res.stdout ?? '').trimEnd();
		if (res.status !== 0) failures.push(`${file} #${id}: ${run} exited ${res.status}\n${res.stderr}`);
		else if (actual !== answer.trimEnd()) failures.push(`${file} #${id}: ${run}\n  expected: ${JSON.stringify(answer)}\n  actual:   ${JSON.stringify(actual)}`);
	}
}

if (failures.length) {
	console.error(`examples: ${failures.length} failure(s) of ${checked} checked\n`);
	for (const f of failures) console.error(f + '\n');
	process.exit(1);
}
console.log(`examples: ${checked} example output(s) verified`);
