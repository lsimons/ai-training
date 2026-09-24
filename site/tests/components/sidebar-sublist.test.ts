/**
 * Renders the `SidebarSublist` override (issue #228) with Astro's Container
 * API: a group whose first link has the `group-link` class gets that link as
 * its heading, and the groups under it are parts with a plain label.
 */
import SidebarSublist from '@components/overrides/SidebarSublist.astro';
import type { SidebarEntry } from '@lib/sidebar-groups';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

const lesson: SidebarEntry = {
	type: 'link',
	label: 'What a model is',
	href: '/ai-training/concepts/what-a-model-is/',
	isCurrent: false,
	badge: undefined,
	attrs: {},
};
const course: SidebarEntry = {
	type: 'group',
	label: 'Concepts',
	collapsed: true,
	badge: undefined,
	entries: [
		{
			type: 'link',
			label: 'Concepts',
			href: '/ai-training/concepts/',
			isCurrent: false,
			badge: undefined,
			attrs: { class: 'group-link' },
		},
		{ type: 'group', label: 'How language models work', collapsed: false, badge: undefined, entries: [lesson] },
	],
};
const plain: SidebarEntry = {
	type: 'group',
	label: 'Contributing',
	collapsed: true,
	badge: undefined,
	entries: [lesson],
};

async function render(sublist: SidebarEntry[]) {
	// The restore point counts groups in `Astro.locals`; an empty object is enough for it.
	return container.renderToString(SidebarSublist, { props: { sublist }, locals: {} as App.Locals });
}

describe('SidebarSublist', () => {
	it('renders the group-link as the heading of its group, and its groups as parts', async () => {
		const html = await render([course]);
		// The heading is the course link inside the summary, with the caret after it.
		expect(html).toMatch(
			/<summary[^>]*data-group-link[^>]*><a href="\/ai-training\/concepts\/" class="large group-link[^"]*">/,
		);
		// `class` is set once, from the class list.
		expect(html.match(/class="[^"]*group-link/g)).toHaveLength(1);
		expect(html).not.toMatch(/class="group-label[^"]*"><span class="large[^"]*">Concepts</);
		// The part label is plain, and its lesson is nested under it.
		expect(html).toMatch(/<span class="part-label[^"]*">How language models work</);
		expect(html).toContain('href="/ai-training/concepts/what-a-model-is/"');
		// The collapsed course starts closed. The part is not collapsed, so it starts open.
		expect(html).toMatch(/^<ul[^>]*><li[^>]*><details class/);
		expect(html).toMatch(/<details open/);
	});
	it('renders a plain group with Starlight’s bold label and opens it when it holds the current page', async () => {
		const html = await render([{ ...plain, entries: [{ ...lesson, isCurrent: true }] }]);
		expect(html).toMatch(/<span class="large[^"]*">Contributing</);
		expect(html).toMatch(/<details open/);
		expect(html).toContain('aria-current="page"');
	});
});
