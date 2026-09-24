import {
	absoluteUrl,
	buildLessonBundles,
	bundleOf,
	type BundleSources,
	lessonUrl,
	proseOf,
	type SiteInfo,
} from '@lib/lesson-bundles';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';
import { competencies, docs, topics } from './content';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

const site: SiteInfo = { site: 'https://lsimons.github.io', base: '/ai-training' };
const ROOT = 'https://lsimons.github.io/ai-training';

describe('absoluteUrl and lessonUrl', () => {
	it('prepends site and base once, and leaves a URL with a scheme alone', () => {
		expect(absoluteUrl('/guides/tutor/', site)).toBe(`${ROOT}/guides/tutor/`);
		expect(absoluteUrl('/ai-training/guides/tutor/', site)).toBe(`${ROOT}/guides/tutor/`);
		expect(absoluteUrl('/ai-training', site)).toBe(ROOT);
		expect(absoluteUrl('https://example.com/x', site)).toBe('https://example.com/x');
		expect(absoluteUrl('mailto:a@b.c', site)).toBe('mailto:a@b.c');
		expect(() => absoluteUrl('guides/', site)).toThrow(/root-relative/);
		expect(lessonUrl('safety/agent-risk', site)).toBe(`${ROOT}/safety/agent-risk/`);
	});
});

describe('proseOf', () => {
	it('drops imports, omits widgets, and renders components to Markdown', () => {
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
	it('fences Prompt and Response with a fence longer than any inside them', () => {
		const md = proseOf(
			'<Prompt model="illustrative">\nSay:\n\n```python\nprint(1)\n```\n</Prompt>\n<Response>\nOk.\n</Response>\n',
			site,
		);
		expect(md).toBe(
			'#### Prompt\n\n````text\nSay:\n\n```python\nprint(1)\n```\n````\n\n#### Response\n\n```text\nOk.\n```\n',
		);
	});
	it('keeps the children of an unknown component and rejects an unclosed one', () => {
		expect(proseOf('<Aside>\nKept.\n</Aside>\n', site)).toBe('Kept.\n');
		expect(() => proseOf('<Pitfall title="x">\nno end\n', site)).toThrow(/unclosed <Pitfall>/);
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
		expect(risk?.prose).toContain('#### Prompt\n\n```text\nSummarize the memo.\n\n- Keep every date.');
		expect(deeper?.checkpoints).toEqual([]);
	});
	it('rejects a lesson whose topic or objective is unknown, and handles a bare assumes entry', () => {
		const sources = {
			topics: topics.map((t) => ({ ...t.data, definition: 'd' })),
			competencies: competencies.map((c) => c.data) as BundleSources['competencies'],
			items: [],
			site,
		};
		const base = docs.find((d) => d.id === 'safety/agent-risk') as unknown as Lesson;
		const lesson = (data: object): Lesson => ({ ...base, data: { ...base.data, serves: [], ...data } }) as Lesson;
		expect(() => bundleOf(lesson({ covers: 'nowhere/none' }), sources)).toThrow(/covers nowhere\/none/);
		expect(() => bundleOf(lesson({ serves: ['o9'] }), sources)).toThrow(/serves o9/);
		const bare = bundleOf(
			lesson({ assumes: [{ objective: 'o1' }], 'extends-to': [{ label: 'Next', href: '/safety/deeper/' }] }),
			sources,
		);
		expect(bare.assumes).toEqual([{ objective: 'o1', lesson: null, section: null, url: null }]);
		expect(bare.extends_to).toEqual([{ label: 'Next', url: `${ROOT}/safety/deeper/` }]);
	});
});
