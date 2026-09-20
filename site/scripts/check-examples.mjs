#!/usr/bin/env bun
/**
 * Example runner (spec S03 "Examples", S06 open question 2): every `<Predict
 * run="..." answer="...">` in a lesson names a fixture under site/examples/.
 * This runs each fixture and fails if its stdout is not the answer shown to
 * the learner. `.sh` fixtures run with bash, `.py` with python3.
 *
 * `bun scripts/check-examples.mjs --self-test` runs the tag parser against a
 * few hand-written cases instead of the lesson tree.
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

/**
 * Find every `<Predict ...>` opening tag in `src` and parse its props.
 * Returns `{ attrs: string, props: Map<string,string>, index: number }[]`.
 *
 * A regex like `/<Predict\b([^>]*?)>/` stops at the first `>` even when it
 * sits inside `answer="a > b"`, which drops the props after it (`run=`) and
 * silently skips the example. So the tag end is found by walking characters
 * and tracking whether we are inside `"..."`, a `{...}` expression, or a
 * backtick template literal inside that expression.
 */
export function findPredictTags(src) {
	const out = [];
	const OPEN = /<Predict\b/g;
	for (const m of src.matchAll(OPEN)) {
		let i = m.index + m[0].length;
		let quote = null; // '"' | "'" | '`' when inside a string
		let braces = 0;
		let end = -1;
		for (; i < src.length; i++) {
			const c = src[i];
			if (quote) {
				if (c === '\\' && quote !== '"') i++; // JS-style escape in expressions
				else if (c === quote) quote = null;
				continue;
			}
			if (c === '"' || c === "'" || (braces > 0 && c === '`')) quote = c;
			else if (c === '{') braces++;
			else if (c === '}') braces = Math.max(0, braces - 1);
			else if (c === '>' && braces === 0) { end = i; break; }
		}
		if (end === -1) throw new Error(`unterminated <Predict tag at offset ${m.index}`);
		const attrs = src.slice(m.index + m[0].length, end).replace(/\/\s*$/, '');
		out.push({ attrs, props: parseProps(attrs), index: m.index });
	}
	return out;
}

/** Parse `name="..."`, `name='...'` and `name={`...`}` props. */
export function parseProps(attrs) {
	const props = new Map();
	const RE = /([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`((?:[^`\\]|\\.)*)`\})/g;
	for (const m of attrs.matchAll(RE)) props.set(m[1], m[2] ?? m[3] ?? m[4]);
	return props;
}

function runFixture(run) {
	const fixture = join(examplesDir, run);
	const ext = extname(fixture);
	const cmd = ext === '.sh' ? ['bash', fixture] : ext === '.py' ? ['python3', fixture] : null;
	if (!cmd) return { error: `unsupported fixture type ${ext}` };
	const res = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', env: { ...process.env, PYTHON_COLORS: '0', NO_COLOR: '1' } });
	return { status: res.status, stdout: (res.stdout ?? '').trimEnd(), stderr: res.stderr };
}

function selfTest() {
	const cases = [
		['plain', '<Predict id="a" answer="x" run="r.sh">', { id: 'a', answer: 'x', run: 'r.sh' }],
		['gt in attr', '<Predict id="a" answer="a > b" run="r.sh">', { answer: 'a > b', run: 'r.sh' }],
		['template literal', '<Predict id="a"\n  answer={`1. > x\n2. y`} run="r.sh">', { answer: '1. > x\n2. y', run: 'r.sh' }],
		['brace with gt', '<Predict id="a" answer={`${1 > 0}`} run="r.sh">', { run: 'r.sh' }],
		['self-closing', '<Predict id="a" run="r.sh" />', { id: 'a', run: 'r.sh' }],
		['no run', '<Predict id="a" answer="x">', { id: 'a', answer: 'x', run: undefined }],
	];
	let bad = 0;
	for (const [label, src, want] of cases) {
		const tags = findPredictTags(src);
		if (tags.length !== 1) { bad++; console.error(`self-test ${label}: found ${tags.length} tags`); continue; }
		for (const [k, v] of Object.entries(want)) {
			const got = tags[0].props.get(k);
			if (got !== v) { bad++; console.error(`self-test ${label}: ${k}=${JSON.stringify(got)}, want ${JSON.stringify(v)}`); }
		}
	}
	const many = findPredictTags('<Predict id="a" answer="1>2"> body </Predict>\n<Predict id="b" run="x.sh">');
	if (many.length !== 2 || many[1].props.get('run') !== 'x.sh') { bad++; console.error('self-test multi: wrong tags', many.map(t => [...t.props])); }
	if (bad) { console.error(`self-test: ${bad} failure(s)`); process.exit(1); }
	console.log('self-test: ok');
}

if (process.argv.includes('--self-test')) {
	selfTest();
} else {
	let checked = 0;
	let found = 0;
	const failures = [];
	for (const file of walk(contentDir)) {
		const src = readFileSync(file, 'utf8');
		for (const { attrs, props } of findPredictTags(src)) {
			const run = props.get('run');
			const answer = props.get('answer');
			const id = props.get('id') ?? '?';
			if (!run) {
				// A tag that mentions `run` but did not parse into a run prop is a
				// parser gap, not an honor-system Predict; fail rather than skip.
				if (/\brun\b/.test(attrs)) failures.push(`${file} #${id}: tag mentions "run" but no run= prop parsed:\n${attrs}`);
				continue;
			}
			found++;
			if (answer === undefined) {
				failures.push(`${file} #${id}: has run="${run}" but no answer`);
				continue;
			}
			const res = runFixture(run);
			if (res.error) { failures.push(`${file} #${id}: ${res.error}`); continue; }
			checked++;
			if (res.status !== 0) failures.push(`${file} #${id}: ${run} exited ${res.status}\n${res.stderr}`);
			else if (res.stdout !== answer.trimEnd()) failures.push(`${file} #${id}: ${run}\n  expected: ${JSON.stringify(answer)}\n  actual:   ${JSON.stringify(res.stdout)}`);
		}
	}
	if (found === 0) failures.push(`no <Predict run=...> examples found under ${contentDir}; the lesson tree or parser is broken`);
	if (failures.length) {
		console.error(`examples: ${failures.length} failure(s) of ${checked} checked\n`);
		for (const f of failures) console.error(f + '\n');
		process.exit(1);
	}
	console.log(`examples: ${checked} example output(s) verified`);
}
