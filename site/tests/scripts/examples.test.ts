import { type spawnSync, spawnSync as spawnSyncReal } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
	checkExamples,
	checkSource,
	FIXTURE_TIMEOUT_MS,
	FLOOR,
	interpreters,
	predictTags,
	pythonVersion,
	runFixture,
	UNRUN_EXEMPT,
	unrunFixtures,
	usesModule,
	walkMdx,
} from '../../scripts/lib/examples.mjs';
import { type CheckpointAttr, propValue } from '../../src/lib/checkpoint-tags';

/**
 * A stand-in for `spawnSync` that answers `python3` and `python3.9` with the
 * given versions. The lib reads only `error`, `status`, `stdout` and `stderr`,
 * so the cast covers the fields of `SpawnSyncReturns` it never touches.
 */
function fakeSpawn(versions: Record<string, string | { error?: string; status?: number; stderr?: string }>) {
	const fake = (cmd: string) => {
		const v = versions[cmd];
		if (v === undefined) return { error: new Error(`spawnSync ${cmd} ENOENT`), status: null, stdout: '', stderr: '' };
		if (typeof v === 'string') return { status: 0, stdout: `${v}\n`, stderr: '' };
		if (v.error) return { error: new Error(v.error), status: null, stdout: '', stderr: '' };
		return { status: v.status ?? 1, stdout: '', stderr: v.stderr ?? '' };
	};
	return fake as unknown as typeof spawnSync;
}

describe('predictTags', () => {
	const cases: [string, string, Record<string, string | undefined>][] = [
		['plain', '<Predict id="a" answer="x" run="r.py" />', { id: 'a', answer: 'x', run: 'r.py' }],
		['gt in attr', '<Predict id="a" answer="a > b" run="r.py" />', { answer: 'a > b', run: 'r.py' }],
		[
			'template literal',
			'<Predict id="a"\n  answer={`1. > x\n2. y`} run="r.py" />',
			{ answer: '1. > x\n2. y', run: 'r.py' },
		],
		['with a body', '<Predict id="a" answer="1>2" run="r.py">\n  body\n</Predict>', { answer: '1>2', run: 'r.py' }],
		['no run', '<Predict id="a" answer="x" />', { id: 'a', answer: 'x', run: undefined }],
		['single quotes', "<Predict id='a' answer='x' />", { id: 'a', answer: 'x' }],
	];
	it.each(cases)('%s', (_label, src, want) => {
		const tags = predictTags(src, 'f.mdx');
		expect(tags).toHaveLength(1);
		for (const [k, v] of Object.entries(want))
			expect(propValue(tags[0]?.attrs as Map<string, CheckpointAttr>, k)).toBe(v);
	});
	it('reads the answer as the page shows it: the compiler strips up to two spaces from a continuation line (#286)', () => {
		const tags = predictTags('<Predict id="a"\n  answer={`x\n   y\n  z`} run="r.py" />', 'f.mdx');
		expect(propValue(tags[0]?.attrs as Map<string, CheckpointAttr>, 'answer')).toBe('x\n y\nz');
	});
	it('finds several tags in source order with their lines, and skips other components', () => {
		const many = predictTags(
			'<Predict id="a" answer="1>2"> body </Predict>\n<Choice id="c" answer="q" />\n<Predict id="b" run="x.py" />',
			'f.mdx',
		);
		expect(many).toHaveLength(2);
		expect(propValue(many[1]?.attrs as Map<string, CheckpointAttr>, 'run')).toBe('x.py');
		expect(many.map((t) => t.line)).toEqual([1, 3]);
	});
	it('skips a Predict quoted in a comment, a fence or a code span, which the page shows and does not run', () => {
		const src = [
			'{/* <Predict id="c" answer="x" run="in-comment.py" /> */}',
			'',
			'```mdx',
			'<Predict id="f" answer="x" run="in-fence.py" />',
			'```',
			'',
			'Write `<Predict id="s" answer="x" run="in-span.py" />` in the page.',
			'',
			'<Predict id="real" answer="hello" run="x.py" />',
		].join('\n');
		expect(predictTags(src, 'f.mdx').map((t) => propValue(t.attrs, 'run'))).toEqual(['x.py']);
		const res = checkSource('f.mdx', src, () => ({ status: 0, stdout: 'hello', stderr: '' }));
		expect(res).toEqual({ found: 1, checked: 1, failures: [], runs: ['x.py'] });
	});
	it('throws on a page that does not parse, naming the file', () => {
		expect(() => predictTags('<Predict id="a" answer={`open', 'f.mdx')).toThrow(/^f\.mdx: /);
	});
	it('throws on a run prop that is not a literal, and on a non-string answer', () => {
		expect(() => predictTags('<Predict id="a" answer="x" run={runName} />', 'f.mdx')).toThrow(/is not a literal/);
		expect(() => predictTags('<Predict id="a" answer={1} run="x.py" />', 'f.mdx')).toThrow(
			'f.mdx #a: answer must be a string, got number',
		);
	});
});

