/** The learner's reference (spec S02 "Learner's reference"): topic pages unlock per finished lesson, and /reference/ lists them. */
import { expect, test } from './fixtures';

const pad = (n: number) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const finishedAgentLoop = {
	lessons: {
		'building-agents/agent-loop': { state: 'finished' as const, at: TODAY },
		// Skipped does not unlock (spec S02 "Unlock rule").
		'concepts/how-models-work': { state: 'skipped' as const, at: TODAY },
	},
};

test('a finished lesson shows its takeaways and example on the topic page', async ({ page, seed }) => {
	await seed(finishedAgentLoop);
	await page.goto('topics/building-agents/agent-loop/');
	const section = page.locator('[data-reference-lesson="building-agents/agent-loop"]');
	await expect(section).toHaveAttribute('data-unlocked', 'true');
	await expect(section.locator('[data-reference-locked]')).toBeHidden();
	await expect(section.locator('.reference-takeaways li').first()).toContainText(
		'A tool is a function plus a description written for the model.',
	);
	await expect(section.locator('.reference-predict pre code')).toContainText(
		'print(TOOLS["get_weather"]["fn"]("Lisbon"))',
	);
	await expect(section.locator('.reference-answer')).toContainText('27°C, sun');
});

test('an unfinished lesson keeps the unlock note, also when it was skipped', async ({ page, seed }) => {
	await seed(finishedAgentLoop);
	await page.goto('topics/concepts/how-models-work/');
	const section = page.locator('[data-reference-lesson="concepts/how-models-work"]');
	await expect(section).toHaveAttribute('data-unlocked', 'false');
	await expect(section.locator('[data-reference-locked]')).toHaveText(
		'Unlocks when you finish How a language model works.',
	);
	await expect(section.locator('[data-reference-locked] a')).toHaveAttribute(
		'href',
		'/ai-training/concepts/how-models-work/',
	);
	await expect(section.locator('.reference-takeaways')).toBeHidden();
});

test('the reference page lists finished lessons by area and links to the topic page', async ({ page, seed }) => {
	await seed(finishedAgentLoop);
	await page.goto('reference/');
	await expect(page.locator('[data-reference-empty]')).toBeHidden();
	await expect(page.locator('[data-reference-area]')).toHaveCount(1);
	await expect(page.locator('[data-reference-area="building-agents"] h2')).toHaveText('Building agents');
	const item = page.locator('[data-reference-finished="building-agents/agent-loop"]');
	await expect(item.locator('a').first()).toHaveAttribute('href', '/ai-training/building-agents/agent-loop/');
	await expect(item.locator('a').last()).toHaveAttribute(
		'href',
		'/ai-training/topics/building-agents/agent-loop/#reference',
	);
	await item.locator('a').last().click();
	await expect(page.locator('[data-reference-lesson="building-agents/agent-loop"]')).toHaveAttribute(
		'data-unlocked',
		'true',
	);
});

test('the reference page shows the empty state without progress, and the sidebar links to it', async ({ page }) => {
	await page.goto('progress/');
	const link = page.locator('nav.sidebar a', { hasText: 'Your reference' });
	await expect(link).toHaveAttribute('href', '/ai-training/reference/');
	await link.click();
	await expect(page.locator('[data-reference-empty]')).toBeVisible();
	await expect(page.locator('[data-reference-area]')).toHaveCount(0);
});
