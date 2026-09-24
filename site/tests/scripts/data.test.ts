import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { allLessons, allTopics, courseLessonIds, readAreaTree, yamlFilesIn } from '../../scripts/lib/area-tree.mjs';
import { checkData, frontmatter, knownIds, lessonPages, reviewDatePairError } from '../../scripts/lib/data.mjs';

const roots: string[] = [];
afterAll(() => {
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const GROUPS = '- id: g\n  order: 1\n  name: G\n  audience: Everyone\n  description: d\n  areas: [a]\n';
const AREA = 'id: a\nname: A\ngroup: g\ndescription: d\n';
const TOPIC =
	'id: a/t\narea: a\nname: T\ndefinition: d\nconcepts:\n  - {id: c1, name: C1, definition: d}\n  - {id: c2, name: C2, definition: d}\nlinks: {prerequisites: [], related: [], specializations: []}\n';
const COMPETENCY =
	'id: a/c\narea: a\nstatement: s\ntopics: [a/t]\nobjectives:\n  - id: a/c/o\n    statement: s\n    level: base\n';
const ALIGNMENT = 'id: fw\nframework: FW\nrows:\n  - code: X\n    asks: y\n    objectives: [a/c/o]\n';
const COURSE = 'id: a\narea: a\nlessons: [a/x, a/p]\n';
const LIVE =
	'id: a/x\ntitle: X\ndescription: d\nmode: tutorial\ncovers: a/t\nserves: [a/c/o]\nintroduces: [c1]\nassumes:\n  - {objective: a/c/o, lesson: a/p, section: s}\nexercise: {kind: do, brief: b}\nsources: [AEC-01]\nminutes: 10\n';
const PLANNED =
	'id: a/p\ntitle: P\nmode: explanation\ncovers: a/t\nintroduces: [c2]\nassumes: [{objective: a/c/o}]\nafter: [a/x]\nexercise: {kind: judge, brief: b}\nminutes: 10\n';
const BIB = 'AEC-01:\n  type: course\n  title: t\n';
const PAGE = 'Body.\n';

/** A temp tree with one group, area, topic, competency, course, a live lesson `a/x` and a planned `a/p`. */
function tree(files: Record<string, string | null> = {}) {
	const root = mkdtempSync(join(tmpdir(), 'data-'));
	roots.push(root);
	const all: Record<string, string | null> = {
		'data/groups.yaml': GROUPS,
		'data/bibliography.yaml': BIB,
		'data/alignment/fw.yaml': ALIGNMENT,
		'data/areas/a/area.yaml': AREA,
		'data/areas/a/topics/t.yaml': TOPIC,
		'data/areas/a/competencies/c.yaml': COMPETENCY,
		'data/areas/a/courses/a.yaml': COURSE,
		'data/areas/a/lessons/x.yaml': LIVE,
		'data/areas/a/lessons/p.yaml': PLANNED,
		'content/a/x.mdx': PAGE,
		'content/a/index.mdx': 'Course intro.\n',
		'content/guides/other.mdx': '---\ntitle: Not a lesson\n---\n',
		...files,
	};
	for (const [rel, body] of Object.entries(all)) {
		if (body === null) continue;
		mkdirSync(dirname(join(root, rel)), { recursive: true });
		writeFileSync(join(root, rel), body);
	}
	return root;
}

const check = (root: string) => checkData(join(root, 'data'), join(root, 'content'));

describe('checkData', () => {
	it('passes a consistent tree and counts lessons and pages', () => {
		expect(check(tree())).toEqual({ errors: [], warnings: [], lessons: 2, pages: 1 });
	});
	it('reports a missing areas directory', () => {
		const root = tree();
		rmSync(join(root, 'data/areas'), { recursive: true });
		expect(check(root).errors[0]).toMatch(/does not exist/);
	});
	it('reports groups and areas that disagree', () => {
		const twice = check(
			tree({
				'data/groups.yaml': `${GROUPS.replace('[a]', '[a, a, b]')}- id: h\n  order: 1\n  name: H\n  areas: []\n`,
			}),
		).errors;
		expect(twice).toContain('src/data/groups.yaml: area a is listed twice');
		expect(twice).toContain('src/data/groups.yaml: group h has the same order as another group');
		expect(twice).toContain('src/data/groups.yaml: area b has no src/data/areas/b/');
		const { errors } = check(
			tree({ 'data/areas/a/area.yaml': AREA.replace('id: a', 'id: z').replace('group: g', 'group: h') }),
		);
		expect(errors).toContain('src/data/areas/a/area.yaml: id is "z", expected a (the directory)');
		expect(errors).toContain('src/data/areas/a/area.yaml: group is "h", but groups.yaml lists it under g');
		const orphan = check(tree({ 'data/groups.yaml': '[]\n' })).errors;
		expect(orphan).toContain('src/data/areas/a/area.yaml: no group in src/data/groups.yaml lists a');
		expect(check(tree({ 'data/areas/a/area.yaml': null })).errors).toContain('src/data/areas/a/area.yaml: missing');
	});
	it('reports a topic, competency or alignment file whose ids or references are off', () => {
		const { errors } = check(
			tree({
				'data/areas/a/topics/t.yaml': TOPIC.replace('id: a/t', 'id: a/u').replace('area: a', 'area: b'),
				'data/areas/a/topics/t2.yaml': TOPIC.replace('id: a/t', 'id: a/t2').replace('name: T', 'name: T2'),
				'data/areas/a/competencies/c.yaml': COMPETENCY.replace('id: a/c\n', 'id: a/d\n')
					.replace('area: a', 'area: b')
					.replace('topics: [a/t]', 'topics: [a/nope]'),
				'data/alignment/fw.yaml': ALIGNMENT.replace('id: fw', 'id: other').replace('[a/c/o]', '[a/c/o, a/c/nope]'),
			}),
		);
		expect(errors).toContain('src/data/areas/a/topics/t.yaml: id is "a/u", expected a/t');
		expect(errors).toContain('src/data/areas/a/topics/t.yaml: area is "b", expected a');
		expect(errors).toContain('src/data/areas/a/topics/t2.yaml: concept c1 is also defined in a/u');
		expect(errors).toContain('src/data/areas/a/competencies/c.yaml: id is "a/d", expected a/c');
		expect(errors).toContain('src/data/areas/a/competencies/c.yaml: area is "b", expected a');
		expect(errors).toContain('src/data/areas/a/competencies/c.yaml: topics "a/nope" is not a topic id');
		expect(errors).toContain('src/data/areas/a/competencies/c.yaml: objective "a/c/o" is not under a/d/');
		expect(errors).toContain('src/data/alignment/fw.yaml: id is "other", expected fw (the file name)');
		expect(errors).toContain('src/data/alignment/fw.yaml X: objective "a/c/nope" is not an objective id');
	});
	it("reports a course that is not the area's, lists an unknown lesson, or lists one twice, and a lesson in no course", () => {
		const { errors } = check(
			tree({
				'data/areas/a/courses/a.yaml':
					'id: b\narea: b\nparts:\n  - title: One\n    lessons: [a/x, a/nope]\n  - title: Two\n    lessons: [a/x]\n',
			}),
		);
		expect(errors).toContain('src/data/areas/a/courses/a.yaml: id is "b", expected a (the file name)');
		expect(errors).toContain('src/data/areas/a/courses/a.yaml: area is "b", expected a');
		expect(errors).toContain(
			'src/data/areas/a/courses/a.yaml: lists a/nope, which has no file under src/data/areas/a/lessons/',
		);
		expect(errors).toContain('src/data/areas/a/courses/a.yaml: a/x is also listed in src/data/areas/a/courses/a.yaml');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: no course under src/data/areas/a/courses/ lists it');
		expect(check(tree({ 'data/areas/a/courses/a.yaml': null })).errors).toContain(
			'src/data/areas/a/courses/: no course file',
		);
	});
	it('reports a lesson whose references are off', () => {
		const other = TOPIC.replace(/a\//g, 'b/').replace('area: a', 'area: b').replace('c1', 'c3').replace('c2', 'c4');
		const { errors } = check(
			tree({
				'data/groups.yaml': GROUPS.replace('[a]', '[a, b]'),
				'data/areas/b/area.yaml': AREA.replace('id: a', 'id: b'),
				'data/areas/b/topics/t.yaml': other,
				'data/areas/b/courses/b.yaml': 'id: b\narea: b\nlessons: [b/y]\n',
				'data/areas/b/lessons/y.yaml': PLANNED.replace('id: a/p', 'id: b/y')
					.replace('after: [a/x]', 'after: []')
					.replace('covers: a/t', 'covers: b/t')
					.replace('[c2]', '[c4]'),
				'data/areas/a/lessons/p.yaml': PLANNED.replace('id: a/p', 'id: a/q')
					.replace('covers: a/t', 'covers: b/t')
					.replace('[c2]', '[c1, zz]')
					.replace('after: [a/x]', 'after: [a/gone]')
					.replace('[{objective: a/c/o}]', '[{objective: a/c/nope}]')
					.replace('minutes: 10', 'minutes: 10\nserves: [a/c/nope]\nsources: [Nope]'),
			}),
		);
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: id is "a/q", expected a/p');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: covers b/t, a topic of another area');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: serves "a/c/nope" is not an objective id');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: assumes "a/c/nope" is not an objective id');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: after "a/gone" is not a lesson of this area');
		// Lesson files are read in name order, so p (id a/q) introduces c1 first and x is the repeat.
		expect(errors).toContain('src/data/areas/a/lessons/x.yaml: introduces c1, which a/q also introduces');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: introduces "zz" is not a concept id');
		expect(errors).toContain('src/data/areas/a/lessons/p.yaml: sources "Nope" is not a bibliography key');
		expect(
			check(tree({ 'data/areas/a/lessons/p.yaml': PLANNED.replace('covers: a/t', 'covers: a/nope') })).errors,
		).toContain('src/data/areas/a/lessons/p.yaml: covers "a/nope" is not a topic id');
	});
	it('fails a page that cites a key its plan file does not list, and passes one whose citations all match', () => {
		const { errors } = check(
			tree({ 'content/a/x.mdx': 'Cited (@AEC-01) and again (@AEC-01), then (@Claude Code permission modes).\n' }),
		);
		expect(errors).toEqual([
			'src/content/docs/a/x.mdx: cites "Claude Code permission modes", which its plan file\'s sources list lacks',
		]);
		expect(check(tree({ 'content/a/x.mdx': 'Cited (@AEC-01) and again (@ AEC-01 ).\n' })).errors).toEqual([]);
	});
	it('warns, without failing, about a concept no lesson introduces', () => {
		const r = check(tree({ 'data/areas/a/lessons/p.yaml': PLANNED.replace('introduces: [c2]', 'introduces: []') }));
		expect(r.errors).toEqual([]);
		expect(r.warnings).toEqual(['src/data/areas/a: no lesson introduces the concept c2 (a/t)']);
	});
	it('reports a live lesson without a description or with an assumes entry lacking lesson and section', () => {
		const { errors } = check(
			tree({
				'data/areas/a/lessons/x.yaml': LIVE.replace('description: d\n', '').replace(', lesson: a/p, section: s', ''),
			}),
		);
		expect(errors).toEqual([
			'src/data/areas/a/lessons/x.yaml: the lesson is live, so it needs a description',
			'src/data/areas/a/lessons/x.yaml: assumes a/c/o without the lesson and section that teach it, which a live lesson needs',
		]);
	});
	it('reports a lesson that sets sources-checked or review-by without the other, and passes both or neither', () => {
		const both = `${LIVE}sources-checked: 2026-09-20\nreview-by: 2027-03-20\n`;
		expect(check(tree({ 'data/areas/a/lessons/x.yaml': both })).errors).toEqual([]);
		expect(check(tree({ 'data/areas/a/lessons/x.yaml': `${LIVE}sources-checked: 2026-09-20\n` })).errors).toEqual([
			'src/data/areas/a/lessons/x.yaml: sets sources-checked without review-by, which spec S11 pairs with it',
		]);
		expect(check(tree({ 'data/areas/a/lessons/p.yaml': `${PLANNED}review-by: 2027-03-20\n` })).errors).toEqual([
			'src/data/areas/a/lessons/p.yaml: sets review-by without sources-checked, which spec S11 pairs with it',
		]);
		const same = `${LIVE}sources-checked: 2026-09-20\nreview-by: 2026-09-20\n`;
		expect(check(tree({ 'data/areas/a/lessons/x.yaml': same })).errors).toEqual([
			'src/data/areas/a/lessons/x.yaml: review-by 2026-09-20 is not after sources-checked 2026-09-20',
		]);
	});
	it('reports a lesson page without a lesson file, and frontmatter that the data owns', () => {
		const { errors } = check(
			tree({
				'content/a/y.mdx': PAGE,
				'content/a/x.mdx':
					'---\ntitle: X\nmode: tutorial\nsources-checked: 2026-09-20\nlastUpdated: 2026-10-01\nsidebar:\n  order: 1\n---\n\nBody.\n',
				'content/a/index.mdx': '---\ntitle: Course\n---\n',
			}),
		);
		expect(errors).toEqual([
			'src/content/docs/a/x.mdx: frontmatter sets title, mode, sources-checked, lastUpdated, which the lesson file owns',
			'src/content/docs/a/y.mdx: lesson page without a lesson file at src/data/areas/a/lessons/y.yaml',
			'src/content/docs/a/index.mdx: frontmatter sets title, which area.yaml owns',
		]);
	});
});

describe('helpers', () => {
	it('reviewDatePairError is null for both or neither date and names the missing one otherwise', () => {
		expect(reviewDatePairError({})).toBeNull();
		expect(reviewDatePairError(undefined)).toBeNull();
		expect(reviewDatePairError({ 'sources-checked': '2026-09-20', 'review-by': '2027-03-20' })).toBeNull();
		expect(reviewDatePairError({ 'sources-checked': '2026-09-20' })).toMatch(/without review-by/);
		expect(reviewDatePairError({ 'review-by': '2027-03-20' })).toMatch(/without sources-checked/);
		expect(reviewDatePairError({ 'sources-checked': '2026-09-20', 'review-by': '2026-09-19' })).toMatch(/not after/);
		expect(reviewDatePairError({ 'sources-checked': 'soon', 'review-by': '2027-03-20' })).toBeNull();
	});
	it('frontmatter parses the YAML block and returns {} without one', () => {
		expect(frontmatter('---\ntitle: X\n---\n\nBody.\n')).toEqual({ title: 'X' });
		expect(frontmatter('# no frontmatter\n')).toEqual({});
		expect(frontmatter('---\n\n---\n')).toEqual({});
	});
	it('lessonPages lists <area>/<lesson>.mdx under a known area only', () => {
		const root = tree({ 'content/a/notes.md': PAGE, 'content/a/deep/x.mdx': PAGE });
		expect([...lessonPages(join(root, 'content'), new Set(['a'])).keys()]).toEqual(['a/x']);
		expect(lessonPages(join(root, 'nowhere'), new Set(['a'])).size).toBe(0);
	});
	it('knownIds collects topic and objective ids', () => {
		const { topicIds, objectiveIds } = knownIds(join(tree(), 'data'));
		expect([...topicIds]).toEqual(['a/t']);
		expect([...objectiveIds]).toEqual(['a/c/o']);
	});
	it('readAreaTree lists areas in group order, then unlisted directories, and tolerates a bare tree', () => {
		const root = tree({
			'data/groups.yaml': `- id: z\n  order: 2\n  name: Z\n  areas: [c]\n${GROUPS.replace('[a]', '[b, a]')}`,
			'data/areas/b/area.yaml': AREA.replace('id: a', 'id: b'),
			'data/areas/c/area.yaml': AREA.replace('id: a', 'id: c'),
			'data/areas/d/area.yaml': AREA.replace('id: a', 'id: d'),
		});
		const t = readAreaTree(join(root, 'data'));
		// Groups sort by `order`, so g (order 1) comes before z (order 2), and no group names d.
		expect(t.areas.map((a) => a.dir)).toEqual(['b', 'a', 'c', 'd']);
		expect(allTopics(t).map((x) => x.id)).toEqual(['a/t']);
		expect(allLessons(t).map((x) => x.id)).toEqual(['a/p', 'a/x']);
		expect([...t.bibliographyKeys]).toEqual(['AEC-01']);
		const bare = readAreaTree(join(root, 'nowhere'));
		expect(bare).toEqual({ groups: [], areas: [], alignment: [], bibliographyKeys: new Set() });
		expect(yamlFilesIn(join(root, 'nowhere'))).toEqual([]);
	});
	it('courseLessonIds reads the flat list or the parts, and nothing from neither', () => {
		expect(courseLessonIds({ lessons: ['a/x'] })).toEqual(['a/x']);
		expect(
			courseLessonIds({
				parts: [
					{ title: 'P', lessons: ['a/x'] },
					{ title: 'Q', lessons: ['a/y'] },
				],
			}),
		).toEqual(['a/x', 'a/y']);
		expect(courseLessonIds({})).toEqual([]);
	});
});