describe('checkSource', () => {
	const ok = () => ({ status: 0, stdout: 'hello', stderr: '' });
	it('counts a matching example', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.py" />', ok);
		expect(res).toEqual({ found: 1, checked: 1, failures: [], runs: ['x.py'] });
	});
	it('accepts trailing whitespace in the answer', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello\n" run="x.py" />', ok);
		expect(res.failures).toEqual([]);
	});
	it('reports a mismatch with both outputs', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="bye" run="x.py" />', ok);
		expect(res.checked).toBe(1);
		expect(res.failures[0]).toContain('expected: "bye"');
		expect(res.failures[0]).toContain('actual:   "hello"');
	});
	it('reports a non-zero exit with stderr', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.py" />', () => ({
			status: 2,
			stdout: '',
			stderr: 'boom',
		}));
		expect(res.failures[0]).toMatch(/exited 2\nboom/);
	});
	it('reports a run that could not start or timed out, with the interpreter label', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.py" />', () => ({
			error: 'cannot run x.py with python3: did not finish within 30s',
		}));
		expect(res).toMatchObject({ found: 1, checked: 1 });
		expect(res.failures).toEqual(['f.mdx #a: [python3] cannot run x.py with python3: did not finish within 30s']);
	});
	it('reports a run without an answer, an unsupported fixture, and a run the parser missed', () => {
		expect(checkSource('f.mdx', '<Predict id="a" run="x.py" />', ok).failures[0]).toContain('no answer');
		const unsupported = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.rb" />', () => ({
			error: 'unsupported fixture type .rb',
		}));
		expect(unsupported.failures[0]).toContain('unsupported fixture type .rb');
		expect(unsupported.checked).toBe(0);
		const missed = checkSource('f.mdx', '<Predict id="a" answer="x" run={runName} />', ok);
		expect(missed).toMatchObject({ found: 0, checked: 0 });
		expect(missed.failures[0]).toMatch(/^f\.mdx: cannot read run=\{\.\.\.\} of <Predict>: Identifier is not a literal/);
	});
	it('checks an ungraded example (no objective) like any other run', () => {
		const res = checkSource('f.mdx', '<Predict id="e" title="T" answer="hello" run="x.py" />', ok);
		expect(res).toEqual({ found: 1, checked: 1, failures: [], runs: ['x.py'] });
	});
	it('fails a tag with run="" instead of skipping it', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="x" run="" />', ok);
		expect(res.found).toBe(1);
		expect(res.failures[0]).toContain('unsupported fixture type');
	});
	it('ignores an honor-system predict', () => {
		expect(checkSource('f.mdx', '<Predict id="a" title="t" />', ok)).toEqual({
			found: 0,
			checked: 0,
			failures: [],
			runs: [],
		});
	});
	it('runs every interpreter, labels a failure with the one that produced it, and checks the file type once', () => {
		const interps = [
			{ label: 'python 3.14.7', cmd: 'python3' },
			{ label: 'python 3.9.25', cmd: 'python3.9' },
		];
		const seen: string[] = [];
		const byInterp = (_name: string, interp: { cmd: string }) => {
			seen.push(interp.cmd);
			return interp.cmd === 'python3.9' ? { status: 1, stdout: '', stderr: 'TypeError' } : ok();
		};
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.py" />', byInterp, interps);
		expect(seen).toEqual(['python3', 'python3.9']);
		expect(res.checked).toBe(2);
		expect(res.failures).toHaveLength(1);
		expect(res.failures[0]).toMatch(/x\.py \[python 3\.9\.25\] exited 1\nTypeError/);
		const bad = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.sh" />', byInterp, interps);
		expect(bad.failures).toEqual([
			'f.mdx #a: unsupported fixture type .sh; fixtures are Python scripts (S03 "Examples")',
		]);
		expect(seen).toHaveLength(2);
	});
});

