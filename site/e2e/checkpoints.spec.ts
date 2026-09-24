/** Every checkpoint kind, graded in a lesson page (spec S01 "Interaction types", S03 "Checkpoints"). */
import { KIND_OF_TAG } from '../src/lib/checkpoint-rules';
import { drag, expect, lessonCheckpoints, orderByButtons, orderByDrag, storedRecord, test } from './fixtures';

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
	await orderByButtons(cp);
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct order.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
});

test('order: drag a row to its place, the arrows and the grader still agree', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	const cp = page.locator('#order-the-loop');
	const items = cp.locator('ol li');
	await expect(items.first()).toHaveAttribute('draggable', 'true');
	await expect(items.first()).toHaveCSS('cursor', 'grab');
	await expect(items.first().locator('button[data-move=up]')).toHaveCSS('cursor', 'pointer');
	const count = await items.count();
	await orderByDrag(page, items);
	await expect
		.poll(() => items.evaluateAll((lis) => lis.map((l) => Number((l as HTMLElement).dataset.pos))))
		.toEqual(Array.from({ length: count }, (_, i) => i + 1));
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct order.');
	// One drag out of place fails again.
	await drag(page, items.first(), items.last(), 0.9);
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Not the right order yet.');
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

test('sort: the dashed area places a selected chip, and chips drag between containers', async ({ page }) => {
	// The whole checkpoint must fit: a scroll during a drag changes which chip Chromium picks up.
	await page.setViewportSize({ width: 1280, height: 2000 });
	await page.goto('safety/responsible-use/');
	const cp = page.locator('#can-i-sort');
	await expect(cp.locator('.cp-pool-target')).toHaveText(
		'Unplaced (drag an item to a bucket, or select it and then click the bucket)',
	);
	const pool = cp.locator('.cp-pool');
	const chips = cp.locator('.cp-pool .cp-chip');
	const count = await chips.count();
	await expect(chips.first()).toHaveCSS('cursor', 'grab');
	await expect(chips.first()).toHaveAttribute('draggable', 'true');

	// Click the empty area below the title, with and without a selection.
	const items0 = cp.locator('.cp-bucket[data-bucket="0"] .cp-bucket-items');
	await items0.click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Select an item first, then a bucket.');
	await chips.first().click();
	await items0.click();
	await expect(items0.locator('.cp-chip')).toHaveCount(1);
	await expect(pool.locator('.cp-chip')).toHaveCount(count - 1);

	// Drag: pool to bucket 1, bucket 1 to bucket 2, bucket 2 back to the pool.
	const items1 = cp.locator('.cp-bucket[data-bucket="1"] .cp-bucket-items');
	const items2 = cp.locator('.cp-bucket[data-bucket="2"] .cp-bucket-items');
	const dragged = chips.first();
	const text = await dragged.textContent();
	await drag(page, dragged, items1);
	await expect(items1.locator('.cp-chip')).toHaveText([text ?? '']);
	await expect(cp.locator('.cp-chip[aria-pressed="true"]')).toHaveCount(0);
	await drag(page, items1.locator('.cp-chip'), items2);
	await expect(items2.locator('.cp-chip')).toHaveText([text ?? '']);
	await expect(items1.locator('.cp-chip')).toHaveCount(0);
	await drag(page, items2.locator('.cp-chip'), pool);
	await expect(items2.locator('.cp-chip')).toHaveCount(0);
	await expect(pool.locator('.cp-chip')).toHaveCount(count - 1);

	// Drag the rest into their buckets and grade.
	await drag(page, items0.locator('.cp-chip'), pool);
	for (let i = 0; i < count; i++) {
		const chip = chips.first();
		const bucket = await chip.getAttribute('data-bucket');
		await drag(page, chip, cp.locator(`.cp-bucket[data-bucket="${bucket}"] .cp-bucket-items`));
	}
	await expect(pool.locator('.cp-chip')).toHaveCount(0);
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

test('scenario: a wrong decision shows its consequence, the right one passes', async ({ page }) => {
	await page.goto('safety/agent-risk/');
	const scenario = page.locator('#blast-radius-of-a-tidy-up');
	await scenario.locator('label').first().click();
	await scenario.locator('.cp-check').click();
	await expect(scenario.locator('.cp-feedback')).not.toBeEmpty();

	const injection = page.locator('#before-the-agent-reads-the-page');
	await expect(injection).toHaveAttribute('data-reviewable', 'true');
	await injection.locator('label:not([data-correct])').first().click();
	await injection.locator('.cp-check').click();
	await expect(injection.locator('.cp-feedback')).toHaveText(/^One of the pages has a line in white text/);
	await injection.locator('label[data-correct]').click();
	await injection.locator('.cp-check').click();
	await expect(injection.locator('.cp-feedback')).toHaveText(/^Correct\. The agent summarizes the pages/);
	await expect(injection).toHaveAttribute('data-state', 'passed');
});

test('the coding lesson shows three ungraded examples CI verifies, and grades only the session', async ({ page }) => {
	await page.goto('coding-with-agents/first-session/');
	const examples = page.locator('[data-example]');
	await expect(examples).toHaveCount(3);
	await expect(page.locator('.cp-verified')).toHaveCount(3);
	// An example is not a checkpoint: no controls, no progress record, and the output is on the page.
	await expect(examples.locator('.cp-check')).toHaveCount(0);
	await expect(examples.locator('[data-checkpoint]')).toHaveCount(0);
	await expect(page.locator('#run-tests .example-output')).toHaveText('FAILED (failures=1)');
	// The graded checkpoints are the ones the page source has, kind by kind, and the examples are none of them.
	const checkpoints = lessonCheckpoints('coding-with-agents/first-session');
	expect(checkpoints.length).toBeGreaterThan(0);
	await expect(page.locator('[data-checkpoint]')).toHaveCount(checkpoints.length);
	for (const kind of Object.values(KIND_OF_TAG)) {
		const count = checkpoints.filter((c) => c.kind === kind).length;
		await expect(page.locator(`[data-checkpoint][data-kind="${kind}"]`)).toHaveCount(count);
	}
});

test('multi-choice: exactly the correct boxes, a wrong pick shows its why', async ({ page }) => {
	await page.goto('using-agents/delegating/');
	const cp = page.locator('#which-criteria-tick');
	await expect(cp).toHaveAttribute('data-reviewable', 'true');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Pick 3 answers first.');
	await cp.locator('label[data-correct]').first().click();
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('1 of 3 so far, and nothing wrong. 2 more to find.');
	await cp.locator('label:not([data-correct])').first().click();
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText(/^Clear to whom\?/);
	await cp.locator('label:not([data-correct])').first().click();
	for (const label of await cp.locator('label[data-correct]').all()) {
		if (!(await label.locator('input').isChecked())) await label.click();
	}
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct.');
	await expect(cp).toHaveAttribute('data-state', 'passed');
});

test('match: one select per row, per-row feedback, rationale on a full pass', async ({ page }) => {
	await page.goto('safety/agent-risk/');
	const cp = page.locator('#smallest-access');
	await expect(cp).toHaveAttribute('data-reviewable', 'true');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('3 rows still to fill.');
	const rows = cp.locator('.cp-match-row');
	for (const row of await rows.all()) await row.locator('select').selectOption('3');
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText('3 rows wrong. Each row says which.');
	await expect(rows.first()).toHaveAttribute('data-state', 'wrong');
	await expect(rows.first().locator('.cp-row-feedback')).toHaveText(/^A reply that is not sent yet/);
	for (const row of await rows.all()) {
		const option = await row.getAttribute('data-option');
		if (option) await row.locator('select').selectOption(option);
	}
	await cp.locator('.cp-check').click();
	await expect(cp.locator('.cp-feedback')).toHaveText(/^Correct\. In each case the task is done just as well/);
	await expect(cp).toHaveAttribute('data-state', 'passed');
});
