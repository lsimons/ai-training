import {
	type BundleSources,
	buildLessonBundles,
	bundleOf,
	lessonUrl,
	proseOf,
	setAsideCode,
} from '@lib/lesson-bundles';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';
import { competencies, docs, topics } from './content';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const site = 'https://lsimons.github.io';
const ROOT = 'https://lsimons.github.io/ai-training';

describe('lessonUrl', () => {
	it('is the lesson page under site and base', () => {
		expect(lessonUrl('safety/agent-risk', site)).toBe(`${ROOT}/safety/agent-risk/`);
	});
});

describe('setAsideCode', () => {
	it('sets fenced blocks and inline code aside and restores them byte for byte', () => {
		const src = 'A `<Tool>` here.\n\n````md\n```\ninner\n```\n````\n\n~~~ts\nPromise<X[]>\n~~~\nEnd.';
		const { text, restore } = setAsideCode(src);
		expect(text).not.toContain('<Tool>');
		expect(text).not.toContain('Promise');
		expect(text).not.toContain('inner');
		expect(restore(text)).toBe(src);
	});
	it('sets a code span that wraps across a line break aside, but not one across a blank line', () => {
		const wrapped = 'See `a\n<Tag>` here.';
		const { text, restore } = setAsideCode(wrapped);
		expect(text).not.toContain('<Tag>');
		expect(restore(text)).toBe(wrapped);
		const paragraphs = 'Odd ` tick.\n\nAnother ` tick.';
		expect(setAsideCode(paragraphs).text).toBe(paragraphs);
	});
	it('sets a double-backtick span with a backtick inside aside', () => {
		const src = 'Use ``a ` <Tag>`` here.';
		const { text, restore } = setAsideCode(src);
		expect(text).not.toContain('<Tag>');
		expect(restore(text)).toBe(src);
	});
	it('a stray backtick before a blank line does not shift the spans of the next paragraph', () => {
		const src = 'Stray ` here.\n\nA `<Tag>` span, and <Real /> after.';
		const { text, restore } = setAsideCode(src);
		expect(text).not.toContain('<Tag>');
		expect(text).toContain('<Real />');
		expect(text).toContain('Stray ` here.');
		expect(restore(text)).toBe(src);
	});
	it('does not pair the backticks of template-literal attributes on adjacent lines as a span', () => {
		const tag = '<Repair broken={`# a\n\nb`}\n  model={`# c\n\nd`}>\nWhy?\n</Repair>';
		expect(setAsideCode(tag).text).toBe(tag);
	});
	it('leaves an unclosed fence as code to the end', () => {
		const { text, restore } = setAsideCode('```\nopen\n<Tag>');
		expect(text).toMatch(/^\uE000\d+\uE001$/);
		expect(restore(text)).toBe('```\nopen\n<Tag>');
	});
});