describe('pythonVersion and interpreters', () => {
	it('reads the version from the interpreter', () => {
		expect(pythonVersion('python3', fakeSpawn({ python3: '3.14.7' }))).toEqual({ version: '3.14.7' });
	});
	it('reports a spawn error, a non-zero exit with stderr, and a silent non-zero exit', () => {
		expect(pythonVersion('nope', fakeSpawn({}))).toEqual({ error: 'spawnSync nope ENOENT' });
		expect(pythonVersion('x', fakeSpawn({ x: { status: 2, stderr: 'bad\n' } }))).toEqual({ error: 'bad' });
		expect(pythonVersion('x', fakeSpawn({ x: { status: 2 } }))).toEqual({ error: 'exited 2' });
	});
	it('lists the current pin and the floor with their versions', () => {
		expect(interpreters(fakeSpawn({ python3: '3.14.7', 'python3.9': '3.9.25' }))).toEqual({
			list: [
				{ label: 'python 3.14.7', cmd: 'python3' },
				{ label: 'python 3.9.25', cmd: `python${FLOOR}` },
			],
		});
	});
	it('fails when the floor is missing, is the wrong version, or when python3 is itself the floor', () => {
		expect(interpreters(fakeSpawn({ python3: '3.14.7' })).error).toMatch(/cannot run python3\.9 .*mise install/);
		expect(interpreters(fakeSpawn({ python3: '3.14.7', 'python3.9': '3.10.1' })).error).toBe(
			'python3.9 is Python 3.10.1, expected 3.9.x',
		);
		expect(interpreters(fakeSpawn({ python3: '3.9.6', 'python3.9': '3.9.25' })).error).toMatch(
			/python3 is Python 3\.9\.6, the floor/,
		);
	});
	it('finds both pinned interpreters on this machine', () => {
		const res = interpreters();
		expect(res.error).toBeUndefined();
		expect(res.list?.map((i) => i.cmd)).toEqual(['python3', 'python3.9']);
		expect(res.list?.[1]?.label).toMatch(/^python 3\.9\.\d+$/);
	});
});

