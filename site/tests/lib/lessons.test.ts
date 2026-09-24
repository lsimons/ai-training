import { buildCatalog } from '@lib/catalog';
import { checkpointsOf, checkpointTagsOf, getLessons, type Lesson } from '@lib/lessons';
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

describe('checkpointTagsOf', () => {
	it('returns the tag, its props and the stem, empty for a self-closing tag', () => {
		const tags = checkpointTagsOf(
			body('<Sort id="s" concepts={[\'a\']} buckets={[]} items={[]} />\n<Choice id="c">\n\nStem *here*.\n\n</Choice>'),
		);
		expect(tags.map((t) => [t.tag, t.kind, t.stem])).toEqual([
			['Sort', 'sort', ''],
			['Choice', 'choice', 'Stem *here*.'],
		]);
		expect(tags[0]?.attrs.get('concepts')).toEqual({ value: ['a'], expr: true });
	});
	it('reads a tag inside a paragraph too, and rejects what the MDX parser rejects', () => {
		expect(checkpointTagsOf(body('Text <Choice id="c" /> more.'))).toHaveLength(1);
		expect(() => checkpointTagsOf(body('<Choice id="c">\nStem.\n'))).toThrow(/closing tag/);
		expect(() => checkpointTagsOf(body('<Choice id="a" options={['))).toThrow(/^x\/y: Unexpected end of file/);
		expect(() => checkpointTagsOf(body('<Choice id="a>'))).toThrow(/Unexpected end of file/);
	});
});

describe('checkpointsOf', () => {
	it('reads every checkpoint tag with its kind, title, revision, reviewability, concepts, context and stem', () => {
		const common = { objective: 'o1', hint: 'h', stem: '', phase: 'first' };
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
				// The reference tests read this body too (lib/reference.ts).
				stem: 'What does this print?\n\n```python\nprint(1 > 0)\n```',
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
	it('skips a Predict without an objective: an ungraded example is not a checkpoint', () => {
		const ids = checkpointsOf(lesson('concepts/how-models-work')).map((c) => c.id);
		expect(ids).not.toContain('shown');
		expect(checkpointTagsOf(body('<Predict id="e" title="T" answer="1" run="x.py">\n</Predict>'))).toEqual([]);
		// The same tag with an objective is a checkpoint, whatever else it lacks.
		expect(checkpointTagsOf(body('<Predict id="e" objective="o" answer="1" run="x.py">\n</Predict>'))).toHaveLength(1);
	});
	it('rejects an id used twice on a page, an ungraded example included', () => {
		const twice =
			'<Choice id="a" concepts={["c"]} options={[]}>\n</Choice>\n<Sort id="a" concepts={["c"]} buckets={[]} items={[]} />';
		expect(() => checkpointTagsOf(body(twice))).toThrow(/x\/y: id "a" is used twice/);
		const example =
			'<Choice id="a" concepts={["c"]} options={[]}>\n</Choice>\n<Predict id="a" title="T" answer="1" run="x.py">\n</Predict>';
		expect(() => checkpointTagsOf(body(example))).toThrow(/id "a" is used twice/);
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
		expect(at('<Choice id="a" concepts={["c"]} review="yes">\n</Choice>')).toThrow(/review must be/);
		expect(at('<Choice id="a" concepts={["c"]} review={maybe}>\n</Choice>')).toThrow(/cannot read review/);
		expect(at('<Choice id="a" concepts={["c"]} revision={0}>\n</Choice>')).toThrow(
			/revision must be a positive integer/,
		);
		expect(at('<Choice id="a" concepts={["c"]} revision="two">\n</Choice>')).toThrow(
			/revision must be a positive integer/,
		);
		expect(at('<Choice id="a" options={[')).toThrow(/Unexpected end of file/);
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
		expect(at('<Choice id="a" concepts={[nope]} options={[]}>\n</Choice>')).toThrow(/cannot read concepts/);
		// A commented-out id is not a concept: the array the parser reads is what counts.
		expect(
			checkpointsOf(body("<Choice id=\"a\" concepts={['c', /* 'd' */]} options={[]}>\n</Choice>"))[0]?.concepts,
		).toEqual(['c']);
	});
	it('reads an expression-valued string prop, and rejects one that is not a string or not a literal', () => {
		const one = checkpointsOf(
			body('<Choice id="a" concepts={["c"]} hint={`h 1`} context={\'ctx\'} options={[]}>\n</Choice>'),
		)[0];
		expect(one?.hint).toBe('h 1');
		expect(() =>
			checkpointsOf(body('<Choice id="a" concepts={["c"]} hint={"h " + 1} options={[]}>\n</Choice>')),
		).toThrow(/x\/y: cannot read hint=\{\.\.\.\} of <Choice>: BinaryExpression is not a literal/);
		expect(one?.context).toBe('ctx');
		expect(() => checkpointsOf(body('<Choice id="a" concepts={["c"]} hint={3} options={[]}>\n</Choice>'))).toThrow(
			/x\/y#a: hint must be a string, got number/,
		);
	});
	it('reads the phase, and a practice checkpoint is never reviewable', () => {
		const src = [
			'<Choice id="a" objective="o" concepts={["c"]} options={[]}>\n</Choice>',
			'<MultiChoice id="b" phase="review" objective="o" concepts={["c"]} options={[]}>\n</MultiChoice>',
			'<Exercise>\nDo.\n</Exercise>',
			'<MorePractice>\n<Choice id="c" phase="practice" objective="o" concepts={["c"]} options={[]}>\n</Choice>\n</MorePractice>',
		].join('\n\n');
		const all = checkpointsOf(body(src), { alternates: true });
		expect(all.map((c) => [c.id, c.phase, c.reviewable])).toEqual([
			['a', 'first', true],
			['b', 'review', true],
			['c', 'practice', false],
		]);
		expect(checkpointsOf(body(src)).map((c) => c.id)).toEqual(['a']);
		expect(() => checkpointsOf(body('<Choice id="a" phase="later" concepts={["c"]}>\n</Choice>'))).toThrow(
			/x\/y#a: phase must be one of first, review, practice, got "later"/,
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
