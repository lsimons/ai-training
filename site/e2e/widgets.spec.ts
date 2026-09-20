/** Interactive widgets embedded in lessons (site/src/components/widgets). */
import { expect, test } from './fixtures';

test('the sampler redraws its bars when the temperature changes', async ({ page }) => {
	await page.goto('concepts/how-models-work/');
	const sampler = page.locator('[data-sampler]');
	await sampler.locator('input[type=range]').fill('0.1');
	await expect(sampler.locator('.bar span:last-child').first()).not.toBeEmpty();
});

test('the instructions builder produces a file', async ({ page }) => {
	await page.goto('customizing-agents/instructions/');
	const builder = page.locator('.instructions-builder');
	await expect(builder).toHaveCount(1);
	await expect(builder.locator('pre')).not.toBeEmpty();
});
