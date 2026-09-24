/**
 * Renders the `ReviewLine` component (spec S03 "Frontmatter", `review-by`)
 * with Astro's Container API. The MarkdownContent override passes it the
 * lesson's `review-by` and `sources-checked` fields, which the docs loader
 * copies from the lesson YAML. Starlight's `lastUpdated` is not involved.
 */
import ReviewLine from '@components/lesson/ReviewLine.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

describe('ReviewLine', () => {
	it('renders both dates when sourcesChecked is set', async () => {
		const html = await container.renderToString(ReviewLine, {
			props: { reviewBy: new Date('2027-03-20'), sourcesChecked: new Date('2026-09-20') },
		});
		expect(html).toContain('<p class="lesson-review not-content" data-review-by="2027-03-20">');
		expect(html).toContain('Sources checked on September 20, 2026. Review due by March 20, 2027.');
	});
	it('renders only the due date when sourcesChecked is absent', async () => {
		const html = await container.renderToString(ReviewLine, { props: { reviewBy: new Date('2027-03-20') } });
		expect(html).toContain('data-review-by="2027-03-20"');
		expect(html).not.toContain('Sources checked');
		expect(html).toContain('Review due by March 20, 2027.');
	});
	it('renders nothing without review-by', async () => {
		const html = await container.renderToString(ReviewLine, { props: { sourcesChecked: new Date('2026-09-20') } });
		expect(html.trim()).toBe('');
	});
});
