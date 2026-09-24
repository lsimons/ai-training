/**
 * Renders the `TableOfContents` override (issue #220) with Astro's Container
 * API: a lesson page gets a "Checkpoints" and an "Examples" group after
 * Starlight's headings list, each entry linking to its section id, and a
 * page with only its title and no lesson entries renders no menu. A lesson
 * with `covered-by` (issue #111) gets the skip tip above the menu.
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
const coveredBy = { label: 'How agents think', href: 'https://example.com/aec/lesson-2' };
const covered = { ...lesson, data: { ...lesson?.data, 'covered-by': coveredBy } };

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
	it('renders no skip tip on a lesson without covered-by', async () => {
		const html = await render(lesson, [{ ...title, children: [heading] }]);
		expect(html).not.toContain('data-covered-by');
		expect(html).not.toContain('data-skip-lesson');
	});
	it('renders the skip tip above the menu on a lesson with covered-by, with the label linked', async () => {
		const html = await render(covered, [{ ...title, children: [heading] }]);
		expect(html).toMatch(
			/<aside class="not-content covered-by" data-covered-by><p>If you have followed <a href="https:\/\/example.com\/aec\/lesson-2" rel="noopener">How agents think<\/a>, you can skip this lesson.<\/p><button type="button" class="recap-skip" data-skip-lesson>I know this, skip it<\/button><\/aside>/,
		);
		expect(html.indexOf('data-covered-by')).toBeLessThan(html.indexOf('<starlight-toc'));
	});
	it('renders the skip tip even when the title is the only entry and the lesson has no groups', async () => {
		const bare = { ...covered, body: '' };
		const html = await render(bare, [title]);
		expect(html).toContain('data-covered-by');
	});
	it('fails the build on a covered-by href that is a page path or is under no bibliography url', async () => {
		const bad = (href: string) => ({ ...covered, data: { ...covered.data, 'covered-by': { ...coveredBy, href } } });
		await expect(render(bad('/concepts/how-models-work/'), [title])).rejects.toThrow(
			/covered-by href must be an https/,
		);
		await expect(render(bad('https://nowhere.example/'), [title])).rejects.toThrow(/bibliography\.yaml/);
	});
});
