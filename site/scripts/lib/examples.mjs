/**
 * The example runner's logic (spec S03 "Examples"): find every `<Predict
 * run="..." answer="...">` in the lesson sources, run the fixture it names
 * under site/examples/ (a Python script), and compare stdout with the answer the
 * learner sees.
 * `scripts/check-examples.mjs` is the command-line entry; tests import this.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

/** Every `.mdx` file under `dir`, recursively. */
export function* walkMdx(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walkMdx(p);
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
				if (c === '\\' && quote !== '"')
					i++; // JS-style escape in expressions
				else if (c === quote) quote = null;
				continue;
			}
			if (c === '"' || c === "'" || (braces > 0 && c === '`')) quote = c;
			else if (c === '{') braces++;
			else if (c === '}') braces = Math.max(0, braces - 1);
			else if (c === '>' && braces === 0) {
				end = i;
				break;
			}
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

/** Run one fixture. Every fixture is a Python script run with python3; any other file type is an error. */
export function runFixture(examplesDir, run) {
	const fixture = join(examplesDir, run);
	const ext = extname(fixture);
	if (ext !== '.py') return { error: `unsupported fixture type ${ext}; fixtures are Python scripts (S03 "Examples")` };
	const res = spawnSync('python3', [fixture], {
		encoding: 'utf8',
		env: { ...process.env, PYTHON_COLORS: '0', NO_COLOR: '1' },
	});
	return { status: res.status, stdout: (res.stdout ?? '').trimEnd(), stderr: res.stderr };
}

/**
 * Check the `<Predict>` tags of one lesson source. `run(name)` executes a
 * fixture (injectable for tests). Returns `{ found, checked, failures }`:
 * how many tags name a fixture, how many were run, and one message per
 * problem.
 */
export function checkSource(file, src, run) {
	let checked = 0;
	let found = 0;
	const failures = [];
	for (const { attrs, props } of findPredictTags(src)) {
		const name = props.get('run');
		const answer = props.get('answer');
		const id = props.get('id') ?? '?';
		if (!name) {
			// A tag that mentions `run` but did not parse into a run prop is a
			// parser gap, not an honor-system Predict; fail rather than skip.
			if (/\brun\b/.test(attrs)) failures.push(`${file} #${id}: tag mentions "run" but no run= prop parsed:\n${attrs}`);
			continue;
		}
		found++;
		if (answer === undefined) {
			failures.push(`${file} #${id}: has run="${name}" but no answer`);
			continue;
		}
		const res = run(name);
		if (res.error) {
			failures.push(`${file} #${id}: ${res.error}`);
			continue;
		}
		checked++;
		if (res.status !== 0) failures.push(`${file} #${id}: ${name} exited ${res.status}\n${res.stderr}`);
		else if (res.stdout !== answer.trimEnd())
			failures.push(
				`${file} #${id}: ${name}\n  expected: ${JSON.stringify(answer)}\n  actual:   ${JSON.stringify(res.stdout)}`,
			);
	}
	return { found, checked, failures };
}

/**
 * Check every lesson under `contentDir` against the fixtures in
 * `examplesDir`. Zero examples is a failure too: it means the lesson tree or
 * the parser is broken, not that there is nothing to check.
 */
export function checkExamples(contentDir, examplesDir, run = (name) => runFixture(examplesDir, name)) {
	let checked = 0;
	let found = 0;
	const failures = [];
	for (const file of walkMdx(contentDir)) {
		const result = checkSource(file, readFileSync(file, 'utf8'), run);
		found += result.found;
		checked += result.checked;
		failures.push(...result.failures);
	}
	if (found === 0)
		failures.push(`no <Predict run=...> examples found under ${contentDir}; the lesson tree or parser is broken`);
	return { found, checked, failures };
}
