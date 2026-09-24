/**
 * Renders the `MobileTableOfContents` override (issue #287) with Astro's
 * Container API: a lesson page gets Starlight's dropdown and, after it, a
 * hidden "Checkpoints" and "Examples" group for `scripts/mobile-toc.ts` to
 * move into the dropdown, each entry linking to its section id. A page that
 * is not a lesson renders the dropdown alone.
 */
import MobileTableOfContents from '@components/overrides/MobileTableOfContents.astro';
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
	// Starlight's dropdown reads `toc` and the `t()` translator from the route locals; the override reads `entry`.
	const locals = {
		starlightRoute: { entry, toc: { minHeadingLevel: 2, maxHeadingLevel: 3, items } },
		t: (key: string) => key,
	} as unknown as App.Locals;
	return container.renderToString(MobileTableOfContents, { locals });
}

describe('MobileTableOfContents', () => {
	it('renders the dropdown, then the hidden checkpoint and example groups linked by section id', async () => {
		const html = await render(lesson, [{ ...title, children: [heading] }]);
		expect(html).toMatch(
			/<mobile-starlight-toc[^>]*>[\s\S]*<details[^>]*>[\s\S]*<div class="dropdown[^"]*"[^>]*>[\s\S]*href="#first"/,
		);
		expect(html).toMatch(/<div class="lesson-toc-mobile" data-lesson-toc-mobile hidden>/);
		expect(html).toMatch(
			/<div role="group" aria-labelledby="lesson-toc-mobile-checkpoints"><h2 id="lesson-toc-mobile-checkpoints">Checkpoints<\/h2><ul><li><a href="#what-the-model-does"><span>What the model does<\/span><\/a><\/li><li><a href="#honor">/,
		);
		expect(html).toMatch(
			/<div role="group" aria-labelledby="lesson-toc-mobile-examples"><h2 id="lesson-toc-mobile-examples">Examples<\/h2><ul><li><a href="#shown"><span>Shown<\/span><\/a><\/li><\/ul><\/div>/,
		);
		expect(html.indexOf('</mobile-starlight-toc>')).toBeLessThan(html.indexOf('data-lesson-toc-mobile'));
		expect(html.indexOf('lesson-toc-mobile-checkpoints')).toBeLessThan(html.indexOf('lesson-toc-mobile-examples'));
	});
	it('renders the dropdown alone on a page that is not a lesson', async () => {
		const html = await render(page, [{ ...title, children: [heading] }]);
		expect(html).toContain('<mobile-starlight-toc');
		expect(html).not.toContain('lesson-toc-mobile');
	});
});
