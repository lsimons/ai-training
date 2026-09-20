/** The settings page's review schedule and the review page (spec S05). */
import { expect, storedRecord, test } from './fixtures';

const TODAY = new Date().toISOString().slice(0, 10);
const ITEM = 'concepts/how-models-work#what-the-model-does';
const OTHER = 'concepts/how-models-work#name-the-failure';

function scheduled(due: string) {
	return {
		lessons: { 'concepts/how-models-work': { state: 'finished' as const, at: TODAY } },
		reviews: {
			[ITEM]: { stage: 1, due, last: null, history: [], revision: 1 },
			[OTHER]: { stage: 1, due, last: null, history: [], revision: 1 },
		},
	};
}

test('the settings page lists scheduled items and nudges their stage', async ({ page, seed }) => {
	await seed(scheduled('2999-01-01'));
	await page.goto('settings/');
	await expect(page.locator('[data-review-item]')).toHaveCount(2);
	await expect(page.locator('[data-due-now]')).toHaveText('Nothing due right now.');
	const item = page.locator(`[data-review-item="${ITEM}"]`);
	await expect(item.locator('.cp-sooner')).toBeDisabled();
	await expect(item.locator('.cp-later')).toBeEnabled();
	await item.locator('.cp-later').click();
	await expect(item.locator('.cp-stage-label')).toHaveText(/^stage 2 of 5, due \d{4}-\d{2}-\d{2}$/);
	await item.locator('.cp-sooner').click();
	await expect(item.locator('.cp-stage-label')).toHaveText(/^stage 1 of 5/);
	await expect(item.locator('.cp-sooner')).toBeDisabled();
});

test('due items are listed per course on the settings page', async ({ page, seed }) => {
	await seed(scheduled('2000-01-01'));
	await page.goto('settings/');
	await expect(page.locator('[data-due-now]')).toHaveText(/^Due now: .*Concepts \(2\)/);
	await expect(page.locator('[data-due-now] a')).toHaveAttribute('href', '/ai-training/concepts/review/');
});

test('the review page records one result per item: pass on Check, fail on Give Up', async ({ page, seed }) => {
	await seed(scheduled('2000-01-01'));
	await page.goto('concepts/review/');
	const cp = page.locator('.review [data-checkpoint]');
	await expect(cp).toBeVisible();
	await expect(page.locator('[data-status]')).toHaveText('Item 1 of 2');
	await expect(cp).toHaveAttribute('data-kind', 'choice');
	await expect(cp.locator('.cp-giveup')).toBeDisabled();

	// Item 1: a correct answer records a pass and closes the item.
	await cp.locator('label[data-correct]').first().click();
	await cp.locator('.cp-check').first().click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct.');
	await expect(cp.locator('.cp-stage-label')).toHaveText('stage 2 of 5');
	await expect(cp.locator('.cp-check').first()).toBeDisabled();
	await expect(cp.locator('.cp-giveup')).toBeDisabled();
	await page.getByRole('button', { name: 'Next item' }).click();
	await expect(page.locator('[data-status]')).toHaveText('Item 2 of 2');

	// Item 2: a wrong answer records nothing; Give Up reveals and records the fail.
	const second = page.locator('.review [data-checkpoint]');
	await expect(second.locator('.cp-giveup')).toBeDisabled();
	await second.locator('label:not([data-correct])').first().click();
	await second.locator('.cp-check').first().click();
	await expect(second.locator('.cp-feedback')).not.toBeEmpty();
	await expect(second.locator('.cp-check').first()).toBeEnabled();
	await expect(second.locator('.cp-giveup')).toBeEnabled();
	await second.locator('.cp-giveup').click();
	await expect(second.locator('.cp-stage-label')).toHaveText('stage 1 of 5');
	await expect(second.locator('.cp-giveup')).toBeDisabled();
	await expect(second.locator('.cp-check').first()).toBeDisabled();

	const record = await storedRecord(page);
	const histories = Object.entries(record.reviews ?? {})
		.filter(([id]) => id.startsWith('concepts/'))
		.map(([, x]) => (x as { history: unknown[] }).history.length);
	expect(histories).toEqual([1, 1]);

	await page.getByRole('button', { name: 'Next item' }).click();
	await expect(page.locator('[data-status]')).toHaveText('Done: 2 items reviewed. 0 more remain due.');
});