describe('proseOf', () => {
	it('keeps a run of blank lines inside a fenced block and collapses one outside', () => {
		const block = '```python\nimport os\n\n\ndef f():\n    pass\n```';
		expect(proseOf(`Before.\n\n\n\n${block}\n\n\n\nAfter.\n`, site)).toBe(`Before.\n\n${block}\n\nAfter.\n`);
	});
	it('drops the import block, omits widgets, and renders components to Markdown', () => {
		const md = proseOf(
			[
				"import { Choice, Pitfall, Exercise, Recap } from '@components/lesson';",
				"import Sampler from '@components/widgets/Sampler.astro';",
				'',
				'Intro with a [link](/glossary/#token) and ![img](/pic.png).',
				'',
				'<Sampler />',
				'',
				'<Pitfall title="Asking why">',
				'The model has no log.',
				'</Pitfall>',
				'',
				'<Choice id="c1" objective="o1" title="Pick one" hint="h" concepts={[\'token\']} options={[{ text: \'a > b\', correct: true }]}>',
				'Which is it?',
				'</Choice>',
				'',
				'<Predict id="ex" title="Shown" answer="2" run="y.py">',
				'Run this.',
				'</Predict>',
				'',
				'<Exercise stretch="Try more.">',
				'Do the thing.',
				'</Exercise>',
				'',
				'<Recap>',
				'',
				'1. One.',
				'',
				'</Recap>',
				'',
				'<a href="/ai-training/guides/">raw</a>',
			].join('\n'),
			site,
		);
		expect(md).toBe(
			[
				`Intro with a [link](${ROOT}/glossary/#token) and ![img](${ROOT}/pic.png).`,
				'',
				'#### Pitfall: Asking why',
				'',
				'The model has no log.',
				'',
				'#### Checkpoint: Pick one',
				'',
				'Which is it?',
				'',
				'#### Example: Shown',
				'',
				'Run this.',
				'',
				'## Exercise',
				'',
				'Do the thing.',
				'',
				'Stretch: Try more.',
				'',
				'## Recap',
				'',
				'1. One.',
				'',
				`<a href="${ROOT}/guides/">raw</a>`,
				'',
			].join('\n'),
		);
	});
	it('fences Prompt and Response with a fence longer than any inside, and keeps the illustrative caption', () => {
		const md = proseOf(
			'<Prompt model="illustrative" recorded="illustrative">\nSay:\n\n```python\nprint(1)\n```\n</Prompt>\n<Response>\nOk.\n</Response>\n',
			site,
		);
		expect(md).toBe(
			'#### Prompt (illustrative, not a recorded transcript)\n\n````text\nSay:\n\n```python\nprint(1)\n```\n````\n\n#### Response\n\n```text\nOk.\n```\n',
		);
		expect(proseOf('<Prompt model="claude-x" recorded="2026-09">\nHi.\n</Prompt>\n', site)).toBe(
			'#### Prompt · claude-x, recorded 2026-09\n\n```text\nHi.\n```\n',
		);
	});
	it('leaves a link inside a Prompt or Response body alone, in a code span or not', () => {
		expect(proseOf('<Response>\nSee `[a](/x/)` and [b](/y/).\n</Response>\n', site)).toBe(
			'#### Response\n\n```text\nSee `[a](/x/)` and [b](/y/).\n```\n',
		);
	});
	it('copies code unchanged: imports, tags, XML and links inside fences or code spans', () => {
		const src = [
			"import { Pitfall } from '@components/lesson';",
			'',
			'Use `<Tool>` and `[b](/guides/y/)` as written.',
			'',
			'```python',
			'import fnmatch',
			'',
			'def f(): return fnmatch.fnmatchcase("a", "a")',
			'```',
			'',
			'```ts',
			'const p: Promise<LessonBundle[]> = build();',
			'```',
			'',
			'```xml',
			'<Doc><Title>x</Title></Doc>',
			'```',
			'',
			'```md',
			'[see](/guides/z/)',
			'```',
			'',
			'<Pitfall title="Real">',
			'Text with `<API>` and a [link](/guides/x/).',
			'</Pitfall>',
		].join('\n');
		const md = proseOf(src, site);
		expect(md).toBe(
			[
				'Use `<Tool>` and `[b](/guides/y/)` as written.',
				'',
				'```python',
				'import fnmatch',
				'',
				'def f(): return fnmatch.fnmatchcase("a", "a")',
				'```',
				'',
				'```ts',
				'const p: Promise<LessonBundle[]> = build();',
				'```',
				'',
				'```xml',
				'<Doc><Title>x</Title></Doc>',
				'```',
				'',
				'```md',
				'[see](/guides/z/)',
				'```',
				'',
				'#### Pitfall: Real',
				'',
				`Text with \`<API>\` and a [link](${ROOT}/guides/x/).`,
				'',
			].join('\n'),
		);
	});
	it('keeps the children of an unknown component and rejects an unclosed one, naming the lesson', () => {
		expect(proseOf('<Aside>\nKept.\n</Aside>\n', site)).toBe('Kept.\n');
		expect(() => proseOf('<Pitfall title="x">\nno end\n', site, 'a/b')).toThrow(
			/^a\/b: Expected a closing tag for `<Pitfall>`/,
		);
	});
	it('reads the tags from the MDX tree: raw HTML stays, a component inside it renders, and a prop must be a literal', () => {
		expect(proseOf('<div class="x">\n<Pitfall title="In">\nText.\n</Pitfall>\n</div>\n', site)).toBe(
			'<div class="x">\n\n#### Pitfall: In\n\nText.\n\n</div>\n',
		);
		expect(proseOf('<Pitfall title={`Tick`}>\nT.\n</Pitfall>\n', site)).toBe('#### Pitfall: Tick\n\nT.\n');
		expect(() => proseOf('<Pitfall title={1}>\nT.\n</Pitfall>\n', site, 'a/b')).toThrow(
			/^a\/b <Pitfall>: title must be a string, got number/,
		);
		expect(() => proseOf('<Sampler seed={seed} />\n', site, 'a/b')).toThrow(
			/^a\/b: cannot read seed=\{\.\.\.\} of <Sampler>: Identifier is not a literal/,
		);
	});
});

