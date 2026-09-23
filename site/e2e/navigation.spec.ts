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
