import { examplesOf, isLessonEntry, lessonTocGroups, showToc } from '@lib/lesson-toc';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';
import { type DocFixture, docs } from './content';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const asLesson = (d: DocFixture): Lesson => d as unknown as Lesson;
const body = (b: string): Lesson => asLesson({ id: 'x/y', data: { title: 'X', mode: 'tutorial' }, body: b });

const checkpoint = `<Choice id="cp" title="A choice" objective="o1" hint="h" concepts={['token']} options={[{ text: 'a', correct: true }, { text: 'b' }]} />`;
const example = `<Predict id="ex" title="Run it" answer="1 > 0" run="x/y.py" canonical
  >Stem.</Predict>`;

describe('examplesOf', () => {
	it('returns the Predict tags without an objective, in page order, with the title defaulting to the id', () => {
		const src = `${example}\n\n<Predict id="graded" objective="o1" title="Graded" hint="h" concepts={['token']} answer="x" />\n\n<Predict id="plain" answer={'a}b'} run="p.py"/>`;
		expect(examplesOf(src, 'x/y')).toEqual([
			{ id: 'ex', title: 'Run it' },
			{ id: 'plain', title: 'plain' },
		]);
	});
	it('reads a title given as an expression, decodes an entity, and reads a string value that contains >', () => {
		const src = `<Predict id="a" title={'Run it'} answer="a > b" run="p.py" />\n\n<Predict id="b" title="Bob&apos;s run" answer="1" run="p.py" />`;
		expect(examplesOf(src, 'x/y')).toEqual([
			{ id: 'a', title: 'Run it' },
			{ id: 'b', title: "Bob's run" },
		]);
	});
	it('ignores a Predict in a fenced code block or a comment, and other tags', () => {
		const src =
			'```mdx\n<Predict id="fenced" answer="1" run="p.py" />\n```\n\n{/* <Predict id="noted" answer="1" run="p.py" /> */}\n\n<Prediction id="n" />';
		expect(examplesOf(src, 'x/y')).toEqual([]);
	});
	it('rejects a tag without an id, a non-string title, a spread prop, and an unclosed tag', () => {
		expect(() => examplesOf('<Predict title="t" answer="a" run="r" />', 'x/y')).toThrow(
			/x\/y: <Predict> without an id/,
		);
		expect(() => examplesOf('<Predict id="a" title={3} answer="a" run="r" />', 'x/y')).toThrow(
			/x\/y#a: title must be a string, got number/,
		);
		expect(() => examplesOf('<Predict id="a" {...rest} />', 'x/y')).toThrow(/has a spread prop/);
		expect(() => examplesOf('<Predict id="a">', 'x/y')).toThrow(/^x\/y: /);
	});
});

describe('lessonTocGroups', () => {
	it('lists the checkpoints then the examples, and drops an empty group', () => {
		expect(lessonTocGroups(body(`${checkpoint}\n\n${example}`))).toEqual([
			{ label: 'Checkpoints', slug: 'checkpoints', entries: [{ id: 'cp', title: 'A choice' }] },
			{ label: 'Examples', slug: 'examples', entries: [{ id: 'ex', title: 'Run it' }] },
		]);
		expect(lessonTocGroups(body(example)).map((g) => g.label)).toEqual(['Examples']);
		expect(lessonTocGroups(body(checkpoint)).map((g) => g.label)).toEqual(['Checkpoints']);
		expect(lessonTocGroups(body('## Just prose'))).toEqual([]);
	});
	it('reads the fixture lesson the export reads', () => {
		const lesson = asLesson(docs.find((d) => d.id === 'concepts/how-models-work') as DocFixture);
		const groups = lessonTocGroups(lesson);
		expect(groups.map((g) => [g.label, g.entries.map((e) => e.id)])).toEqual([
			['Checkpoints', ['what-the-model-does', 'honor', 'graded', 'fix', 'opt-out']],
			['Examples', ['shown']],
		]);
	});
	it('rejects an id used by a checkpoint and an example, through the checkpoint reader', () => {
		const dup = example.replace('id="ex"', 'id="cp"');
		expect(() => lessonTocGroups(body(`${checkpoint}\n\n${dup}`))).toThrow(/x\/y: id "cp" is used twice/);
	});
});

describe('isLessonEntry and showToc', () => {
	const entry = (mode?: string) => ({ id: 'x/y', data: { mode } }) as unknown as Parameters<typeof isLessonEntry>[0];
	it('a docs entry is a lesson when it has a mode', () => {
		expect(isLessonEntry(entry('tutorial'))).toBe(true);
		expect(isLessonEntry(entry())).toBe(false);
	});
	it('hides the menu without toc data or when the page title would be its only entry, unless a group has entries', () => {
		const group = { label: 'Checkpoints' as const, slug: 'checkpoints' as const, entries: [{ id: 'a', title: 'A' }] };
		expect(showToc(undefined, [group])).toBe(false);
		expect(showToc({ items: [{ children: [] }] }, [])).toBe(false);
		expect(showToc({ items: [{ children: [] }] }, [group])).toBe(true);
		expect(showToc({ items: [{ children: [{}] }] }, [])).toBe(true);
	});
});
