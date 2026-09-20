import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
	checkExamples,
	checkSource,
	findPredictTags,
	parseProps,
	runFixture,
	walkMdx,
} from '../../scripts/lib/examples.mjs';

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
	it('ignores an honor-system predict', () => {
		expect(checkSource('f.mdx', '<Predict id="a" title="t">', ok)).toEqual({ found: 0, checked: 0, failures: [] });
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
	it('checks a content tree against its fixtures', () => {
		expect(checkExamples(content, examples)).toEqual({ found: 2, checked: 2, failures: [] });
	});
	it('fails when no example exists at all', () => {
		const empty = join(dir, 'empty');
		mkdirSync(empty);
		const res = checkExamples(empty, examples);
		expect(res.failures[0]).toContain('no <Predict run=...> examples found');
	});
	it('the real lesson tree has examples that pass', () => {
		const root = new URL('../..', import.meta.url).pathname;
		const res = checkExamples(join(root, 'src/content/docs'), join(root, 'examples'));
		expect(res.failures).toEqual([]);
		expect(res.checked).toBeGreaterThan(0);
	});
});