describe('runFixture and checkExamples', () => {
	const dir = mkdtempSync(join(tmpdir(), 'examples-'));
	const content = join(dir, 'content');
	const examples = join(dir, 'examples');
	mkdirSync(join(content, 'area'), { recursive: true });
	mkdirSync(examples);
	writeFileSync(join(examples, 'hi.py'), 'print("hi")\n');
	writeFileSync(join(examples, 'bye.py'), 'print("bye")\n');
	writeFileSync(join(examples, 'fail.py'), 'import sys\nprint("nope", file=sys.stderr)\nsys.exit(3)\n');
	writeFileSync(join(examples, 'hi.sh'), 'echo hi\n');
	writeFileSync(
		join(content, 'area', 'ok.mdx'),
		'<Predict id="a" answer="hi" run="hi.py" />\n<Predict id="b" answer="bye" run="bye.py" />\n',
	);
	writeFileSync(join(content, 'skip.md'), '<Predict id="z" answer="hi" run="hi.py" />');
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it('walks only .mdx files', () => {
		expect([...walkMdx(content)]).toEqual([join(content, 'area', 'ok.mdx')]);
	});
	it('runs Python fixtures and rejects every other file type, shell scripts included', () => {
		expect(runFixture(examples, 'hi.py')).toMatchObject({ status: 0, stdout: 'hi' });
		expect(runFixture(examples, 'fail.py')).toMatchObject({ status: 3, stderr: 'nope\n' });
		expect(runFixture(examples, 'hi.sh')).toEqual({
			error: 'unsupported fixture type .sh; fixtures are Python scripts (S03 "Examples")',
		});
		expect(runFixture(examples, 'x.rb').error).toContain('unsupported fixture type .rb');
	});
	it('fails a fixture whose interpreter cannot start, naming the interpreter', () => {
		const res = runFixture(examples, 'hi.py', { label: 'missing', cmd: 'python-nope' }, fakeSpawn({}));
		expect(res).toEqual({ error: 'cannot run hi.py with python-nope: spawnSync python-nope ENOENT' });
	});
	it('passes the timeout to spawnSync and fails a hung fixture with a clear message', () => {
		const seen: { timeout?: number }[] = [];
		const hung = ((_cmd: string, _args: string[], opts: { timeout?: number }) => {
			seen.push(opts);
			return { error: Object.assign(new Error('spawnSync python3 ETIMEDOUT'), { code: 'ETIMEDOUT' }), status: null };
		}) as unknown as typeof spawnSync;
		const res = runFixture(examples, 'hi.py', { label: 'python3', cmd: 'python3' }, hung);
		expect(seen[0]?.timeout).toBe(FIXTURE_TIMEOUT_MS);
		expect(res).toEqual({
			error: `cannot run hi.py with python3: did not finish within ${FIXTURE_TIMEOUT_MS / 1000}s`,
		});
	});
	it('really stops a fixture that never exits', () => {
		writeFileSync(join(examples, 'hang.py'), 'import time\nwhile True:\n    time.sleep(1)\n');
		const spawnShort = ((cmd: string, args: string[], opts: object) =>
			spawnSyncReal(cmd, args, { ...opts, timeout: 200 })) as unknown as typeof spawnSync;
		const res = runFixture(examples, 'hang.py', undefined, spawnShort);
		expect(res.error).toMatch(/cannot run hang\.py with python3: did not finish within/);
	});
	it('runs a fixture with the interpreter it is given', () => {
		writeFileSync(join(examples, 'version.py'), 'import sys\nprint(sys.version_info[0], sys.version_info[1])\n');
		const floor = FLOOR.split('.').join(' ');
		expect(runFixture(examples, 'version.py', { label: 'floor', cmd: `python${FLOOR}` })).toMatchObject({
			status: 0,
			stdout: floor,
		});
	});
	it('checks a content tree against its fixtures on both interpreters', () => {
		const res = checkExamples(content, examples, undefined, undefined, new Map());
		expect(res).toMatchObject({ found: 2, checked: 4, failures: [] });
		expect(res.interpreters).toHaveLength(2);
		expect(res.interpreters[1]).toMatch(/^python 3\.9\./);
	});
	it('fails without running anything when an interpreter is missing', () => {
		const res = checkExamples(content, examples, undefined, { error: 'no floor' });
		expect(res).toEqual({ found: 0, checked: 0, failures: ['no floor'], interpreters: [] });
	});
	it('fails when no example exists at all', () => {
		const empty = join(dir, 'empty');
		mkdirSync(empty);
		const res = checkExamples(empty, examples);
		expect(res.failures[0]).toContain('no <Predict run=...> examples found');
	});
});

describe('usesModule', () => {
	const uses: [string, string][] = [
		['import agent\n', 'plain import'],
		['import agent  # noqa: E402\n', 'import with a comment'],
		['import os, agent\n', 'second name in an import list'],
		['import agent as a\n', 'import as'],
		['    from agent import run\n', 'indented from-import'],
		['subprocess.run([sys.executable, "-m", "pytest", "test_agent.py"])\n', 'file name'],
	];
	it.each(uses)('%j counts as a use (%s)', (src) => {
		const stem = src.includes('test_agent') ? 'test_agent' : 'agent';
		expect(usesModule(src, stem)).toBe(true);
	});
	const misses: [string, string][] = [
		['import agents\n', 'a longer module name'],
		['import agent.tools\n', 'a submodule of a package with the same name'],
		['from agent_loop import run\n', 'a module whose name starts with the stem'],
		['# the agent loop runs here\n', 'the word in a comment'],
		['print("my_agent.py")\n', 'a file name that ends with the stem'],
		['x = 1  # import agent\n', 'an import in a trailing comment'],
	];
	it.each(misses)('%j is not a use (%s)', (src) => {
		expect(usesModule(src, 'agent')).toBe(false);
	});
});