describe('bundleOf and buildLessonBundles', () => {
	it('builds one bundle per live lesson, in id order, with an id equal to its path', async () => {
		const bundles = await buildLessonBundles(site);
		expect(bundles.map((b) => b.id)).toEqual(['concepts/how-models-work', 'safety/agent-risk', 'safety/deeper']);
		for (const b of bundles) {
			expect(b.version).toBe(1);
			expect(b.url).toBe(`${ROOT}/${b.id}/`);
			expect(JSON.parse(JSON.stringify(b))).toEqual(b);
		}
	});
	it('copies the topic, objectives, checkpoints and assumes with absolute URLs', async () => {
		const [models, risk, deeper] = await buildLessonBundles(site);
		expect(models).toMatchObject({
			title: 'How a language model works',
			mode: 'explanation',
			topics: [{ id: 'concepts/models', name: 'Models', url: `${ROOT}/topics/concepts/models/` }],
			objectives: [
				{
					id: 'o1',
					statement: 'Explains generation',
					level: 'base',
					competency_url: `${ROOT}/competencies/concepts/explains-models/#o1`,
					behaviors: [],
				},
			],
			assumes: [],
			extends_to: [],
		});
		expect(models?.topics[0]?.concepts.map((c) => c.id)).toEqual(['token', 'context-window']);
		expect(models?.checkpoints.map((c) => c.id)).toEqual(['what-the-model-does', 'honor', 'graded', 'fix', 'opt-out']);
		expect(models?.checkpoints[0]).not.toHaveProperty('lesson');
		expect(models?.checkpoints[0]).toMatchObject({ kind: 'choice', options: ['a', 'b > c'], answer: 'a', revision: 1 });
		expect(models?.prose).toContain('#### Checkpoint: What the model does');
		expect(models?.prose).toContain('## Recap');
		expect(risk?.assumes).toEqual([
			{ objective: 'o1', lesson: 'concepts/how-models-work', section: 's', url: `${ROOT}/concepts/how-models-work/#s` },
		]);
		expect(risk?.prose).toContain(
			'#### Prompt (illustrative, not a recorded transcript)\n\n```text\nSummarize the memo.\n\n- Keep every date.',
		);
		expect(deeper?.checkpoints).toEqual([]);
		expect(deeper?.topics.map((t) => t.id)).toEqual(['safety/depth']);
	});
	it('rejects a lesson whose topic or objective is unknown, and handles a bare assumes entry', () => {
		const sources: BundleSources = {
			topics: topics.map((t) => ({ ...t.data, definition: 'd' })),
			competencies: competencies.map((c) => c.data) as BundleSources['competencies'],
			items: [],
			lessonIds: new Set(['concepts/how-models-work']),
			site,
		};
		const base = docs.find((d) => d.id === 'safety/agent-risk') as unknown as Lesson;
		const lesson = (data: object): Lesson => ({ ...base, data: { ...base.data, ...data } }) as Lesson;
		expect(() => bundleOf(lesson({ covers: 'nowhere/none' }), sources)).toThrow(/covers nowhere\/none/);
		expect(() => bundleOf(lesson({ serves: ['o9'] }), sources)).toThrow(/serves o9/);
		expect(() => bundleOf(lesson({ assumes: [{ objective: 'o1', lesson: 'concepts/gone' }] }), sources)).toThrow(
			/assumes o1 from concepts\/gone, which is not a lesson page/,
		);
		const bare = bundleOf(
			lesson({ assumes: [{ objective: 'o1' }], 'extends-to': [{ label: 'Next', href: '/safety/deeper/' }] }),
			sources,
		);
		expect(bare.assumes).toEqual([{ objective: 'o1', lesson: null, section: null, url: null }]);
		expect(bare.extends_to).toEqual([{ label: 'Next', url: `${ROOT}/safety/deeper/` }]);
		// An external entry (an https:// URL under a bibliography url) is passed through as is.
		const academy = 'https://academy.claude.com/courses/ai-capabilities-and-limitations';
		const external = bundleOf(lesson({ 'extends-to': [{ label: 'Academy', href: academy }] }), sources);
		expect(external.extends_to).toEqual([{ label: 'Academy', url: academy }]);
	});
});
