import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
	liveCourseLessonIds,
	liveLessons,
	liveTopicLessonIds,
	pageCheckpoints,
} from '../../scripts/lib/live-lessons.mjs';

const roots: string[] = [];
afterAll(() => {
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const GROUPS = '- id: g\n  order: 1\n  name: G\n  audience: Everyone\n  description: d\n  areas: [a, b]\n';
const lesson = (area: string, stem: string, topic: string) =>
	`id: ${area}/${stem}\ntitle: T\nmode: tutorial\ncovers: ${area}/${topic}\nintroduces: []\nassumes: []\nexercise: {kind: do, brief: b}\nminutes: 10\n`;
const PAGE =
	'<Choice id="one" objective="o" title="T" hint="h" concepts={[\'c1\']}\n  options={[{ text: \'a\', correct: true }]}>\nStem.\n</Choice>\n\n<Predict id="shown" title="Shown" answer="1" run="x.py">\nAn example.\n</Predict>\n\n<Order id="two" objective="o" title="T" hint="h" concepts={[\'c1\']} items={[]} />\n';

/**
 * Two areas. Area `a` has a course in parts listing four lessons, of which `x`, `y` and `z` have a page
 * (`x` and `y` cover topic `t`, `z` covers `u`) and `p` is planned. Area `b` has a flat course with one live lesson.
 */
function tree(files: Record<string, string | null> = {}) {
	const root = mkdtempSync(join(tmpdir(), 'live-'));
	roots.push(root);
	const all: Record<string, string | null> = {
		'data/groups.yaml': GROUPS,
		'data/areas/a/area.yaml': 'id: a\nname: A\ngroup: g\ndescription: d\n',
		'data/areas/a/courses/a.yaml':
			'id: a\narea: a\nparts:\n  - title: One\n    lessons: [a/x, a/p]\n  - title: Two\n    lessons: [a/z, a/y]\n',
		'data/areas/a/lessons/x.yaml': lesson('a', 'x', 't'),
		'data/areas/a/lessons/y.yaml': lesson('a', 'y', 't'),
		'data/areas/a/lessons/z.yaml': lesson('a', 'z', 'u'),
		'data/areas/a/lessons/p.yaml': lesson('a', 'p', 'u'),
		'data/areas/b/area.yaml': 'id: b\nname: B\ngroup: g\ndescription: d\n',
		'data/areas/b/courses/b.yaml': 'id: b\narea: b\nlessons: [b/q]\n',
		'data/areas/b/lessons/q.yaml': lesson('b', 'q', 'v'),
		'content/a/x.mdx': PAGE,
		'content/a/y.mdx': 'Body.\n',
		'content/a/z.mdx': 'Body.\n',
		'content/a/index.mdx': 'Course intro.\n',
		'content/b/q.mdx': 'Body.\n',
		...files,
	};
	for (const [rel, body] of Object.entries(all)) {
		if (body === null) continue;
		mkdirSync(dirname(join(root, rel)), { recursive: true });
		writeFileSync(join(root, rel), body);
	}
	return { data: join(root, 'data'), content: join(root, 'content') };
}

describe('liveLessons', () => {
	it('lists the lessons with a page, in course order, with their area and topic', () => {
		const { data, content } = tree();
		expect(liveLessons(data, content)).toEqual([
			{ id: 'a/x', area: 'a', topic: 'a/t' },
			{ id: 'a/z', area: 'a', topic: 'a/u' },
			{ id: 'a/y', area: 'a', topic: 'a/t' },
			{ id: 'b/q', area: 'b', topic: 'b/v' },
		]);
	});

	it('leaves out a page whose lesson is in no course', () => {
		const { data, content } = tree({ 'content/a/stray.mdx': 'Body.\n' });
		expect(liveLessons(data, content).map((l) => l.id)).not.toContain('a/stray');
	});

	it('gives an empty topic to a lesson listed without a lesson file', () => {
		const { data, content } = tree({ 'data/areas/a/lessons/y.yaml': null });
		expect(liveLessons(data, content).find((l) => l.id === 'a/y')).toEqual({ id: 'a/y', area: 'a', topic: '' });
	});

	it('is empty without a content directory', () => {
		const { data } = tree();
		expect(liveLessons(data, join(data, 'missing'))).toEqual([]);
	});
});

describe('liveCourseLessonIds and liveTopicLessonIds', () => {
	it('filter by area and by topic', () => {
		const { data, content } = tree();
		expect(liveCourseLessonIds(data, content, 'a')).toEqual(['a/x', 'a/z', 'a/y']);
		expect(liveCourseLessonIds(data, content, 'b')).toEqual(['b/q']);
		expect(liveCourseLessonIds(data, content, 'none')).toEqual([]);
		expect(liveTopicLessonIds(data, content, 'a/t')).toEqual(['a/x', 'a/y']);
		expect(liveTopicLessonIds(data, content, 'a/u')).toEqual(['a/z']);
	});
});

describe('pageCheckpoints', () => {
	it('lists the graded checkpoints with their kind and skips an example', () => {
		const { content } = tree();
		expect(pageCheckpoints(content, 'a/x')).toEqual([
			{ id: 'one', kind: 'choice', phase: 'first' },
			{ id: 'two', kind: 'order', phase: 'first' },
		]);
	});

	it('lists a practice checkpoint with its phase and leaves out a hidden review alternate', () => {
		const { content } = tree({
			'content/a/y.mdx': [
				'<Choice id="one" objective="o" title="T" hint="h" concepts={[\'c1\']} options={[]}>S</Choice>',
				'<Choice id="alt" phase="review" objective="o" title="T" hint="h" concepts={[\'c1\']} options={[]}>S</Choice>',
				'<Exercise>\nDo it.\n</Exercise>',
				'<MorePractice>\n<Choice id="more" phase="practice" objective="o" title="T" hint="h" concepts={[\'c1\']} options={[]}>S</Choice>\n</MorePractice>',
				'',
			].join('\n\n'),
		});
		expect(pageCheckpoints(content, 'a/y')).toEqual([
			{ id: 'one', kind: 'choice', phase: 'first' },
			{ id: 'more', kind: 'choice', phase: 'practice' },
		]);
	});

	it('is empty for a page without checkpoints', () => {
		const { content } = tree();
		expect(pageCheckpoints(content, 'a/y')).toEqual([]);
	});

	it('throws on a checkpoint without a string id', () => {
		const { content } = tree({
			'content/a/y.mdx':
				'<Choice id={\'x\'} objective="o" title="T" hint="h" concepts={[\'c1\']} options={[]}>S</Choice>\n',
		});
		expect(() => pageCheckpoints(content, 'a/y')).toThrow('a/y: <Choice> without an id="..."');
	});
});
