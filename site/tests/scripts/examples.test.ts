import type { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
	checkExamples,
	checkSource,
	FLOOR,
	findPredictTags,
	interpreters,
	parseProps,
	pythonVersion,
	runFixture,
	walkMdx,
} from '../../scripts/lib/examples.mjs';

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

describe('findPredictTags', () => {
	const cases: [string, string, Record<string, string | undefined>][] = [
		['plain', '<Predict id="a" answer="x" run="r.py">', { id: 'a', answer: 'x', run: 'r.py' }],
		['gt in attr', '<Predict id="a" answer="a > b" run="r.py">', { answer: 'a > b', run: 'r.py' }],
		[
			'template literal',
			'<Predict id="a"\n  answer={`1. > x\n2. y`} run="r.py">',
			{ answer: '1. > x\n2. y', run: 'r.py' },
		],
		// The `${...}` here is parser input, not a placeholder this test wants filled in.
		['brace with gt', '<Predict id="a" answer={`$' + '{1 > 0}`} run="r.py">', { run: 'r.py' }],
		['self-closing', '<Predict id="a" run="r.py" />', { id: 'a', run: 'r.py' }],
		['no run', '<Predict id="a" answer="x">', { id: 'a', answer: 'x', run: undefined }],
		['single quotes', "<Predict id='a' answer='x'>", { id: 'a', answer: 'x' }],
	];
	it.each(cases)('%s', (_label, src, want) => {
		const tags = findPredictTags(src);
		expect(tags).toHaveLength(1);
		for (const [k, v] of Object.entries(want)) expect(tags[0]?.props.get(k)).toBe(v);
	});
	it('finds several tags and keeps their offsets', () => {
		const many = findPredictTags('<Predict id="a" answer="1>2"> body </Predict>\n<Predict id="b" run="x.py">');
		expect(many).toHaveLength(2);
		expect(many[1]?.props.get('run')).toBe('x.py');
		expect(many[0]?.index).toBe(0);
	});
	it('skips an escaped quote inside an expression', () => {
		const tags = findPredictTags('<Predict id="a" title={\'it\\\'s > 1\'} run="r.py">');
		expect(tags[0]?.props.get('run')).toBe('r.py');
	});
	it('throws on an unterminated tag', () => {
		expect(() => findPredictTags('<Predict id="a" answer={`open')).toThrow(/unterminated/);
	});
	it('parseProps reads the three quoting forms', () => {
		const props = parseProps('a="1" b=\'2\' c={`3`} d={4}');
		expect([...props]).toEqual([
			['a', '1'],
			['b', '2'],
			['c', '3'],
		]);
	});
});

describe('checkSource', () => {
	const ok = () => ({ status: 0, stdout: 'hello', stderr: '' });
	it('counts a matching example', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.py">', ok);
		expect(res).toEqual({ found: 1, checked: 1, failures: [] });
	});
	it('accepts trailing whitespace in the answer', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello\n" run="x.py">', ok);
		expect(res.failures).toEqual([]);
	});
	it('reports a mismatch with both outputs', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="bye" run="x.py">', ok);
		expect(res.checked).toBe(1);
		expect(res.failures[0]).toContain('expected: "bye"');
		expect(res.failures[0]).toContain('actual:   "hello"');
	});
	it('reports a non-zero exit with stderr', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.py">', () => ({
			status: 2,
			stdout: '',
			stderr: 'boom',
		}));
		expect(res.failures[0]).toMatch(/exited 2\nboom/);
	});
	it('reports a run without an answer, an unsupported fixture, and a run the parser missed', () => {
		expect(checkSource('f.mdx', '<Predict id="a" run="x.py">', ok).failures[0]).toContain('no answer');
		const unsupported = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.rb">', () => ({
			error: 'unsupported fixture type .rb',
		}));
		expect(unsupported.failures[0]).toContain('unsupported fixture type .rb');
		expect(unsupported.checked).toBe(0);
		const missed = checkSource('f.mdx', '<Predict id="a" answer="x" run={runName}>', ok);
		expect(missed.found).toBe(0);
		expect(missed.failures[0]).toContain('no run= prop parsed');
	});
	it('checks an ungraded example (no objective) like any other run', () => {
		const res = checkSource('f.mdx', '<Predict id="e" title="T" answer="hello" run="x.py">', ok);
		expect(res).toEqual({ found: 1, checked: 1, failures: [] });
	});
	it('ignores an honor-system predict', () => {
		expect(checkSource('f.mdx', '<Predict id="a" title="t">', ok)).toEqual({ found: 0, checked: 0, failures: [] });
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
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.py">', byInterp, interps);
		expect(seen).toEqual(['python3', 'python3.9']);
		expect(res.checked).toBe(2);
		expect(res.failures).toHaveLength(1);
		expect(res.failures[0]).toMatch(/x\.py \[python 3\.9\.25\] exited 1\nTypeError/);
		const bad = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.sh">', byInterp, interps);
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
		'<Predict id="a" answer="hi" run="hi.py">\n<Predict id="b" answer="bye" run="bye.py">\n',
	);
	writeFileSync(join(content, 'skip.md'), '<Predict id="z" answer="hi" run="hi.py">');
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
	it('runs a fixture with the interpreter it is given', () => {
		writeFileSync(join(examples, 'version.py'), 'import sys\nprint(sys.version_info[0], sys.version_info[1])\n');
		const floor = FLOOR.split('.').join(' ');
		expect(runFixture(examples, 'version.py', { label: 'floor', cmd: `python${FLOOR}` })).toMatchObject({
			status: 0,
			stdout: floor,
		});
	});
	it('checks a content tree against its fixtures on both interpreters', () => {
		const res = checkExamples(content, examples);
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
	// This sweep runs every fixture under site/examples/ twice (both interpreters), so it gets a per-test
	// budget far above the default 5000 ms, which a loaded machine or a slow CI runner exceeds (#255).
	it('the real lesson tree has examples that pass on both interpreters', () => {
		const root = new URL('../..', import.meta.url).pathname;
		const res = checkExamples(join(root, 'src/content/docs'), join(root, 'examples'));
		expect(res.failures).toEqual([]);
		expect(res.checked).toBe(res.found * 2);
		expect(res.checked).toBeGreaterThan(0);
	}, 120_000);
});
