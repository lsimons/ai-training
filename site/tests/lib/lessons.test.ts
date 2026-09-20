import { buildCatalog } from '@lib/catalog';
import { checkpointsOf, checkpointTagsOf, getLessons, type Lesson, parseAttrs } from '@lib/lessons';
import { knownPagePaths } from '@lib/links';
import { describe, expect, it, vi } from 'vitest';
import { type DocFixture, docs } from './content';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const lesson = (id: string): Lesson => {
	const d = docs.find((x) => x.id === id);
	if (!d) throw new Error(`no fixture ${id}`);
	return d as unknown as Lesson;
};
const asLesson = (d: DocFixture): Lesson => d as unknown as Lesson;
const body = (b: string): Lesson => asLesson({ id: 'x/y', data: { title: 'X' }, body: b });

describe('getLessons', () => {
	it('returns docs with a mode, sorted by id, optionally by area', async () => {
		expect((await getLessons()).map((l) => l.id)).toEqual([
			'concepts/how-models-work',
			'safety/agent-risk',
			'safety/deeper',
		]);
		expect((await getLessons('safety')).map((l) => l.id)).toEqual(['safety/agent-risk', 'safety/deeper']);
	});
});

describe('parseAttrs', () => {
	it('reads string, expression and bare props', () => {
		const attrs = parseAttrs(
			'<Choice id="a" title=\'t\' review={false} options={[{ text: "x}y", why: `a > b` }]} honor>',
		);
		expect(attrs.get('id')).toEqual({ value: 'a', expr: false });
		expect(attrs.get('title')).toEqual({ value: 't', expr: false });
		expect(attrs.get('review')).toEqual({ value: 'false', expr: true });
		expect(attrs.get('options')).toEqual({ value: '[{ text: "x}y", why: `a > b` }]', expr: true });
		expect(attrs.get('honor')).toEqual({ value: '', expr: false });
	});
	it('accepts whitespace around = and a self-closing end', () => {
		const attrs = parseAttrs('<Sort id = "a"\n  buckets =\n  {[]} items= {[]} />');
		expect([...attrs.entries()]).toEqual([
			['id', { value: 'a', expr: false }],
			['buckets', { value: '[]', expr: true }],
			['items', { value: '[]', expr: true }],
		]);
	});
	it('rejects an unterminated string or expression, an unquoted value, and a token it cannot read', () => {
		expect(() => parseAttrs('<Choice id="a>')).toThrow(/unterminated string for id/);
		expect(() => parseAttrs('<Choice options={[>')).toThrow(/unterminated expression for options/);
		expect(() => parseAttrs('<Choice id=a>')).toThrow(/unquoted value for id/);
		expect(() => parseAttrs('<Choice id="a" {/* note */} title="t">')).toThrow(
			/unexpected "\{\/\* note \*\/\} title=\\"" where a prop name should be/,
		);
		expect(() => parseAttrs('<Choice id="a" {...rest}>')).toThrow(/unexpected/);
	});
});

describe('checkpointTagsOf', () => {
	it('returns the tag, its props and the stem, empty for a self-closing tag', () => {
		const tags = checkpointTagsOf(
			body('<Sort id="s" concepts={[\'a\']} buckets={[]} items={[]} />\n<Choice id="c">\n\nStem *here*.\n\n</Choice>'),
		);
		expect(tags.map((t) => [t.tag, t.kind, t.stem])).toEqual([
			['Sort', 'sort', ''],
			['Choice', 'choice', 'Stem *here*.'],
		]);
		expect(tags[0]?.attrs.get('concepts')).toEqual({ value: "['a']", expr: true });
	});
	it('rejects a tag without a closing tag and an unterminated opening tag', () => {
		expect(() => checkpointTagsOf(body('<Choice id="c">\nStem.\n'))).toThrow(/without a closing tag/);
		expect(() => checkpointTagsOf(body('<Choice id="a" options={['))).toThrow(/unterminated tag/);
		expect(() => checkpointTagsOf(body('<Choice id="a>'))).toThrow(/unterminated tag/);
	});
});

