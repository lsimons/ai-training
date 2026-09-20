/**
 * A stand-in for `astro:content`. `getViteConfig` does not sync the content
 * layer, so `getCollection()` returns nothing under Vitest. A test that
 * needs lessons calls `vi.mock('astro:content', () => mockContent())` with
 * the fixtures below (or its own).
 */
import { vi } from 'vitest';

export interface DocFixture {
	id: string;
	body?: string;
	data: {
		title: string;
		mode?: 'tutorial' | 'explanation';
		assumes?: { objective: string; lesson: string; section: string }[];
		covers?: string[];
	};
}

export interface TopicFixture {
	id: string;
	data: {
		id: string;
		area: string;
		name: string;
		concepts: { id: string; name: string; definition: string }[];
		links: { prerequisites: string[] };
	};
}

export const docs: DocFixture[] = [
	{ id: 'index', data: { title: 'Home' } },
	{ id: 'concepts/index', data: { title: 'Concepts' } },
	{
		id: 'concepts/how-models-work',
		data: { title: 'How a language model works', mode: 'explanation', covers: ['concepts/models'] },
		body: `
<Choice id="what-the-model-does" objective="o1" title="What the model does" hint="h"
  concepts={['token', 'context-window']} context="The lesson shows a widget."
  options={[{ text: 'a', correct: true }, { text: 'b > c', why: 'No.' }]}>
Stem.
</Choice>
<Predict id="honor" objective="o1" title="Run it" hint="h" concepts={['token']}>
</Predict>
<Predict id="graded" objective="o1" title="Graded" hint="h" concepts={['token']} answer="1 > 0" run="x.sh" revision={2}>
</Predict>
<Repair id="fix" objective="o1" title="Fix" hint="h" concepts={['token']} broken="a" model="b">
</Repair>
<Order id="opt-out" objective="o1" title="Order" hint="h" concepts={['token']} review={false} steps={['b', 'a']}>
</Order>
`,
	},
	{
		id: 'safety/agent-risk',
		data: {
			title: 'Why agent safety is different',
			mode: 'tutorial',
			assumes: [{ objective: 'o1', lesson: 'concepts/how-models-work', section: 's' }],
		},
		body: '<Scenario id="s1" objective="o1" title="S" hint="h" concepts={[\'risk\']} options={[]}>\n</Scenario>',
	},
	{
		id: 'safety/deeper',
		data: {
			title: 'Deeper',
			mode: 'tutorial',
			assumes: [
				{ objective: 'o1', lesson: 'safety/agent-risk', section: 's' },
				{ objective: 'o1', lesson: 'nowhere/none', section: 's' },
			],
		},
		body: '',
	},
];

export const topics: TopicFixture[] = [
	{
		id: 'concepts/models',
		data: {
			id: 'concepts/models',
			area: 'concepts',
			name: 'Models',
			concepts: [
				{ id: 'token', name: 'Token', definition: 'A chunk of text.' },
				{ id: 'context-window', name: 'Context window', definition: 'What the model can see.' },
			],
			links: { prerequisites: [] },
		},
	},
	{
		id: 'safety/risk',
		data: {
			id: 'safety/risk',
			area: 'safety',
			name: 'Risk',
			concepts: [{ id: 'risk', name: 'Risk', definition: 'What can go wrong.' }],
			links: { prerequisites: ['concepts/models'] },
		},
	},
	// No lesson covers it and no plan entry names it: the topic map's gap state.
	{
		id: 'safety/governance',
		data: { id: 'safety/governance', area: 'safety', name: 'Governance', concepts: [], links: { prerequisites: [] } },
	},
];

export interface CourseFixture {
	id: string;
	data: {
		area: string;
		lessons: {
			id: string;
			title: string;
			covers: string;
			serves: string[];
			status: 'planned' | 'drafting' | 'live';
			issue?: number;
			minutes: number;
			after: string[];
		}[];
	};
}

/** Course plans matching `docs`, plus one planned lesson in safety. */
export const courses: CourseFixture[] = [
	{
		id: 'concepts',
		data: {
			area: 'concepts',
			lessons: [
				{
					id: 'concepts/how-models-work',
					title: 'How a language model works',
					covers: 'concepts/models',
					serves: ['o1'],
					status: 'live',
					minutes: 20,
					after: [],
				},
			],
		},
	},
	{
		id: 'safety',
		data: {
			area: 'safety',
			lessons: [
				{
					id: 'safety/agent-risk',
					title: 'Why agent safety is different',
					covers: 'safety/risk',
					serves: ['o1'],
					status: 'live',
					minutes: 20,
					after: [],
				},
				{
					id: 'safety/deeper',
					title: 'Deeper',
					covers: 'safety/risk',
					serves: [],
					status: 'live',
					minutes: 15,
					after: [],
				},
				{
					id: 'safety/coming',
					title: 'Coming soon',
					covers: 'safety/risk',
					serves: [],
					status: 'planned',
					issue: 42,
					minutes: 15,
					after: ['safety/deeper'],
				},
			],
		},
	},
];

export const competencies = [
	{
		id: 'concepts',
		data: {
			area: 'concepts',
			competencies: [
				{
					id: 'concepts/explains-models',
					statement: 'Explains what a model does',
					topics: ['concepts/models'],
					objectives: [{ id: 'o1', statement: 'Explains generation', level: 'base', behaviors: [] }],
					alignment: [],
				},
			],
		},
	},
];

export function mockContent(
	overrides: { docs?: DocFixture[]; topics?: TopicFixture[]; courses?: CourseFixture[] } = {},
) {
	const collections: Record<string, unknown[]> = {
		docs: overrides.docs ?? docs,
		topics: overrides.topics ?? topics,
		courses: overrides.courses ?? courses,
		competencies,
	};
	return {
		getCollection: vi.fn(async (name: string) => collections[name] ?? []),
	};
}
