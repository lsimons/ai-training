/** The settings page's review schedule and the review page (spec S05). */
import { expect, orderByDrag, storedRecord, test } from './fixtures';

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
	// The author's `context` is hidden in the lesson and shown here (spec S03 "Checkpoints").
	await expect(cp.locator('.cp-context')).toBeVisible();

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

test('the review page clones an order checkpoint that drags like the lesson copy', async ({ page, seed }) => {
	const item = 'building-agents/agent-loop#order-the-loop';
	await seed({
		lessons: { 'building-agents/agent-loop': { state: 'finished', at: TODAY } },
		reviews: { [item]: { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 } },
	});
	await page.goto('building-agents/review/');
	const cp = page.locator('.review [data-checkpoint]');
	await expect(cp).toHaveAttribute('data-kind', 'order');
	const items = cp.locator('ol li');
	await expect(items.first()).toHaveAttribute('draggable', 'true');
	await expect(items.first()).toHaveCSS('cursor', 'grab');
	await orderByDrag(page, items);
	await cp.locator('.cp-check').first().click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct order.');
	await expect(cp.locator('.cp-stage-label')).toHaveText('stage 2 of 5');
	const record = await storedRecord(page);
	const history = (record.reviews?.[item] as { history: { result: string }[] } | undefined)?.history ?? [];
	expect(history.map((h) => h.result)).toEqual(['pass']);
});

// The worked example of review alternates (spec S05 "Which checkpoint a review asks"): one `review` alternate,
// a multi-choice, shares the objective of this choice checkpoint.
const ALT_LESSON = 'concepts/straight-answer';
const OWN_ID = 'hide-the-preference';
const OWN = `${ALT_LESSON}#${OWN_ID}`;
const ALTERNATE = 'spot-the-sycophancy';

function dueWith(history: { at: string; result: 'pass' | 'fail'; served?: string }[]) {
	return {
		lessons: { [ALT_LESSON]: { state: 'finished' as const, at: TODAY } },
		reviews: { [OWN]: { stage: 1, due: '2000-01-01', last: null, history, revision: 1 } },
	};
}

test('the review page asks an alternate never asked before in place of the item, and records it as served', async ({
	page,
	seed,
}) => {
	await seed(dueWith([]));
	await page.goto('concepts/review/');
	const cp = page.locator('.review [data-checkpoint]');
	await expect(cp).toBeVisible();
	await expect(cp).toHaveAttribute('id', ALTERNATE);
	await expect(cp).toHaveAttribute('data-kind', 'multi-choice');
	// The result is the item's: the copy is keyed on the item's progress id and links to the item's own checkpoint.
	await expect(cp).toHaveAttribute('data-progress-id', OWN);
	await expect(cp.locator('.cp-context')).toBeVisible();
	await expect(cp.locator('.cp-lesson-link')).toHaveAttribute('href', `/ai-training/${ALT_LESSON}/#${OWN_ID}`);
	for (const label of await cp.locator('label[data-correct]').all()) await label.click();
	await cp.locator('.cp-check').first().click();
	await expect(cp.locator('.cp-feedback')).toHaveText('Correct.');
	await expect(cp.locator('.cp-stage-label')).toHaveText('stage 2 of 5');

	const record = await storedRecord(page);
	const history =
		(record.reviews?.[OWN] as { history: { result: string; served?: string }[] } | undefined)?.history ?? [];
	expect(history.map(({ result, served }) => ({ result, served }))).toEqual([{ result: 'pass', served: ALTERNATE }]);
	expect(Object.keys(record.reviews ?? {})).toEqual([OWN]);
	expect(record.checkpoints?.[OWN]).toBeUndefined();
});

test("once every alternate was asked, the review page asks the item's own checkpoint", async ({ page, seed }) => {
	await seed(dueWith([{ at: '2000-01-01', result: 'pass', served: ALTERNATE }]));
	await page.goto('concepts/review/');
	const cp = page.locator('.review [data-checkpoint]');
	await expect(cp).toBeVisible();
	await expect(cp).toHaveAttribute('id', OWN_ID);
	await expect(cp).toHaveAttribute('data-kind', 'choice');
	await expect(cp).not.toHaveAttribute('data-served');
	await cp.locator('label[data-correct]').click();
	await cp.locator('.cp-check').first().click();
	await expect(cp.locator('.cp-stage-label')).toHaveText('stage 2 of 5');
	const record = await storedRecord(page);
	const history =
		(record.reviews?.[OWN] as { history: { result: string; served?: string }[] } | undefined)?.history ?? [];
	expect(history.map((h) => h.served ?? null)).toEqual([ALTERNATE, null]);
});

test('one review session never asks the same alternate for two items', async ({ page, seed }) => {
	// Both checkpoints of the objective are due, and the one alternate matches both by objective.
	const other = `${ALT_LESSON}#reversal-under-pushback`;
	const item = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
	await seed({
		lessons: { [ALT_LESSON]: { state: 'finished', at: TODAY } },
		reviews: { [OWN]: item, [other]: item },
	});
	await page.goto('concepts/review/');
	const cp = page.locator('.review [data-checkpoint]');
	await expect(page.locator('[data-status]')).toHaveText('Item 1 of 2');
	await expect(cp).toHaveAttribute('id', ALTERNATE);
	for (const label of await cp.locator('label[data-correct]').all()) await label.click();
	await cp.locator('.cp-check').first().click();
	await page.getByRole('button', { name: 'Next item' }).click();
	await expect(page.locator('[data-status]')).toHaveText('Item 2 of 2');
	// The alternate is taken, so the second item asks its own checkpoint.
	await expect(cp).toHaveAttribute('id', 'reversal-under-pushback');
	await expect(cp).not.toHaveAttribute('data-served');
});
