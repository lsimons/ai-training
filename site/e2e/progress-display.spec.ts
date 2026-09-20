/**
 * Every progress figure comes from one rule (spec S04 "Progress display"):
 * finished / (all − skipped) lessons, with skipped shown as its own count.
 * The course ring, the course milestone bar and the overall bar on the
 * landing and progress pages must agree for the same record.
 */
import type { Page } from '@playwright/test';
import { expect, STORAGE_KEY, test } from './fixtures';

const AT = '2026-01-01';
// The safety course has two live lessons: one finished, one skipped gives 1 / (2 − 1) = 100%.
const oneSkipped = {
	lessons: {
		'safety/responsible-use': { state: 'finished' as const, at: AT },
		'safety/agent-risk': { state: 'skipped' as const, at: AT },
	},
};

/** The catalog the overall bar computes from, as the page embeds it. */
async function catalogLessonIds(page: Page): Promise<string[]> {
	const raw = await page.locator('[data-overall]').getAttribute('data-catalog');
	const catalog: { lessons: { id: string }[] }[] = JSON.parse(raw ?? '[]');
	return catalog.flatMap((c) => c.lessons.map((l) => l.id));
}

test('the course ring and milestone bar show the same percent and leave the skipped lesson out', async ({
	page,
	seed,
}) => {
	await seed(oneSkipped);
	await page.goto('safety/');
	await expect(page.locator('[data-ring-label]')).toHaveText('100%');
	await expect.poll(() => page.locator('[data-milestone-fill]').evaluate((el) => el.style.width)).toBe('100%');
	await expect(page.locator('[data-stop="100"]')).toHaveAttribute('data-reached', 'true');
	await expect(page.locator('.course [data-skipped]')).toHaveText('1 skipped');
	await expect(page.locator('a[data-node="safety/agent-risk"]')).toHaveAttribute('data-state', 'skipped');
});

test('the overall bar uses the same formula as the course page and shows the skipped count', async ({ page, seed }) => {
	await seed(oneSkipped);
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	const expected = Math.round((1 / (ids.length - 1)) * 100);
	await expect(page.locator('[data-percent]')).toHaveText(`${expected}%`);
	await expect(page.locator('[data-bar]')).toHaveAttribute('aria-valuenow', String(expected));
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
	await expect(page.locator('[data-text]')).toContainText(`1 of ${ids.length} lessons finished, 1 skipped`);
	// The landing page bar reads the same record and shows the same figure.
	await page.goto('/ai-training/');
	await expect(page.locator('[data-percent]')).toHaveText(`${expected}%`);
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
});

test('with every lesson finished or skipped, continue offers the first skipped lesson', async ({ page }) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	const [skippedId, ...rest] = ids;
	const lessons = Object.fromEntries([
		[skippedId, { state: 'skipped', at: AT }],
		...rest.map((id) => [id, { state: 'finished', at: AT }]),
	]);
	await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
		STORAGE_KEY,
		JSON.stringify({ version: 1, goals: [], lessons, checkpoints: {}, reviews: {}, quizzes: {} }),
	] as const);
	await page.reload();
	await expect(page.locator('[data-percent]')).toHaveText('100%');
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
	const cont = page.locator('[data-continue]');
	await expect(cont).toHaveText('All lessons finished, 1 skipped');
	await expect(cont).toHaveAttribute('href', `/ai-training/${skippedId}/`);
});

test('with every lesson finished and none skipped, continue points at the topic map', async ({ page }) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	const lessons = Object.fromEntries(ids.map((id) => [id, { state: 'finished', at: AT }]));
	await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
		STORAGE_KEY,
		JSON.stringify({ version: 1, goals: [], lessons, checkpoints: {}, reviews: {}, quizzes: {} }),
	] as const);
	await page.reload();
	await expect(page.locator('[data-percent]')).toHaveText('100%');
	await expect(page.locator('[data-overall] [data-skipped]')).toBeHidden();
	const cont = page.locator('[data-continue]');
	await expect(cont).toHaveText('All lessons finished: see the topic map');
	await expect(cont).toHaveAttribute('href', '/ai-training/map/');
});
