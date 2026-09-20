/** The due review count in the sidebar and the due lines on the landing and progress pages (spec S05). */
import type { Page } from '@playwright/test';
import { answerChoice, expect, STORAGE_KEY, storedRecord, test } from './fixtures';

const LESSON = 'concepts/how-models-work';

/** Move every review item of the finished lesson to a due date in the past. */
async function makeDue(page: Page) {
	await page.evaluate(
		([key, lesson]) => {
			const record = JSON.parse(localStorage.getItem(key) ?? '{}');
			for (const [id, item] of Object.entries(record.reviews ?? {}) as [string, { due: string }][]) {
				if (id.startsWith(`${lesson}#`)) item.due = '2000-01-01';
			}
			localStorage.setItem(key, JSON.stringify(record));
		},
		[STORAGE_KEY, LESSON] as const,
	);
}

test('the sidebar and the landing page show the same due count once a finished lesson comes due', async ({ page }) => {
	// Nothing finished: no count anywhere.
	await page.goto('concepts/');
	await expect(page.locator('[data-due-count]')).toHaveCount(6);
	await expect(page.locator('[data-due-count]:not([hidden])')).toHaveCount(0);
	await page.goto('');
	await expect(page.locator('[data-due-lines]')).toBeHidden();

	// Finish the lesson through the page. Its items are scheduled for later, so still no count.
	await page.goto(`${LESSON}/`);
	await answerChoice(page, 'what-the-model-does');
	await answerChoice(page, 'name-the-failure');
	await page.locator('[data-finish]').click();
	await expect(page.locator('[data-finish]')).toHaveText(/^Finished ✓/);
	await expect(page.locator('[data-due-count="concepts"]')).toBeHidden();
	const record = await storedRecord(page);
	const items = Object.keys(record.reviews ?? {}).filter((id) => id.startsWith(`${LESSON}#`)).length;
	expect(items).toBe(2);

	// Set a due date in the past and reload: the sidebar count and the course card agree.
	await makeDue(page);
	await page.goto('concepts/');
	const count = page.locator('[data-due-count="concepts"]');
	await expect(count).toBeVisible();
	await expect(count).toHaveText(`${items} review items due`);
	await expect(page.locator('[data-review-card]')).toHaveText(`Review due: ${items} items`);
	await expect(page.locator('[data-due-count="safety"]')).toBeHidden();

	// The landing page shows one line for the course, linking to its review page.
	await page.goto('');
	const lines = page.locator('[data-due-lines]');
	await expect(lines).toBeVisible();
	await expect(lines.locator('li')).toHaveCount(1);
	await expect(lines.locator('[data-due-line="concepts"]')).toHaveText(`Concepts: ${items} items due`);
	await expect(lines.locator('[data-due-line="concepts"]')).toHaveAttribute('href', '/ai-training/concepts/review/');

	// Reviewing one item redraws the sidebar count on the progress event, without a reload.
	await page.goto('concepts/review/');
	await expect(count).toHaveText(`${items} review items due`);
	const cp = page.locator('.review [data-checkpoint]');
	await cp.locator('label[data-correct]').first().click();
	await cp.locator('.cp-check').first().click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct.');
	await expect(count).toHaveText(`${items - 1} review item due`);

	// The progress page shows the same line, and clearing progress hides both surfaces without a reload.
	await page.goto('progress/');
	await expect(page.locator('[data-due-line="concepts"]')).toHaveText(`Concepts: ${items - 1} item due`);
	page.once('dialog', (d) => d.accept());
	await page.locator('[data-reset]').click();
	await expect(page.locator('[data-message]')).toHaveText('Progress reset.');
	await expect(page.locator('[data-due-lines]')).toBeHidden();
	await expect(count).toBeHidden();
});
