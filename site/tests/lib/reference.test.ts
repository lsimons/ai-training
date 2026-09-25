import type { Lesson } from '@lib/lessons';
import {
	canonicalExampleOf,
	dropCitations,
	referenceOf,
	renderBlocks,
	renderInline,
	segmentsOf,
	takeawaysOf,
} from '@lib/reference';
import { describe, expect, it } from 'vitest';

const lesson = (body?: string): Lesson => ({ id: 'x/y', data: { title: 'X' }, body }) as unknown as Lesson;

describe('renderInline', () => {
	it('renders code spans, strong, emphasis and links, drops citations, escapes the rest', () => {
		expect(renderInline('Use `a < b` and **bold** with *em* (@AEC-02).')).toBe(
			'Use <code>a &lt; b</code> and <strong>bold</strong> with <em>em</em>.',
		);
		// Root-relative links get the deploy base (the rehype plugin never sees this HTML); others stay as written.
		expect(renderInline('See [the map](/map/) & more')).toBe('See <a href="/ai-training/map/">the map</a> &amp; more');
		expect(renderInline('[docs](https://example.org/x) and [here](#anchor)')).toBe(
			'<a href="https://example.org/x">docs</a> and <a href="#anchor">here</a>',
		);
		expect(renderInline('a `**not bold**` b')).toBe('a <code>**not bold**</code> b');
	});
});

describe('dropCitations', () => {
	it('drops tokens of any key the citation syntax accepts, with the whitespace before them', () => {
		expect(dropCitations('Ask first (@Claude Code permissions).')).toBe('Ask first.');
		expect(dropCitations('A (@a) (@b) b.')).toBe('A b.');
		expect(dropCitations('A (@a), then (@b.c v2).')).toBe('A, then.');
		expect(dropCitations('(@a) Starts here.')).toBe('Starts here.');
		// A key split over a soft line break is one token, as in the remark plugin.
		expect(dropCitations('Wrapped (@Claude\n  Code).')).toBe('Wrapped.');
		expect(dropCitations('No tokens (here).')).toBe('No tokens (here).');
	});
	it('keeps the space after a token that follows a code span', () => {
		expect(dropCitations(' (@a) then', false)).toBe(' then');
		expect(renderInline('Run `ls` (@a) then `pwd` (@b).')).toBe('Run <code>ls</code> then <code>pwd</code>.');
		expect(renderInline('Keep `(@a)` as code (@b).')).toBe('Keep <code>(@a)</code> as code.');
	});
});

describe('renderBlocks', () => {
	it('splits paragraphs on blank lines and renders dash lists, joining wrapped lines', () => {
		expect(renderBlocks('One\nline.\n\n- a\n- b\n  continued\n\nTwo.')).toBe(
			'<p>One line.</p><ul><li>a</li><li>b continued</li></ul><p>Two.</p>',
		);
		expect(renderBlocks('  \n')).toBe('');
	});
});

describe('segmentsOf', () => {
	it('splits fenced code from the prose around it, in order', () => {
		expect(segmentsOf('Intro.\n\n```python\nprint(1)\n```\n\nAfter.\n\n```\nplain\n```\n')).toEqual([
			{ kind: 'text', html: '<p>Intro.</p>' },
			{ kind: 'code', lang: 'python', code: 'print(1)' },
			{ kind: 'text', html: '<p>After.</p>' },
			{ kind: 'code', lang: '', code: 'plain' },
		]);
		expect(segmentsOf('\n\n')).toEqual([]);
		// An info string after the language is dropped, and the code is still split off.
		expect(segmentsOf('```python title="tool.py" frame=none\nx = 1\n```\n')).toEqual([
			{ kind: 'code', lang: 'python', code: 'x = 1' },
		]);
	});
});

describe('takeawaysOf', () => {
	it('reads the numbered items inside Recap, joining wrapped lines', () => {
		const body =
			'Text.\n\n<Recap>\n\n1. First **one**.\n2. Second\n   continues (@K-1).\n3. Two keys (@Claude Code\n   permissions) (@AEC-02).\n\n</Recap>\n';
		expect(takeawaysOf(lesson(body))).toEqual(['First <strong>one</strong>.', 'Second continues.', 'Two keys.']);
	});
	it('is empty without a Recap or a body, and rejects an unclosed Recap', () => {
		expect(takeawaysOf(lesson('no recap'))).toEqual([]);
		expect(takeawaysOf(lesson())).toEqual([]);
		expect(() => takeawaysOf(lesson('<Recap>\n1. a\n'))).toThrow(/closing tag for `<Recap>`/);
	});
});

