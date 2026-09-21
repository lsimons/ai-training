/**
 * Renders the page-level components that read the content collections
 * (CourseGraph, CoursePlan, TopicMap, Settings, OverallProgress) against the fixture lessons in
 * tests/lib/content.ts. What the client scripts draw on top is covered by
 * the e2e suite; these tests check the server-rendered frame the scripts
 * bind to.
 */
import CourseGraph from '@components/CourseGraph.astro';
import CoursePlan from '@components/CoursePlan.astro';
import LearnersReference from '@components/LearnersReference.astro';
import OverallProgress from '@components/OverallProgress.astro';
import Settings from '@components/Settings.astro';
import TopicMap from '@components/TopicMap.astro';
import TopicReference from '@components/TopicReference.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', async () => (await import('../lib/content')).mockContent());

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

describe('CourseGraph', () => {
	it('renders one node per lesson, the edges from assumes, and the course facts', async () => {
		const html = await container.renderToString(CourseGraph, { props: { area: 'safety' } });
		expect(html).toContain('data-course="safety"');
		expect(html).toContain('data-node="safety/agent-risk"');
		expect(html).toContain('data-node="safety/deeper"');
		expect(html).not.toContain('data-node="concepts/how-models-work"');
		// deeper assumes agent-risk within the course; the cross-course edge is dropped.
		// The planned lesson's edge comes from its `after` in the plan.
		const edges = JSON.parse(/data-edges>([^<]*)</.exec(html)?.[1] ?? '[]');
		expect(edges).toEqual([
			{ from: 'safety/agent-risk', to: 'safety/deeper' },
			{ from: 'safety/deeper', to: 'safety/coming' },
		]);
		expect(html).toContain('2 lessons, 1 checkpoint, 1 more coming');
		expect(html).toContain('href="/ai-training/safety/review/"');
		expect(html).toContain('Review: nothing due yet');
	});
	it('renders a planned lesson as a coming node without a link, outside the progress node list', async () => {
		const html = await container.renderToString(CourseGraph, { props: { area: 'safety' } });
		expect(html).toMatch(/<span class="course-node" data-node="safety\/coming" data-state="coming"/);
		expect(html).not.toContain('href="/ai-training/safety/coming/"');
		expect(html).toContain('Coming soon');
		const nodes = JSON.parse(/data-nodes="([^"]*)"/.exec(html)?.[1]?.replace(/&quot;/g, '"') ?? '[]');
		expect(nodes.map((n: { id: string }) => n.id)).toEqual(['safety/agent-risk', 'safety/deeper']);
	});
	it('rejects an area without a course file', async () => {
		await expect(container.renderToString(CourseGraph, { props: { area: 'using-agents' } })).rejects.toThrow(
			/No course plan/,
		);
	});
	it('lists competencies as goals and prerequisites from other areas', async () => {
		const html = await container.renderToString(CourseGraph, { props: { area: 'concepts' } });
		expect(html).toContain('Explains what a model does');
		expect(html).toContain('href="/ai-training/competencies/concepts/explains-models/"');
		expect(html).toContain('Nothing; start here.');
		expect(html).toContain('1 lesson, 5 checkpoints');
	});
	it('rejects an unknown area', async () => {
		await expect(container.renderToString(CourseGraph, { props: { area: 'nope' } })).rejects.toThrow(/Unknown area/);
	});
});

describe('TopicMap', () => {
	it('renders every topic in its area column with lesson coverage and prerequisite edges', async () => {
		const html = await container.renderToString(TopicMap, {});
		expect(html).toContain('data-topic="concepts/models"');
		expect(html).toMatch(/data-topic="concepts\/models"[^>]*data-has-lesson="true"/);
		expect(html).toMatch(/data-topic="safety\/risk"[^>]*data-has-lesson="false"/);
		// A planned entry covers safety/risk; nothing at all names safety/governance.
		expect(html).toMatch(/data-topic="safety\/risk"[^>]*data-planned="true"/);
		expect(html).toMatch(/data-topic="safety\/governance"[^>]*data-has-lesson="false"[^>]*data-planned="false"/);
		expect(html).toContain('href="/ai-training/topics/safety/risk/"');
		const edges = JSON.parse(/data-edges>([^<]*)</.exec(html)?.[1] ?? '[]');
		expect(edges).toEqual([{ from: 'concepts/models', to: 'safety/risk', cross: true }]);
		expect(html.match(/class="topic-col-title"/g)).toHaveLength(6);
	});
});

describe('Settings', () => {
	it('renders the comfort buttons and embeds the catalog for the schedule', async () => {
		const html = await container.renderToString(Settings, {});
		expect(html).toContain('data-comfort="less"');
		expect(html).toContain('data-comfort="more"');
		expect(html).toContain('data-schedule');
		const catalog = JSON.parse(/data-catalog="([^"]*)"/.exec(html)?.[1]?.replace(/&quot;/g, '"') ?? '[]');
		expect(catalog.map((c: { area: string }) => c.area)).toContain('safety');
		expect(catalog[0].lessons[0].checkpoints[0].title).toBe('What the model does');
	});
});

describe('OverallProgress', () => {
	it('renders the bar, the hidden due-lines list and the continue link inside a not-content container', async () => {
		const html = await container.renderToString(OverallProgress, { props: { landing: true } });
		expect(html).toMatch(/<div class="not-content overall[^"]*" data-overall data-landing="true"/);
		expect(html).toMatch(/<ul class="overall-due[^"]*" data-due-lines hidden><\/ul>/);
		expect(html).toContain('href="/ai-training/concepts/how-models-work/"');
		expect(html).toContain('href="/ai-training/map/"');
		expect(html).not.toContain('data-text');
	});
	it('renders the summary line on the progress page layout', async () => {
		const html = await container.renderToString(OverallProgress, {});
		expect(html).toContain('data-text');
		expect(html).not.toContain('href="/ai-training/map/"');
	});
});