describe('unrunFixtures', () => {
	const dir = mkdtempSync(join(tmpdir(), 'unrun-'));
	const lesson = join(dir, 'area', 'lesson');
	mkdirSync(join(lesson, 'fixture-repo'), { recursive: true });
	mkdirSync(join(lesson, '__pycache__'));
	writeFileSync(join(lesson, 'run_me.py'), 'import agent\nagent.main()\n');
	writeFileSync(join(lesson, 'agent.py'), 'def main():\n    print("hi")\n');
	writeFileSync(join(lesson, '_common.py'), 'X = 1\n');
	writeFileSync(join(lesson, 'tests.py'), 'import subprocess\nsubprocess.run(["python3", "test_x.py"])\n');
	writeFileSync(join(lesson, 'test_x.py'), 'print("ok")\n');
	writeFileSync(join(lesson, 'notes.txt'), 'data\n');
	writeFileSync(join(lesson, 'fixture-repo', 'todo.py'), 'print("todo")\n');
	writeFileSync(join(dir, 'ruff.toml'), '');
	afterAll(() => rmSync(dir, { recursive: true, force: true }));
	const runs = new Set(['area/lesson/run_me.py', 'area/lesson/tests.py']);

	it('passes when every entry script is run, skipping helpers, used modules, data and deeper files', () => {
		expect(unrunFixtures(dir, runs, new Map())).toEqual([]);
	});
	it('fails on an entry script that no Predict runs, naming it and the way out', () => {
		writeFileSync(join(lesson, 'exercise.py'), 'print("prose only")\n');
		try {
			const failures = unrunFixtures(dir, runs, new Map());
			expect(failures).toHaveLength(1);
			expect(failures[0]).toMatch(/^examples\/area\/lesson\/exercise\.py: no <Predict run=\.\.\.> runs this fixture/);
			expect(failures[0]).toContain('UNRUN_EXEMPT');
			expect(unrunFixtures(dir, runs, new Map([['area/lesson/exercise.py', 'described in prose']]))).toEqual([]);
		} finally {
			rmSync(join(lesson, 'exercise.py'));
		}
	});
	it('fails on a module whose only user is gone', () => {
		expect(unrunFixtures(dir, new Set(['area/lesson/tests.py']), new Map())).toEqual([
			expect.stringMatching(/^examples\/area\/lesson\/run_me\.py: /),
		]);
	});
	it('fails on a stale or empty exemption', () => {
		const exempt = new Map([
			['area/lesson/run_me.py', 'run now'],
			['area/lesson/agent.py', 'a used module'],
			['area/lesson/fixture-repo/todo.py', 'too deep'],
			['area/lesson/gone.py', 'deleted'],
			['area/lesson/exercise.py', ''],
		]);
		writeFileSync(join(lesson, 'exercise.py'), 'print("prose only")\n');
		try {
			expect(unrunFixtures(dir, runs, exempt)).toEqual([
				'UNRUN_EXEMPT area/lesson/run_me.py: a <Predict run=...> runs it now; drop the entry',
				'UNRUN_EXEMPT area/lesson/agent.py: is a helper another fixture uses, not an entry script; drop the entry',
				'UNRUN_EXEMPT area/lesson/fixture-repo/todo.py: names no entry script; drop the entry',
				'UNRUN_EXEMPT area/lesson/gone.py: names no entry script; drop the entry',
				'UNRUN_EXEMPT area/lesson/exercise.py: has no reason',
			]);
		} finally {
			rmSync(join(lesson, 'exercise.py'));
		}
	});
	it('is part of checkExamples once examples are found', () => {
		const content = join(dir, 'content');
		mkdirSync(content);
		writeFileSync(join(content, 'p.mdx'), '<Predict id="a" answer="hi" run="area/lesson/run_me.py" />\n');
		const run = () => ({ status: 0, stdout: 'hi', stderr: '' });
		const interps = { list: [{ label: 'python3', cmd: 'python3' }] };
		const res = checkExamples(content, dir, run, interps, new Map());
		expect(res.failures).toEqual([expect.stringMatching(/^examples\/area\/lesson\/tests\.py: /)]);
		expect(checkExamples(content, dir, run, interps, new Map([['area/lesson/tests.py', 'r']])).failures).toEqual([]);
	});
	it('gives every real exemption a reason', () => {
		for (const [path, reason] of UNRUN_EXEMPT) {
			expect(path).toMatch(/^[^/]+\/[^/]+\/[^/_][^/]*\.py$/);
			expect(reason.length).toBeGreaterThan(20);
		}
	});
});