describe('canonicalExampleOf', () => {
	const predict =
		'<Predict id="p1" objective="o" title="Run" hint="h" answer={`1\n2`} run="a/b.py">\nWhat prints?\n\n```python\nprint(1)\n```\n</Predict>';
	const honor = '<Predict id="p0" objective="o" title="Honor" hint="h">\n</Predict>';
	const prompt = '<Prompt model="gpt" recorded="2026-09">\nDo it.\n</Prompt>\n<Response>\nDone.\n</Response>';

	it('picks the first Predict or Prompt in source order', () => {
		expect(canonicalExampleOf(lesson(`${prompt}\n${predict}`))?.kind).toBe('prompt');
		expect(canonicalExampleOf(lesson(`${predict}\n${prompt}`))).toEqual({
			kind: 'predict',
			id: 'p1',
			title: 'Run',
			body: [
				{ kind: 'text', html: '<p>What prints?</p>' },
				{ kind: 'code', lang: 'python', code: 'print(1)' },
			],
			answer: '1\n2',
			run: 'a/b.py',
		});
	});
	it('skips a Predict alternate, which is hidden or extra on the page', () => {
		const alternate = predict.replace('<Predict id="p1"', '<Predict phase="review" id="p1"');
		expect(canonicalExampleOf(lesson(`${alternate}\n${prompt}`))?.kind).toBe('prompt');
		const extra = predict.replace('<Predict id="p1"', '<Predict phase="practice" id="p1"');
		expect(canonicalExampleOf(lesson(extra))).toBeUndefined();
	});
	it('prefers the block marked canonical, bare or as {true}', () => {
		const marked = predict.replace('<Predict id="p1"', '<Predict canonical id="p1"');
		expect(canonicalExampleOf(lesson(`${honor}\n${marked}`))?.kind === 'predict' && 'p1').toBe('p1');
		const asTrue = prompt.replace('<Prompt ', '<Prompt canonical={true} ');
		expect(canonicalExampleOf(lesson(`${honor}\n${asTrue}`))?.kind).toBe('prompt');
		expect(() => canonicalExampleOf(lesson(`${marked}\n${asTrue}`))).toThrow(/more than one block is marked canonical/);
	});
	it('reads a prompt with its response and the illustrative flag', () => {
		expect(canonicalExampleOf(lesson(prompt))).toEqual({
			kind: 'prompt',
			model: 'gpt',
			recorded: '2026-09',
			illustrative: false,
			prompt: [{ kind: 'text', html: '<p>Do it.</p>' }],
			response: [{ kind: 'text', html: '<p>Done.</p>' }],
		});
		const alone =
			'<Prompt model="illustrative" recorded="illustrative">\nHi.\n</Prompt>\n\nProse.\n<Response>\nx\n</Response>';
		const ex = canonicalExampleOf(lesson(alone));
		expect(ex?.kind === 'prompt' && ex.illustrative).toBe(true);
		expect(ex?.kind === 'prompt' && ex.response).toBeUndefined();
	});
	it('leaves the honor-system variant without answer or run, and returns undefined without any block', () => {
		const ex = canonicalExampleOf(lesson(honor));
		expect(ex).toEqual({ kind: 'predict', id: 'p0', title: 'Honor', body: [] });
		expect(canonicalExampleOf(lesson('<Choice id="c" options={[]}>\n</Choice>'))).toBeUndefined();
		expect(canonicalExampleOf(lesson())).toBeUndefined();
	});
	it('pairs a Prompt with the Response that follows it even when the Prompt has a JSX child', () => {
		const withChild =
			'<Prompt model="gpt" recorded="2026-09">\nDo it.\n\n<Aside>\nNote.\n</Aside>\n</Prompt>\n<Response>\nDone.\n</Response>';
		const ex = canonicalExampleOf(lesson(withChild));
		expect(ex?.kind === 'prompt' && ex.response).toEqual([{ kind: 'text', html: '<p>Done.</p>' }]);
	});
	it('takes an ungraded example (a Predict without an objective) as the canonical example', () => {
		const shown = '<Predict id="e" title="Shown" answer="2" run="y.py">\nRun this.\n</Predict>';
		expect(canonicalExampleOf(lesson(`${shown}\n${predict}`))).toEqual({
			kind: 'predict',
			id: 'e',
			title: 'Shown',
			body: [{ kind: 'text', html: '<p>Run this.</p>' }],
			answer: '2',
			run: 'y.py',
		});
	});
	it('rejects a Predict without an id', () => {
		expect(() => canonicalExampleOf(lesson('<Predict objective="o">\n</Predict>'))).toThrow(/without an id/);
	});
});

describe('referenceOf', () => {
	it('combines the takeaways and the example', () => {
		const body = '<Predict id="p" objective="o" title="T" hint="h">\n</Predict>\n<Recap>\n1. A.\n</Recap>';
		expect(referenceOf(lesson(body))).toEqual({
			takeaways: ['A.'],
			example: { kind: 'predict', id: 'p', title: 'T', body: [] },
		});
	});
});
