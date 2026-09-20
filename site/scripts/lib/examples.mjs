/**
 * The example runner's logic (spec S03 "Examples"): find every `<Predict
 * run="..." answer="...">` in the lesson sources, run the fixture it names
 * under site/examples/ (a Python script), and compare stdout with the answer the
 * learner sees.
 *
 * Every fixture runs on two interpreters, `python3` (the current pin in
 * .mise.toml) and `python3.9` (the floor pin), and both must print the
 * answer. The floor exists because the fixture is what a learner runs on
 * their own machine, and a stock Mac's `python3` is 3.9 (spec S03
 * "Examples"). Each interpreter is asked for its version first, so a missing
 * pin or a wrong `python3` on PATH fails loudly instead of testing one
 * interpreter twice.
 *
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

/** The Python floor for fixtures, as `major.minor` (spec S03 "Examples"). */
export const FLOOR = '3.9';

const fixtureEnv = { ...process.env, PYTHON_COLORS: '0', NO_COLOR: '1' };

/** The error for a fixture name that is not a Python script, or `null`. */
export function fixtureTypeError(run) {
	const ext = extname(run);
	if (ext === '.py') return null;
	return `unsupported fixture type ${ext}; fixtures are Python scripts (S03 "Examples")`;
}

/**
 * `major.minor.micro` of the interpreter `cmd`, or `{ error }` if it can't
 * run. `spawn` is injectable for tests.
 */
export function pythonVersion(cmd, spawn = spawnSync) {
	const res = spawn(cmd, ['-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], {
		encoding: 'utf8',
		env: fixtureEnv,
	});
	if (res.error) return { error: res.error.message };
	if (res.status !== 0) return { error: (res.stderr ?? '').trim() || `exited ${res.status}` };
	return { version: (res.stdout ?? '').trim() };
}

/**
 * The interpreters every fixture must pass on, as `{ label, cmd }`: the
 * current pin (`python3`) and the floor (`python3.9`), both installed by
 * `mise install` from .mise.toml [tools]. Returns `{ list }` or `{ error }`.
 * A missing or wrong one is an error, not a skip: a run that quietly tested
 * one interpreter twice would look like a pass.
 */
export function interpreters(spawn = spawnSync) {
	const list = [];
	for (const [cmd, want] of [
		['python3', null],
		[`python${FLOOR}`, FLOOR],
	]) {
		const got = pythonVersion(cmd, spawn);
		if (got.error)
			return {
				error: `cannot run ${cmd} (${got.error}); both Python pins in .mise.toml must be installed (mise install)`,
			};
		const minor = got.version.split('.').slice(0, 2).join('.');
		if (want && minor !== want) return { error: `${cmd} is Python ${got.version}, expected ${want}.x` };
		if (!want && minor === FLOOR)
			return {
				error: `python3 is Python ${got.version}, the floor; the current pin from .mise.toml must be first on PATH (run through mise)`,
			};
		list.push({ label: `python ${got.version}`, cmd });
	}
	return { list };
}

/**
 * Run one fixture with `interp` (`{ label, cmd }`, default `python3`). Every
 * fixture is a Python script; any other file type is an error.
 */
export function runFixture(examplesDir, run, interp = { label: 'python3', cmd: 'python3' }) {
	const typeError = fixtureTypeError(run);
	if (typeError) return { error: typeError };
	const res = spawnSync(interp.cmd, [join(examplesDir, run)], { encoding: 'utf8', env: fixtureEnv });
	return { status: res.status, stdout: (res.stdout ?? '').trimEnd(), stderr: res.stderr };
}

const DEFAULT_INTERPRETERS = [{ label: 'python3', cmd: 'python3' }];

/**
 * Check the `<Predict>` tags of one lesson source. `run(name, interp)`
 * executes a fixture (injectable for tests), once per entry in `interps`.
 * Returns `{ found, checked, failures }`: how many tags name a fixture, how
 * many runs happened, and one message per problem.
 */
export function checkSource(file, src, run, interps = DEFAULT_INTERPRETERS) {
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
		// Interpreter-independent, so checked once here rather than once per
		// run; `runFixture` repeats it only for callers that skip checkSource.
		const typeError = fixtureTypeError(name);
		if (typeError) {
			failures.push(`${file} #${id}: ${typeError}`);
			continue;
		}
		for (const interp of interps) {
			const res = run(name, interp);
			checked++;
			if (res.status !== 0)
				failures.push(`${file} #${id}: ${name} [${interp.label}] exited ${res.status}\n${res.stderr}`);
			else if (res.stdout !== answer.trimEnd())
				failures.push(
					`${file} #${id}: ${name} [${interp.label}]\n  expected: ${JSON.stringify(answer)}\n  actual:   ${JSON.stringify(res.stdout)}`,
				);
		}
	}
	return { found, checked, failures };
}

/**
 * Check every lesson under `contentDir` against the fixtures in
 * `examplesDir`, on every interpreter from `interpreters()` (or the
 * `interps` given). Returns `{ found, checked, failures, interpreters }`,
 * the last being the labels the fixtures ran on. Zero examples is a failure
 * too: it means the lesson tree or the parser is broken, not that there is
 * nothing to check. So is a missing interpreter.
 */
export function checkExamples(
	contentDir,
	examplesDir,
	run = (name, interp) => runFixture(examplesDir, name, interp),
	interps = interpreters(),
) {
	if (interps.error) return { found: 0, checked: 0, failures: [interps.error], interpreters: [] };
	let checked = 0;
	let found = 0;
	const failures = [];
	for (const file of walkMdx(contentDir)) {
		const result = checkSource(file, readFileSync(file, 'utf8'), run, interps.list);
		found += result.found;
		checked += result.checked;
		failures.push(...result.failures);
	}
	if (found === 0)
		failures.push(`no <Predict run=...> examples found under ${contentDir}; the lesson tree or parser is broken`);
	return { found, checked, failures, interpreters: interps.list.map((i) => i.label) };
}