describe('checkpointsOf', () => {
	it('reads every checkpoint tag with its kind, title, revision, reviewability, concepts, context and stem', () => {
		const common = { objective: 'o1', hint: 'h', stem: '' };
		expect(checkpointsOf(lesson('concepts/how-models-work'))).toEqual([
			{
				...common,
				id: 'what-the-model-does',
				title: 'What the model does',
				kind: 'choice',
				revision: 1,
				reviewable: true,
				concepts: ['token', 'context-window'],
				context: 'The lesson shows a widget.',
				stem: 'Stem.',
			},
			{
				...common,
				id: 'honor',
				title: 'Run it',
				kind: 'predict',
				revision: 1,
				reviewable: false,
				concepts: ['token'],
				context: undefined,
			},
			{
				...common,
				id: 'graded',
				title: 'Graded',
				kind: 'predict',
				revision: 2,
				reviewable: true,
				concepts: ['token'],
				context: undefined,
			},
			{
				...common,
				id: 'fix',
				title: 'Fix',
				kind: 'repair',
				revision: 1,
				reviewable: false,
				concepts: ['token'],
				context: undefined,
			},
			{
				...common,
				id: 'opt-out',
				title: 'Order',
				kind: 'order',
				revision: 1,
				reviewable: false,
				concepts: ['token'],
				context: undefined,
			},
		]);
		expect(checkpointsOf(lesson('safety/agent-risk'))[0]?.kind).toBe('scenario');
		expect(checkpointsOf(lesson('safety/deeper'))).toEqual([]);
	});
	it('falls back to the id as title and handles a missing body', () => {
		const l = body('<Choice id="only-id" concepts={["c"]} options={[]}>\n</Choice>');
		expect(checkpointsOf(l)[0]?.title).toBe('only-id');
		expect(checkpointsOf(l)[0]?.objective).toBe('');
		expect(checkpointsOf(asLesson({ id: 'x/y', data: { title: 'X' } }))).toEqual([]);
	});
	it('rejects a tag without an id, a bad review value, a bad revision and an unterminated tag', () => {
		const at = (b: string) => () => checkpointsOf(body(b));
		expect(at('<Choice objective="o">\n</Choice>')).toThrow(/without an id/);
		expect(at('<Choice id="a" concepts={["c"]} review={maybe}>\n</Choice>')).toThrow(/review must be/);
		expect(at('<Choice id="a" concepts={["c"]} revision={0}>\n</Choice>')).toThrow(
			/revision must be a positive integer/,
		);
		expect(at('<Choice id="a" concepts={["c"]} revision="two">\n</Choice>')).toThrow(
			/revision must be a positive integer/,
		);
		expect(at('<Choice id="a" options={[')).toThrow(/unterminated tag/);
	});
	it('requires concepts as a non-empty array expression of strings, evaluated like the component sees it', () => {
		const at = (b: string) => () => checkpointsOf(body(b));
		expect(at('<Choice id="a" options={[]}>\n</Choice>')).toThrow(
			/x\/y#a: concepts=\{\['concept-id', \.\.\.\]\} is required/,
		);
		expect(at('<Choice id="a" concepts="token" options={[]}>\n</Choice>')).toThrow(/is required/);
		expect(at('<Choice id="a" concepts={[]} options={[]}>\n</Choice>')).toThrow(/at least one concept id/);
		expect(at('<Choice id="a" concepts={[1]} options={[]}>\n</Choice>')).toThrow(/must be an array of concept ids/);
		expect(at('<Choice id="a" concepts={"c"} options={[]}>\n</Choice>')).toThrow(/must be an array of concept ids/);
		expect(at('<Choice id="a" concepts={[nope]} options={[]}>\n</Choice>')).toThrow(/cannot evaluate concepts/);
		// A commented-out id is not a concept: the evaluated array is what counts.
		expect(
			checkpointsOf(body("<Choice id=\"a\" concepts={['c', /* 'd' */]} options={[]}>\n</Choice>"))[0]?.concepts,
		).toEqual(['c']);
	});
	it('reads an expression-valued string prop, and rejects one that is not a string', () => {
		const one = checkpointsOf(
			body('<Choice id="a" concepts={["c"]} hint={"h " + 1} context={\'ctx\'} options={[]}>\n</Choice>'),
		)[0];
		expect(one?.hint).toBe('h 1');
		expect(one?.context).toBe('ctx');
		expect(() => checkpointsOf(body('<Choice id="a" concepts={["c"]} hint={3} options={[]}>\n</Choice>'))).toThrow(
			/x\/y#a: hint must be a string, got number/,
		);
	});
	it('skips a > inside quotes, braces and template literals', () => {
		const b = '<Choice id="a" concepts={["c"]} title="b > c" options={[{ text: `x > y`, why: "p > q" }]}>\n</Choice>';
		expect(checkpointsOf(body(b))[0]?.title).toBe('b > c');
		const escaped = '<Choice id="a" concepts={["c"]} title="q" options={[{ text: \'it\\\'s > 1\' }]}>\n</Choice>';
		expect(checkpointsOf(body(escaped))).toHaveLength(1);
	});
});

describe('buildCatalog', () => {
	it('groups lessons by area in path order with their checkpoints', async () => {
		const catalog = await buildCatalog();
		expect(catalog.map((c) => c.area)).toEqual([
			'concepts',
			'safety',
			'using-agents',
			'coding-with-agents',
			'customizing-agents',
			'building-agents',
		]);
		expect(catalog[0]?.lessons).toHaveLength(1);
		expect(catalog[0]?.lessons[0]?.checkpoints.map((c) => c.id)).toContain('graded');
		expect(catalog[1]?.lessons.map((l) => l.id)).toEqual(['safety/agent-risk', 'safety/deeper']);
		expect(catalog[2]?.lessons).toEqual([]);
	});
});

describe('knownPagePaths', () => {
	it('lists every doc and topic page root-relative', async () => {
		const paths = await knownPagePaths();
		expect(paths.has('/concepts/how-models-work/')).toBe(true);
		expect(paths.has('/index/')).toBe(true);
		expect(paths.has('/topics/concepts/models/')).toBe(true);
		expect(paths.has('/nowhere/')).toBe(false);
	});
});
