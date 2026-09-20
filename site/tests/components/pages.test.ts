/**
 * Renders the page-level components that read the content collections
 * (CourseGraph, TopicMap, Settings) against the fixture lessons in
 * tests/lib/content.ts. What the client scripts draw on top is covered by
 * the e2e suite; these tests check the server-rendered frame the scripts
 * bind to.
 */
import CourseGraph from '@components/CourseGraph.astro';
import Settings from '@components/Settings.astro';
import TopicMap from '@components/TopicMap.astro';
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
		const edges = JSON.parse(/data-edges>([^<]*)</.exec(html)?.[1] ?? '[]');
		expect(edges).toEqual([{ from: 'safety/agent-risk', to: 'safety/deeper' }]);
		expect(html).toContain('2 lessons, 1 checkpoint');
		expect(html).toContain('href="/ai-training/safety/review/"');
		expect(html).toContain('Review: nothing due yet');
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
