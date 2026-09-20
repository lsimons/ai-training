/** Routing cards driven by the comfort level and by checkpoint results (spec S02 "Differentiation by routing"). */
import { expect, test } from './fixtures';

test('the comfort level is set on the settings page, not on a lesson', async ({ page }) => {
	await page.goto('settings/');
	const less = page.locator('[data-comfort=less]');
	await expect(less).toHaveCount(1);
	await less.click();
	await expect(less).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('[data-comfort-note]')).toHaveText('Set: less comfortable.');
	await less.click();
	await expect(less).toHaveAttribute('aria-pressed', 'false');
	await page.goto('building-agents/agent-loop/');
	await expect(page.locator('[data-comfort]')).toHaveCount(0);
});

test('comfort less shows the behind card on an engineering lesson', async ({ page, seed }) => {
	await seed({ comfort: 'less' });
	await page.goto('building-agents/agent-loop/');
	await expect(page.locator('[data-route=behind]')).toBeVisible();
	await expect(page.locator('[data-route=ahead]')).toBeHidden();
});

test('comfort more shows the ahead card', async ({ page, seed }) => {
	await seed({ comfort: 'more' });
	await page.goto('building-agents/agent-loop/');
	await expect(page.locator('[data-route=ahead]')).toBeVisible();
	await expect(page.locator('[data-route=behind]')).toBeHidden();
});

test('without a comfort level both cards stay hidden until a checkpoint result', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	await expect(page.locator('[data-route=behind]')).toBeHidden();
	await expect(page.locator('[data-route=ahead]')).toBeHidden();
	// A miss surfaces the assumed objectives.
	const cp = page.locator('#predict-tool-call');
	await cp.locator('textarea').fill('wrong');
	await cp.locator('.cp-check').click();
	await expect(page.locator('[data-route=behind]')).toBeVisible();
	await expect(page.locator('[data-route=ahead]')).toBeHidden();
});

test('a lesson where every checkpoint passes first time shows the ahead card', async ({ page }) => {
	await page.goto('building-agents/agent-loop/');
	const first = page.locator('#predict-tool-call');
	await first.locator('textarea').fill('27°C, sun');
	await first.locator('.cp-check').click();
	await expect(first).toHaveAttribute('data-state', 'passed');
	const second = page.locator('#predict-loop');
	await second.locator('textarea').fill('It is 14°C, rain there.');
	await second.locator('.cp-check').click();
	await expect(second).toHaveAttribute('data-state', 'passed');
	const order = page.locator('#order-the-loop');
	const items = order.locator('ol li');
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
	await order.locator('.cp-check').click();
	await expect(order).toHaveAttribute('data-state', 'passed');
	await expect(page.locator('[data-route=ahead]')).toBeVisible();
	await expect(page.locator('[data-finish]')).toBeEnabled();
});
