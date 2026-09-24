/**
 * Renders the `RouteAhead` card (spec S03 "Frontmatter", `extends-to`)
 * with Astro's Container API. The MarkdownContent override classifies each
 * `extends-to` entry with `checkExtendsToHref` and passes the result here.
 */
import RouteAhead from '@components/lesson/RouteAhead.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

describe('RouteAhead', () => {
	it('renders an internal entry with the base path when the page exists', async () => {
		const html = await container.renderToString(RouteAhead, {
			props: {
				items: [{ label: 'Why agent safety is different', href: '/safety/agent-risk/', external: false, exists: true }],
			},
		});
		expect(html).toContain('data-route="ahead"');
		expect(html).toContain('<a href="/ai-training/safety/agent-risk/">Why agent safety is different</a>');
		expect(html).not.toContain('rel="noopener"');
	});
	it('renders an internal entry without a page as text marked not written yet', async () => {
		const html = await container.renderToString(RouteAhead, {
			props: { items: [{ label: 'Governance', href: '/topics/safety/governance/', external: false, exists: false }] },
		});
		expect(html).not.toContain('<a ');
		expect(html).toContain('Governance <span class="route-where">(not written yet)</span>');
	});
	it('renders an external entry as a plain link with rel="noopener" and a visible marker', async () => {
		const url = 'https://academy.claude.com/courses/ai-capabilities-and-limitations';
		const html = await container.renderToString(RouteAhead, {
			props: {
				items: [{ label: 'AI capabilities and limitations (Claude Academy)', href: url, external: true, exists: true }],
			},
		});
		expect(html).toContain(`<a href="${url}" rel="noopener">AI capabilities and limitations (Claude Academy)</a>`);
		expect(html).toContain('<span class="route-where">(external link)</span>');
		expect(html).not.toContain('/ai-training/https://');
	});
	it('renders nothing for an empty list', async () => {
		const html = await container.renderToString(RouteAhead, { props: { items: [] } });
		expect(html.trim()).toBe('');
	});
});
