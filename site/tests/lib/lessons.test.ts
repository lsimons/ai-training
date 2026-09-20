import { buildCatalog } from '@lib/catalog';
import { checkpointsOf, getLessons, type Lesson } from '@lib/lessons';
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

describe('checkpointsOf', () => {
	it('reads every checkpoint tag with its kind, title, revision and reviewability', () => {
		expect(checkpointsOf(lesson('concepts/how-models-work'))).toEqual([
			{ id: 'what-the-model-does', title: 'What the model does', kind: 'choice', revision: 1, reviewable: true },
			{ id: 'honor', title: 'Run it', kind: 'predict', revision: 1, reviewable: false },
			{ id: 'graded', title: 'Graded', kind: 'predict', revision: 2, reviewable: true },
			{ id: 'fix', title: 'Fix', kind: 'repair', revision: 1, reviewable: false },
			{ id: 'opt-out', title: 'Order', kind: 'order', revision: 1, reviewable: false },
		]);
		expect(checkpointsOf(lesson('safety/agent-risk'))[0]?.kind).toBe('scenario');
		expect(checkpointsOf(lesson('safety/deeper'))).toEqual([]);
	});
	it('falls back to the id as title and handles a missing body', () => {
		const l = asLesson({ id: 'x/y', data: { title: 'X' }, body: '<Choice id="only-id" options={[]}>' });
		expect(checkpointsOf(l)[0]?.title).toBe('only-id');
		expect(checkpointsOf(asLesson({ id: 'x/y', data: { title: 'X' } }))).toEqual([]);
	});
	it('rejects a tag without an id, a bad review value, a bad revision and an unterminated tag', () => {
		const at = (body: string) => () => checkpointsOf(asLesson({ id: 'x/y', data: { title: 'X' }, body }));
		expect(at('<Choice objective="o">')).toThrow(/without an id/);
		expect(at('<Choice id="a" review={maybe}>')).toThrow(/review must be/);
		expect(at('<Choice id="a" revision={0}>')).toThrow(/revision must be a positive integer/);
		expect(at('<Choice id="a" revision="two">')).toThrow(/revision must be a positive integer/);
		expect(at('<Choice id="a" options={[')).toThrow(/unterminated tag/);
	});
	it('skips a > inside quotes, braces and template literals', () => {
		const body = '<Choice id="a" title="b > c" options={[{ text: `x > y`, why: "p > q" }]}>';
		expect(checkpointsOf(asLesson({ id: 'x/y', data: { title: 'X' }, body }))[0]?.title).toBe('b > c');
		const escaped = '<Choice id="a" title="q" options={[{ text: \'it\\\'s > 1\' }]}>';
		expect(checkpointsOf(asLesson({ id: 'x/y', data: { title: 'X' }, body: escaped }))).toHaveLength(1);
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
