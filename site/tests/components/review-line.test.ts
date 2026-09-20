/**
 * Renders the `ReviewLine` component (spec S03 "Frontmatter", `review-by`)
 * with Astro's Container API. The MarkdownContent override passes it the
 * lesson's `review-by` and `lastUpdated` frontmatter.
 */
import ReviewLine from '@components/lesson/ReviewLine.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

describe('ReviewLine', () => {
	it('renders both dates when lastUpdated is a date', async () => {
		const html = await container.renderToString(ReviewLine, {
			props: { reviewBy: new Date('2027-03-20'), lastUpdated: new Date('2026-09-20') },
		});
		expect(html).toContain('<p class="lesson-review not-content" data-review-by="2027-03-20">');
		expect(html).toContain('Sources checked on September 20, 2026. Review due by March 20, 2027.');
	});
	it('renders only the due date when lastUpdated is absent or a boolean', async () => {
		const html = await container.renderToString(ReviewLine, { props: { reviewBy: new Date('2027-03-20') } });
		expect(html).toContain('data-review-by="2027-03-20"');
		expect(html).not.toContain('Sources checked');
		expect(html).toContain('Review due by March 20, 2027.');
		const bool = await container.renderToString(ReviewLine, {
			props: { reviewBy: new Date('2027-03-20'), lastUpdated: true },
		});
		expect(bool).not.toContain('Sources checked');
	});
	it('renders nothing without review-by', async () => {
		const html = await container.renderToString(ReviewLine, { props: { lastUpdated: new Date('2026-09-20') } });
		expect(html.trim()).toBe('');
	});
});
