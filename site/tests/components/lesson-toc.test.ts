/**
 * Renders the `TableOfContents` override (issue #220) with Astro's Container
 * API: a lesson page gets a "Checkpoints" and an "Examples" group after
 * Starlight's headings list, each entry linking to its section id, and a
 * page with only its title and no lesson entries renders no menu.
 */
import TableOfContents from '@components/overrides/TableOfContents.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { docs } from '../lib/content';

vi.mock('astro:content', async () => (await import('../lib/content')).mockContent());

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

const title = { depth: 2, slug: '_top', text: 'Overview', children: [] };
const heading = { depth: 2, slug: 'first', text: 'First', children: [] };
const lesson = docs.find((d) => d.id === 'concepts/how-models-work');
const page = { id: 'concepts/index', data: { title: 'Concepts' } };

async function render(entry: unknown, items: unknown[]) {
	// Starlight's own list reads `toc` and the `t()` translator from the route locals; the override reads `entry`.
	const locals = {
		starlightRoute: { entry, toc: { minHeadingLevel: 2, maxHeadingLevel: 3, items } },
		t: (key: string) => key,
	} as unknown as App.Locals;
	return container.renderToString(TableOfContents, { locals });
}

describe('TableOfContents', () => {
	it('lists the checkpoints and the examples of a lesson after the headings, linked by section id', async () => {
		const html = await render(lesson, [{ ...title, children: [heading] }]);
		expect(html).toMatch(/<starlight-toc[^>]*>[\s\S]*href="#first"[\s\S]*<\/starlight-toc>/);
		expect(html).toMatch(
			/<nav class="lesson-toc" aria-labelledby="lesson-toc-checkpoints"><h2 id="lesson-toc-checkpoints">Checkpoints<\/h2><ul><li><a href="#what-the-model-does"><span>What the model does<\/span><\/a><\/li><li><a href="#honor">/,
		);
		expect(html).toMatch(
			/<nav class="lesson-toc" aria-labelledby="lesson-toc-examples"><h2 id="lesson-toc-examples">Examples<\/h2><ul><li><a href="#shown"><span>Shown<\/span><\/a><\/li><\/ul><\/nav>/,
		);
		expect(html.indexOf('</starlight-toc>')).toBeLessThan(html.indexOf('lesson-toc-checkpoints'));
		expect(html.indexOf('lesson-toc-checkpoints')).toBeLessThan(html.indexOf('lesson-toc-examples'));
	});
	it('shows the menu for a lesson with checkpoints and no headings', async () => {
		const html = await render(lesson, [title]);
		expect(html).toContain('<starlight-toc');
		expect(html).toContain('lesson-toc-checkpoints');
	});
	it('renders no groups on a page that is not a lesson, and no menu when the title is its only entry', async () => {
		expect(await render(page, [{ ...title, children: [heading] }])).not.toContain('lesson-toc');
		expect((await render(page, [title])).trim()).toBe('');
	});
});
