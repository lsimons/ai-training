/** Every checkpoint kind, graded in a lesson page (spec S01 "Interaction types", S03 "Checkpoints"). */
import { expect, storedRecord, test } from './fixtures';

test('choice: a wrong pick shows its why, the right one passes', async ({ page }) => {
	await page.goto('concepts/how-models-work/');
	const cp = page.locator('#what-the-model-does');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Pick an answer first.');
	await cp.locator('label').nth(2).click();
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText(
		'Search is a separate tool some products add on top. The model itself only predicts tokens; it has no built-in search.',
	);
	await expect(cp).toHaveAttribute('data-state', 'attempted');
	await cp.locator('label[data-correct]').click();
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
	const record = await storedRecord(page);
	expect(record.checkpoints?.['concepts/how-models-work#what-the-model-does']).toEqual({
		state: 'passed',
		attempts: 2,
	});
});

test('hint toggles and skip records a skip', async ({ page }) => {
	await page.goto('concepts/how-models-work/');
	const cp = page.locator('#what-the-model-does');
	await expect(cp.locator('.cp-hint')).toBeHidden();
	await cp.locator('.cp-hint-btn').click();
	await expect(cp.locator('.cp-hint')).toBeVisible();
	await cp.locator('.cp-skip').click();
	await expect(cp).toHaveAttribute('data-state', 'skipped');
	await expect(cp.locator('.cp-feedback')).toContainText('Skipped');
});

test('predict: normalized comparison, the answer is revealed on a pass', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	const cp = page.locator('#predict-tool-call');
	await expect(cp.locator('.cp-after')).toBeHidden();
	await expect(cp.locator('.cp-stage')).toBeHidden();
	await cp.locator('textarea').fill('27°C, rain');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Not quite. Trace it once more.');
	await cp.locator('textarea').fill(' 27°c, sun');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct. That is exactly the output.');
	await expect(cp.locator('.cp-reveal')).toBeVisible();
});

test('order: opens shuffled and passes once sorted', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	const cp = page.locator('#order-the-loop');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Not the right order yet.');
	const items = cp.locator('ol li');
	const count = await items.count();
	for (let pos = 1; pos <= count; pos++) {
		for (let k = 0; k < count; k++) {
			const idx = await items.evaluateAll(
				(lis, p) => lis.findIndex((l) => Number((l as HTMLElement).dataset.pos) === p),
				pos,
			);
			if (idx > pos - 1) await items.nth(idx).locator('button[data-move=up]').click();
		}
	}
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct order.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
});

test('sort: select a chip, then a bucket; all correct passes', async ({ page }) => {
	await page.goto('using-agents/delegating/');
	const cp = page.locator('#autonomy-levels');
	const chips = cp.locator('.cp-pool .cp-chip');
	const count = await chips.count();
	expect(count).toBeGreaterThanOrEqual(2);
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText(`${count} items still to place.`);
	for (let i = 0; i < count; i++) {
		const chip = chips.first();
		const bucket = await chip.getAttribute('data-bucket');
		await chip.click();
		await cp.locator(`.cp-bucket[data-bucket="${bucket}"] .cp-bucket-target`).click();
	}
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('All placed correctly.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
});

test('repair: reveal the model answer, then self-grade', async ({ page }) => {
	await page.goto('using-agents/delegating/');
	const cp = page.locator('#fix-the-brief');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Write your fix, then reveal the model answer and compare.');
	await cp.locator('.cp-reveal-btn').click();
	await expect(cp.locator('.cp-model')).toBeVisible();
	await cp.locator('input[value=pass]').check();
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Recorded as a pass.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
});

test('scenario and honor-system predict in the safety lesson', async ({ page }) => {
	await page.goto('safety/agent-risk/');
	const scenario = page.locator('#blast-radius-of-a-tidy-up');
	await scenario.locator('label').first().click();
	await scenario.locator('.cp-check').click();
	await expect(scenario.locator('.cp-feedback')).not.toBeEmpty();

	const honor = page.locator('#predict-the-planted-instruction');
	await expect(honor).toHaveAttribute('data-reviewable', 'false');
	await honor.locator('textarea').fill('it will write the file');
	await honor.locator('input[value=pass]').check();
	await honor.locator('.cp-check').click();
	await expect(honor.locator('.cp-feedback')).toHaveText('Recorded as a pass.');
});

test('the coding lesson marks which examples CI verifies', async ({ page }) => {
	await page.goto('coding-with-agents/first-session/');
	await expect(page.locator('[data-checkpoint]')).toHaveCount(4);
	await expect(page.locator('.cp-verified')).toHaveCount(3);
});
