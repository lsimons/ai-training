/** Footer, sidebar and the generated reference pages. */
import { expect, test } from './fixtures';

test('the last lesson of a course links to the next course, and the footer carries the AI notice', async ({ page }) => {
	await page.goto('concepts/straight-answer/');
	await expect(page.locator('.site-footer a[rel=next]')).toHaveAttribute('href', '/ai-training/safety/');
	await expect(page.locator('.ai-notice')).toHaveText('Content co-authored by AI.');
});

test('a page without headings keeps the right column but drops "On this page"', async ({ page }) => {
	await page.goto('settings/');
	await expect(page.locator('.right-sidebar-container')).toHaveCount(1);
	await expect(page.locator('starlight-toc')).toHaveCount(0);
});

test('topic, competency and glossary pages render', async ({ page }) => {
	await page.goto('topics/concepts/how-models-work/');
	await expect(page.locator('h1')).not.toBeEmpty();
	await page.goto('competencies/concepts/explains-models/');
	expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
	await page.goto('glossary/');
	await expect(page.locator('h1')).toHaveText('Glossary');
});

test('the landing page points at the first lesson', async ({ page }) => {
	await page.goto('');
	await expect(page.locator('[data-continue]')).toHaveAttribute('href', /\/ai-training\/concepts\//);
});

test('the topic map is the heading of the topic groups, and clicking it opens the map (#228)', async ({ page }) => {
	await page.goto('progress/');
	const heading = page.locator('nav.sidebar li.linked > a[href="/ai-training/map/"]');
	await expect(heading).toHaveCount(1);
	// The heading's group holds the per-area topic groups, closed until the map is open.
	const group = heading.locator('xpath=following-sibling::details[1]');
	const area = group.locator('summary .plain-label').first();
	await expect(area).toHaveText('Concepts');
	await expect(area).toBeHidden();
	await heading.click();
	await expect(page).toHaveURL(/\/ai-training\/map\/$/);
	await expect(
		page.locator('nav.sidebar li.linked > a[href="/ai-training/map/"] + details summary .plain-label').first(),
	).toBeVisible();
});

test('clicking an open course heading opens the course page with the group still open (#228)', async ({ page }) => {
	// Starlight persists the open state per group on a summary click. The heading is not in the summary, so
	// the state stays as the server rendered it (issue #228 review, finding 1).
	await page.goto('concepts/how-models-work/');
	const heading = page.locator('nav.sidebar li.linked > a[href="/ai-training/concepts/"]');
	const lesson = page.locator('nav.sidebar a[href="/ai-training/concepts/how-models-work/"]');
	await expect(lesson).toBeVisible();
	await heading.click();
	await expect(page).toHaveURL(/\/ai-training\/concepts\/$/);
	await expect(page.locator('nav.sidebar li.linked > a[href="/ai-training/concepts/"]')).toHaveAttribute(
		'aria-current',
		'page',
	);
	await expect(lesson).toBeVisible();
	// The caret toggles the group without leaving the page.
	await page.locator('nav.sidebar li.linked > a[href="/ai-training/concepts/"] + details > summary').click();
	await expect(lesson).toBeHidden();
	await expect(page).toHaveURL(/\/ai-training\/concepts\/$/);
});
