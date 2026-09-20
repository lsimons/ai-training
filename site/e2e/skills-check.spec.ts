/** The skills check card at the top of a lesson for comfort level `more` (spec S04 "Skills check"). */
import { expect, STORAGE_KEY, storedRecord, test } from './fixtures';

const LESSON = 'building-agents/agent-loop';
const FIRST = 'predict-tool-call';
const SECOND = 'predict-loop';

test('comfort more: a pass in the card passes the body checkpoint and schedules its review', async ({ page, seed }) => {
	await seed({ comfort: 'more' });
	await page.goto(`${LESSON}/`);
	const card = page.locator('[data-skills-check]');
	await expect(card).toBeVisible();
	await expect(card.locator('[data-skills-title]')).toHaveText('Skip ahead?');
	await expect(card.locator('[data-skills-items]')).toBeHidden();
	await card.getByRole('button', { name: 'Answer 2 questions' }).click();

	// The copies are the two chosen checkpoints, one per served objective, without Skip.
	const copies = card.locator('[data-skills-item]');
	await expect(copies).toHaveCount(2);
	await expect(copies.locator('.cp-skip')).toHaveCount(0);
	// The lesson body still has exactly one section per id.
	await expect(page.locator(`#${FIRST}`)).toHaveCount(1);

	const first = card.locator(`[data-skills-item="${FIRST}"]`);
	await first.locator('textarea').fill('27°C, sun');
	await first.locator('.cp-check').click();
	await expect(first).toHaveAttribute('data-state', 'passed');
	await expect(first.locator('.cp-check')).toBeDisabled();
	await expect(page.locator(`#${FIRST}`)).toHaveAttribute('data-state', 'passed');
	await expect(card.locator('[data-skills-note]')).toHaveText('Passed 1 of 1 so far.');

	// A fail records `attempted` and creates no review item.
	const second = card.locator(`[data-skills-item="${SECOND}"]`);
	await second.locator('textarea').fill('wrong');
	await second.locator('.cp-check').click();
	await expect(second).toHaveAttribute('data-state', 'attempted');
	await expect(page.locator(`#${SECOND}`)).toHaveAttribute('data-state', 'attempted');
	await expect(card.locator('[data-skills-note]')).toContainText('Passed 1 of 2.');
	await expect(card.getByRole('button', { name: 'Close' })).toBeVisible();

	const record = await storedRecord(page);
	expect(record.checkpoints?.[`${LESSON}#${FIRST}`]).toEqual({ state: 'passed', attempts: 1 });
	expect(record.checkpoints?.[`${LESSON}#${SECOND}`]).toEqual({ state: 'attempted', attempts: 1 });
	// Comfort `more` enters review at stage 2 (spec S05 "Schedule").
	expect(record.reviews?.[`${LESSON}#${FIRST}`]).toMatchObject({ stage: 2, last: null, history: [], revision: 1 });
	expect(record.reviews?.[`${LESSON}#${SECOND}`]).toBeUndefined();

	// The body copy can still be retried, as in any lesson.
	const body = page.locator(`#${SECOND}`);
	await body.locator('textarea').fill('It is 14°C, rain there.');
	await body.locator('.cp-check').click();
	await expect(body).toHaveAttribute('data-state', 'passed');

	await card.getByRole('button', { name: 'Close' }).click();
	await expect(card).toBeHidden();
});

test('comfort more: the card skips passed checkpoints and stays hidden when all are passed', async ({ page, seed }) => {
	await seed({
		comfort: 'more',
		checkpoints: {
			[`${LESSON}#${FIRST}`]: { state: 'passed', attempts: 1 },
		},
	});
	await page.goto(`${LESSON}/`);
	const card = page.locator('[data-skills-check]');
	await expect(card).toBeVisible();
	await card.getByRole('button', { name: 'Answer 1 question' }).click();
	await expect(card.locator('[data-skills-item]')).toHaveCount(1);
	await expect(card.locator(`[data-skills-item="${SECOND}"]`)).toBeVisible();

	await card.getByRole('button', { name: 'Not now' }).click();
	await expect(card).toBeHidden();

	// With every chosen checkpoint passed, no check is offered.
	await page.evaluate(
		([key, id]) => {
			const record = JSON.parse(localStorage.getItem(key) ?? '{}');
			record.checkpoints[id] = { state: 'passed', attempts: 1 };
			localStorage.setItem(key, JSON.stringify(record));
		},
		[STORAGE_KEY, `${LESSON}#${SECOND}`] as const,
	);
	await page.goto(`${LESSON}/`);
	await expect(page.locator('[data-skills-check]')).toBeHidden();
});

test('comfort less: no card', async ({ page, seed }) => {
	await seed({ comfort: 'less' });
	await page.goto(`${LESSON}/`);
	await expect(page.locator('[data-skills-check]')).toBeHidden();
	await expect(page.locator('[data-skills-item]')).toHaveCount(0);
});

test('without a comfort level the card stays hidden', async ({ page }) => {
	await page.goto(`${LESSON}/`);
	await expect(page.locator('[data-skills-check]')).toBeHidden();
});

test('a Foundations lesson renders no card even for comfort more', async ({ page, seed }) => {
	await seed({ comfort: 'more' });
	await page.goto('concepts/how-models-work/');
	await expect(page.locator('[data-skills-check]')).toHaveCount(0);
});
