import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkCourses, frontmatter, knownIds, lessonPages } from '../../scripts/lib/courses.mjs';

const roots: string[] = [];
afterAll(() => {
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const TOPIC =
	'id: a/t\narea: a\nname: T\ndefinition: d\nconcepts: []\nlinks: {prerequisites: [], related: [], specializations: []}\n';
const COMPETENCY =
	'area: a\ncompetencies:\n  - id: a/c\n    statement: s\n    objectives:\n      - id: a/c/o\n        statement: s\n        level: base\n';
const PAGE = '---\ntitle: X\nmode: tutorial\ncovers:\n  - a/t\nserves:\n  - a/c/o\n---\n\nBody.\n';
const LIVE =
	'area: a\nlessons:\n  - id: a/x\n    title: X\n    covers: a/t\n    serves: [a/c/o]\n    status: live\n    minutes: 10\n';

/** A temp tree with one topic, one objective, one page `a/x`, and the given plan files. */
function tree(files: Record<string, string | null>, plan: Record<string, string> = { 'a.yaml': LIVE }) {
	const root = mkdtempSync(join(tmpdir(), 'courses-'));
	roots.push(root);
	const all: Record<string, string | null> = {
		'data/topics/a/t.yaml': TOPIC,
		'data/competencies/a.yaml': COMPETENCY,
		'content/a/x.mdx': PAGE,
		'content/a/index.mdx': '---\ntitle: Course\n---\n',
		...Object.fromEntries(Object.entries(plan).map(([k, v]) => [`data/courses/${k}`, v])),
		...files,
	};
	mkdirSync(join(root, 'data/courses'), { recursive: true });
	for (const [rel, body] of Object.entries(all)) {
		if (body === null) continue;
		mkdirSync(dirname(join(root, rel)), { recursive: true });
		writeFileSync(join(root, rel), body);
	}
	return root;
}

const check = (root: string) => checkCourses(join(root, 'data'), join(root, 'content'));

describe('checkCourses', () => {
	it('passes a consistent tree and counts entries and pages', () => {
		expect(check(tree({}))).toEqual({ errors: [], entries: 1, pages: 1 });
	});
	it('reports a missing courses directory', () => {
		const root = tree({});
		rmSync(join(root, 'data/courses'), { recursive: true });
		const r = check(root);
		expect(r.errors).toHaveLength(1);
		expect(r.errors[0]).toMatch(/does not exist/);
	});
	it('reports an area that differs from the file name, and a plan without a lessons list', () => {
		const { errors } = check(tree({}, { 'a.yaml': 'area: b\n' }));
		expect(errors).toEqual([
			'src/data/courses/a.yaml: area is "b", expected a (the file name)',
			'src/data/courses/a.yaml: no lessons list',
			'src/content/docs/a/x.mdx: lesson page is not in src/data/courses/a.yaml',
		]);
	});
	it('reports an entry without an id by its index', () => {
		const plan = `${LIVE}  - title: No id\n    covers: a/t\n    status: planned\n    minutes: 5\n`;
		expect(check(tree({}, { 'a.yaml': plan })).errors).toEqual([
			'src/data/courses/a.yaml lessons[1]: entry without an id',
		]);
	});
	it('reports a duplicate id within and across files, and an id outside the area', () => {
		const other = 'area: b\nlessons:\n  - id: a/x\n    title: X\n    covers: a/t\n    status: live\n    minutes: 5\n';
		const dup = `${LIVE}  - id: a/x\n    title: X\n    covers: a/t\n    serves: [a/c/o]\n    status: live\n    minutes: 10\n`;
		const { errors } = check(tree({}, { 'a.yaml': dup, 'b.yaml': other }));
		expect(errors).toContain('src/data/courses/a.yaml a/x: duplicate id, also in src/data/courses/a.yaml');
		expect(errors).toContain('src/data/courses/b.yaml a/x: duplicate id, also in src/data/courses/a.yaml');
		expect(errors).toContain('src/data/courses/b.yaml a/x: id must start with b/');
	});
	it('reports an unknown covers, serves or after id', () => {
		const plan =
			'area: a\nlessons:\n  - id: a/p\n    title: P\n    covers: a/nope\n    serves: [a/c/nope]\n    status: planned\n    minutes: 5\n    after: [a/missing]\n';
		const { errors } = check(tree({ 'content/a/x.mdx': null }, { 'a.yaml': plan }));
		expect(errors).toEqual([
			'src/data/courses/a.yaml a/p: covers "a/nope" is not a topic id',
			'src/data/courses/a.yaml a/p: serves "a/c/nope" is not an objective id',
			'src/data/courses/a.yaml a/p: after "a/missing" is not an entry in this plan',
		]);
	});
	it('reports a live entry without a page, and a page for an entry that is not live', () => {
		const noPage = check(tree({ 'content/a/x.mdx': null }));
		expect(noPage.errors).toEqual([
			'src/data/courses/a.yaml a/x: status is live but src/content/docs/a/x.mdx has no lesson page',
		]);
		const drafting = check(tree({}, { 'a.yaml': LIVE.replace('status: live', 'status: drafting') }));
		expect(drafting.errors).toEqual([
			'src/data/courses/a.yaml a/x: status is drafting but a lesson page exists; mark it live',
		]);
	});
	it('reports a live entry whose title, covers or serves differ from the page', () => {
		const drift = LIVE.replace('title: X', 'title: Y').replace('covers: a/t', 'covers: a/t2').replace('[a/c/o]', '[]');
		const { errors } = check(
			tree({ 'data/topics/a/t2.yaml': TOPIC.replace('id: a/t', 'id: a/t2') }, { 'a.yaml': drift }),
		);
		expect(errors).toEqual([
			'src/data/courses/a.yaml a/x: title "Y" differs from the page\'s "X"',
			'src/data/courses/a.yaml a/x: covers "a/t2" differs from the page\'s ["a/t"]',
			'src/data/courses/a.yaml a/x: serves [] differs from the page\'s ["a/c/o"]',
		]);
	});
	it('reports a lesson page that no plan lists', () => {
		const { errors } = check(tree({ 'content/a/y.mdx': PAGE }));
		expect(errors).toEqual(['src/content/docs/a/y.mdx: lesson page is not in src/data/courses/a.yaml']);
	});
});

describe('helpers', () => {
	it('frontmatter parses the YAML block and returns {} without one', () => {
		expect(frontmatter(PAGE)).toMatchObject({ title: 'X', mode: 'tutorial', covers: ['a/t'] });
		expect(frontmatter('# no frontmatter\n')).toEqual({});
	});
	it('lessonPages skips pages without mode and non-mdx files', () => {
		const root = tree({ 'content/a/notes.md': PAGE });
		expect([...lessonPages(join(root, 'content')).keys()]).toEqual(['a/x']);
	});
	it('knownIds collects topic and objective ids', () => {
		const root = tree({});
		const { topicIds, objectiveIds } = knownIds(join(root, 'data'));
		expect([...topicIds]).toEqual(['a/t']);
		expect([...objectiveIds]).toEqual(['a/c/o']);
	});
});
