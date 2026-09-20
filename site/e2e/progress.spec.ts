/** Finishing a lesson, and where that progress shows up and persists (spec S04). */
import { answerChoice, expect, storageKeyFor, storedRecord, test } from './fixtures';

// The site compares due dates against the local calendar day (progress-model.ts `today()`), so the
// seed is built the same way. `toISOString()` is UTC, which is already tomorrow in the evening west of UTC.
const pad = (n: number) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const finished = {
	lessons: { 'concepts/how-models-work': { state: 'finished' as const, at: TODAY } },
	checkpoints: {
		'concepts/how-models-work#what-the-model-does': { state: 'passed' as const, attempts: 1 },
		'concepts/how-models-work#name-the-failure': { state: 'passed' as const, attempts: 1 },
	},
	reviews: {
		'concepts/how-models-work#what-the-model-does': { stage: 1, due: TODAY, last: null, history: [], revision: 1 },
		'concepts/how-models-work#name-the-failure': { stage: 1, due: TODAY, last: null, history: [], revision: 1 },
	},
};

test('finish is enabled once every checkpoint is passed, and persists across a reload', async ({ page }) => {
	await page.goto('concepts/how-models-work/');
	const finish = page.locator('[data-finish]');
	await expect(finish).toBeDisabled();
	await answerChoice(page, 'what-the-model-does');
	await expect(finish).toBeDisabled();
	await answerChoice(page, 'name-the-failure');
	await expect(finish).toBeEnabled();
	await finish.click();
	await expect(finish).toHaveText(/^Finished ✓ \(\d{4}-\d{2}-\d{2}\)$/);
	await page.reload();
	await expect(finish).toHaveText(/^Finished ✓/);
	await expect(finish).toBeDisabled();
	const record = await storedRecord(page);
	expect(Object.keys(record.reviews ?? {})).toHaveLength(2);
});

test('the finish note counts the open checkpoints', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	await expect(page.locator('[data-finish-note]')).toHaveText('Pass or skip 3 more checkpoints to finish this lesson.');
	await expect(page.locator('.recap-sources')).toHaveCount(0);
	await expect(page.locator('.recap-next')).toHaveCount(0);
});

test('the course page shows the finished node, the ring and the review card', async ({ page, seed }) => {
	await seed(finished);
	await page.goto('concepts/');
	// `a[data-node]`: a coming (planned) lesson renders as `span[data-node]` and has no progress state.
	await expect(page.locator('a[data-node]')).toHaveAttribute('data-state', 'finished');
	await expect(page.locator('[data-ring-label]')).toHaveText('100%');
	await expect(page.locator('[data-review-card]')).toHaveText('Review due: 2 items');
});

test('nothing due shows a linked review card', async ({ page }) => {
	await page.goto('concepts/');
	await expect(page.locator('[data-review-card]')).toHaveText('Review: nothing due yet');
	await expect(page.locator('[data-review-card] a')).toHaveAttribute('href', '/ai-training/concepts/review/');
});

test('the topic map colors covered topics by lesson state', async ({ page, seed }) => {
	await seed(finished);
	await page.goto('map/');
	expect(await page.locator('.topic-node').count()).toBeGreaterThan(0);
	expect(await page.locator('.topic-node[data-state=finished]').count()).toBeGreaterThan(0);
});

test('the progress page exports, resets and imports the record', async ({ page, seed, seedRaw }) => {
	await seed(finished);
	// A leftover version 1 record: reset must remove it too, or the next load would migrate it back.
	await seedRaw(1, { version: 1, lessons: { 'concepts/how-models-work': { state: 'read', at: TODAY } } });
	await page.goto('progress/');
	expect(await page.locator('.progress-course').count()).toBeGreaterThan(0);
	expect(await page.locator('.progress-lesson').count()).toBeGreaterThan(0);
	await expect(page.locator('[data-progress-review=concepts]')).toHaveText('Review due: 2 items');
	const before = await page.locator('[data-dump]').textContent();

	const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export]').click()]);
	const file = await download.path();

	page.once('dialog', (d) => d.accept());
	await page.locator('[data-reset]').click();
	await expect(page.locator('[data-message]')).toHaveText('Progress reset.');
	expect(JSON.parse((await page.locator('[data-dump]').textContent()) ?? '{}').lessons).toEqual({});
	// Both keys are gone. (No reload here: the seed init script would write them again on the next navigation.)
	expect(await storedRecord(page, storageKeyFor(1))).toEqual({});
	expect(await storedRecord(page)).toEqual({});

	page.once('dialog', (d) => d.accept());
	await page.locator('[data-import]').setInputFiles(file);
	await expect(page.locator('[data-message]')).toHaveText('Imported.');
	await expect(page.locator('[data-dump]')).toHaveText(before ?? '');
});
