/**
 * Every progress figure comes from one rule (spec S04 "Progress display"):
 * finished / (all − skipped) lessons, with skipped shown as its own count.
 * The course ring, the course milestone bar and the overall bar on the
 * landing and progress pages must agree for the same record.
 *
 * Expected figures are computed from the lesson lists the pages embed
 * (`data-nodes` on the course page, `data-catalog` on the overall bar), so a
 * new live lesson doesn't change the assertions.
 */
import type { Page } from '@playwright/test';
import { expect, type Seed, test } from './fixtures';

const AT = '2026-01-01';

/** The course page's live lesson ids, in plan order. */
async function courseLessonIds(page: Page): Promise<string[]> {
	const raw = await page.locator('.course').getAttribute('data-nodes');
	const nodes: { id: string }[] = JSON.parse(raw ?? '[]');
	return nodes.map((n) => n.id);
}

/** The catalog the overall bar computes from, as the page embeds it. */
async function catalogLessonIds(page: Page): Promise<string[]> {
	const raw = await page.locator('[data-overall]').getAttribute('data-catalog');
	const catalog: { lessons: { id: string }[] }[] = JSON.parse(raw ?? '[]');
	return catalog.flatMap((c) => c.lessons.map((l) => l.id));
}

/** One lesson finished, the next skipped, the rest untouched. */
function oneFinishedOneSkipped(ids: string[]): Seed {
	const [finished, skipped] = ids;
	if (!finished || !skipped) throw new Error('need at least two lessons');
	return { lessons: { [finished]: { state: 'finished', at: AT }, [skipped]: { state: 'skipped', at: AT } } };
}

/** S04 "Progress display": finished / (all − skipped). */
const percent = (finished: number, all: number, skipped: number) => Math.round((finished / (all - skipped)) * 100);

test('the course ring and milestone bar show the same percent and leave the skipped lesson out', async ({
	page,
	seed,
}) => {
	await page.goto('safety/');
	const ids = await courseLessonIds(page);
	await seed(oneFinishedOneSkipped(ids));
	await page.reload();
	const expected = percent(1, ids.length, 1);
	await expect(page.locator('[data-ring-label]')).toHaveText(`${expected}%`);
	await expect.poll(() => page.locator('[data-milestone-fill]').evaluate((el) => el.style.width)).toBe(`${expected}%`);
	await expect(page.locator('.course [data-skipped]')).toHaveText('1 skipped');
	await expect(page.locator(`a[data-node="${ids[1]}"]`)).toHaveAttribute('data-state', 'skipped');
});

test('the overall bar uses the same formula as the course page and shows the skipped count', async ({ page, seed }) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	await seed(oneFinishedOneSkipped(ids));
	await page.reload();
	const expected = percent(1, ids.length, 1);
	await expect(page.locator('[data-percent]')).toHaveText(`${expected}%`);
	await expect(page.locator('[data-bar]')).toHaveAttribute('aria-valuenow', String(expected));
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
	await expect(page.locator('[data-text]')).toContainText(`1 of ${ids.length} lessons finished`);
	// The landing page bar reads the same record and shows the same figure.
	await page.goto('/ai-training/');
	await expect(page.locator('[data-percent]')).toHaveText(`${expected}%`);
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
});

test('with every lesson finished or skipped, continue offers the first skipped lesson', async ({ page, seed }) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	const [skippedId, ...rest] = ids;
	await seed({
		lessons: Object.fromEntries([
			[skippedId, { state: 'skipped', at: AT }],
			...rest.map((id) => [id, { state: 'finished', at: AT }]),
		]),
	});
	await page.reload();
	await expect(page.locator('[data-percent]')).toHaveText('100%');
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText('1 skipped');
	const cont = page.locator('[data-continue]');
	await expect(cont).toHaveText('All lessons finished, 1 skipped');
	await expect(cont).toHaveAttribute('href', `/ai-training/${skippedId}/`);
});

test('with every lesson skipped and none finished, continue offers the first skipped lesson as next', async ({
	page,
	seed,
}) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	await seed({ lessons: Object.fromEntries(ids.map((id) => [id, { state: 'skipped', at: AT }])) });
	await page.reload();
	await expect(page.locator('[data-percent]')).toHaveText('0%');
	await expect(page.locator('[data-overall] [data-skipped]')).toHaveText(`${ids.length} skipped`);
	const cont = page.locator('[data-continue]');
	await expect(cont).toHaveText(/^Continue with: /);
	await expect(cont).toHaveAttribute('href', `/ai-training/${ids[0]}/`);
});

test('with every lesson finished and none skipped, continue points at the topic map', async ({ page, seed }) => {
	await page.goto('progress/');
	const ids = await catalogLessonIds(page);
	await seed({ lessons: Object.fromEntries(ids.map((id) => [id, { state: 'finished', at: AT }])) });
	await page.reload();
	await expect(page.locator('[data-percent]')).toHaveText('100%');
	await expect(page.locator('[data-overall] [data-skipped]')).toBeHidden();
	const cont = page.locator('[data-continue]');
	await expect(cont).toHaveText('All lessons finished: see the topic map');
	await expect(cont).toHaveAttribute('href', '/ai-training/map/');
});