describe('TopicReference', () => {
	it('renders, hidden, the takeaways and the canonical example of every covering lesson', async () => {
		const html = await container.renderToString(TopicReference, { props: { topicId: 'concepts/models' } });
		expect(html).toContain('data-reference="concepts/models"');
		expect(html).toMatch(
			/<section class="reference-lesson" data-reference-lesson="concepts\/how-models-work" data-unlocked="false"/,
		);
		expect(html).toContain(
			'Unlocks when you finish <a href="/ai-training/concepts/how-models-work/">How a language model works</a>.',
		);
		expect(html).toContain('<div class="reference-body" data-reference-body hidden>');
		expect(html).toContain('<li>Tokens, <strong>not</strong> words.</li>');
		// The first Predict (the honor one) is the canonical example: it has no body and no answer.
		expect(html).toContain('href="/ai-training/concepts/how-models-work/#honor"');
		expect(html).not.toContain('reference-answer');
	});
	it('renders a prompt and its response, and says when no lesson covers the topic', async () => {
		const html = await container.renderToString(TopicReference, { props: { topicId: 'safety/injection' } });
		expect(html).toContain('data-reference-lesson="safety/agent-risk"');
		// The Prompt and Response components themselves, so the caption matches the lesson page.
		expect(html).toContain('<figure class="prompt-block" data-illustrative="true">');
		expect(html).toContain('Prompt (illustrative, not a recorded transcript)');
		expect(html).toContain('<ul><li>Keep every date.</li><li>Add nothing.</li></ul>');
		expect(html).toContain('<figure class="response-block"><figcaption>Response</figcaption>');
		expect(html).toContain('This lesson has no recap takeaways yet.');
		// safety/deeper covers nothing, and safety/risk has only a planned lesson.
		expect(html).not.toContain('data-reference-lesson="safety/deeper"');
		const none = await container.renderToString(TopicReference, { props: { topicId: 'safety/risk' } });
		expect(none).toContain('No lesson covers this topic yet');
	});
});

describe('LearnersReference', () => {
	it("embeds the catalog with each lesson's topics and renders the empty state hidden", async () => {
		const html = await container.renderToString(LearnersReference, {});
		expect(html).toContain('class="not-content learners-reference"');
		expect(html).toContain('data-reference-empty hidden');
		expect(html).toContain('href="/ai-training/progress/"');
		const catalog = JSON.parse(/data-catalog="([^"]*)"/.exec(html)?.[1]?.replace(/&quot;/g, '"') ?? '[]');
		expect(catalog.map((c: { area: string }) => c.area)).toHaveLength(6);
		expect(catalog[0].lessons[0]).toEqual({
			id: 'concepts/how-models-work',
			title: 'How a language model works',
			topics: [{ id: 'concepts/models', name: 'Models' }],
		});
	});
});

describe('CoursePlan', () => {
	it('renders one row per lesson in course order, a heading row per part, folded under a counted summary', async () => {
		const html = await container.renderToString(CoursePlan, { props: { area: 'safety' } });
		expect(html).toMatch(/<details class="course-plan not-content" data-course-plan="safety"/);
		expect(html).toContain('<summary>Lesson plan (3 lessons, 2 live)</summary>');
		const rows = [...html.matchAll(/data-plan-entry="([^"]+)"/g)].map((m) => m[1]);
		expect(rows).toEqual(['safety/agent-risk', 'safety/deeper', 'safety/coming']);
		const parts = [...html.matchAll(/data-plan-part="([^"]+)"/g)].map((m) => m[1]);
		expect(parts).toEqual(['Risk', 'Later']);
		expect(html).toContain('<td>tutorial</td>');
		expect(html).toContain('<td>do, judge</td>');
		// A flat course has no part rows.
		const flat = await container.renderToString(CoursePlan, { props: { area: 'concepts' } });
		expect(flat).not.toContain('data-plan-part');
	});
	it('links a live row to its page and leaves a planned row as text', async () => {
		const html = await container.renderToString(CoursePlan, { props: { area: 'safety' } });
		expect(html).toContain('<a href="/ai-training/safety/agent-risk/">Why agent safety is different</a>');
		expect(html).toContain('<small class="course-plan-id">safety/agent-risk</small>');
		expect(html).not.toContain('href="/ai-training/safety/coming/"');
		expect(html).toMatch(/data-plan-entry="safety\/coming" data-status="planned"/);
		expect(html).toContain('Coming soon');
	});
	it('links covers to the topic, serves to the competency anchor, and shows the issue and after titles', async () => {
		const html = await container.renderToString(CoursePlan, { props: { area: 'safety' } });
		expect(html).toContain('<a href="/ai-training/topics/safety/risk/" title="safety/risk">risk</a>');
		expect(html).toContain(
			'<a class="course-plan-objective" href="/ai-training/competencies/concepts/explains-models/#o1" title="o1">o1</a>',
		);
		expect(html).toContain('<a href="https://github.com/lsimons/ai-training/issues/42">#42</a>');
		expect(html.match(/github\.com\/lsimons\/ai-training\/issues\//g)).toHaveLength(1);
		expect(html).toContain('<td>Deeper</td>');
	});
	it('rejects an area without a course file', async () => {
		await expect(container.renderToString(CoursePlan, { props: { area: 'using-agents' } })).rejects.toThrow(
			/No course plan/,
		);
	});
});
