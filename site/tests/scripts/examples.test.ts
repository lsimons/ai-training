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
		['plain', '<Predict id="a" answer="x" run="r.sh">', { id: 'a', answer: 'x', run: 'r.sh' }],
		['gt in attr', '<Predict id="a" answer="a > b" run="r.sh">', { answer: 'a > b', run: 'r.sh' }],
		[
			'template literal',
			'<Predict id="a"\n  answer={`1. > x\n2. y`} run="r.sh">',
			{ answer: '1. > x\n2. y', run: 'r.sh' },
		],
		// The `${...}` here is parser input, not a placeholder this test wants filled in.
		['brace with gt', '<Predict id="a" answer={`$' + '{1 > 0}`} run="r.sh">', { run: 'r.sh' }],
		['self-closing', '<Predict id="a" run="r.sh" />', { id: 'a', run: 'r.sh' }],
		['no run', '<Predict id="a" answer="x">', { id: 'a', answer: 'x', run: undefined }],
		['single quotes', "<Predict id='a' answer='x'>", { id: 'a', answer: 'x' }],
	];
	it.each(cases)('%s', (_label, src, want) => {
		const tags = findPredictTags(src);
		expect(tags).toHaveLength(1);
		for (const [k, v] of Object.entries(want)) expect(tags[0]?.props.get(k)).toBe(v);
	});
	it('finds several tags and keeps their offsets', () => {
		const many = findPredictTags('<Predict id="a" answer="1>2"> body </Predict>\n<Predict id="b" run="x.sh">');
		expect(many).toHaveLength(2);
		expect(many[1]?.props.get('run')).toBe('x.sh');
		expect(many[0]?.index).toBe(0);
	});
	it('skips an escaped quote inside an expression', () => {
		const tags = findPredictTags('<Predict id="a" title={\'it\\\'s > 1\'} run="r.sh">');
		expect(tags[0]?.props.get('run')).toBe('r.sh');
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
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello" run="x.sh">', ok);
		expect(res).toEqual({ found: 1, checked: 1, failures: [] });
	});
	it('accepts trailing whitespace in the answer', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="hello\n" run="x.sh">', ok);
		expect(res.failures).toEqual([]);
	});
	it('reports a mismatch with both outputs', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="bye" run="x.sh">', ok);
		expect(res.checked).toBe(1);
		expect(res.failures[0]).toContain('expected: "bye"');
		expect(res.failures[0]).toContain('actual:   "hello"');
	});
	it('reports a non-zero exit with stderr', () => {
		const res = checkSource('f.mdx', '<Predict id="a" answer="x" run="x.sh">', () => ({
			status: 2,
			stdout: '',
			stderr: 'boom',
		}));
		expect(res.failures[0]).toMatch(/exited 2\nboom/);
	});
	it('reports a run without an answer, an unsupported fixture, and a run the parser missed', () => {
		expect(checkSource('f.mdx', '<Predict id="a" run="x.sh">', ok).failures[0]).toContain('no answer');
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
	writeFileSync(join(examples, 'hi.sh'), 'echo hi\n');
	writeFileSync(join(examples, 'hi.py'), 'print("hi")\n');
	writeFileSync(join(examples, 'fail.sh'), 'echo nope >&2; exit 3\n');
	writeFileSync(
		join(content, 'area', 'ok.mdx'),
		'<Predict id="a" answer="hi" run="hi.sh">\n<Predict id="b" answer="hi" run="hi.py">\n',
	);
	writeFileSync(join(content, 'skip.md'), '<Predict id="z" answer="hi" run="hi.sh">');
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it('walks only .mdx files', () => {
		expect([...walkMdx(content)]).toEqual([join(content, 'area', 'ok.mdx')]);
	});
	it('runs bash and python fixtures and rejects other extensions', () => {
		expect(runFixture(examples, 'hi.sh')).toMatchObject({ status: 0, stdout: 'hi' });
		expect(runFixture(examples, 'hi.py')).toMatchObject({ status: 0, stdout: 'hi' });
		expect(runFixture(examples, 'fail.sh')).toMatchObject({ status: 3, stderr: 'nope\n' });
		expect(runFixture(examples, 'x.rb')).toEqual({ error: 'unsupported fixture type .rb' });
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
