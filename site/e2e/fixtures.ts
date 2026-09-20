/**
 * Shared test setup: every page blocks requests that leave the site under
 * test (web fonts and the like get an empty reply, so no spec waits on the
 * network), and any `pageerror` or console error fails the test. Specs
 * import `test` and `expect` from here instead of `@playwright/test`.
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { STORAGE_KEY, storageKeyFor, VERSION } from '../src/scripts/progress-model';

export { STORAGE_KEY, storageKeyFor, VERSION };

/** A partial progress record to seed before the first navigation. */
export interface Seed {
	comfort?: 'less' | 'more';
	lessons?: Record<string, { state: 'read' | 'finished' | 'skipped'; at: string }>;
	checkpoints?: Record<string, { state: 'passed' | 'skipped' | 'attempted'; attempts: number }>;
	reviews?: Record<
		string,
		{
			stage: number | 'done';
			due: string;
			last: null | 'pass' | 'fail';
			history: { at: string; result: 'pass' | 'fail' }[];
			revision?: number;
		}
	>;
}

export const test = base.extend<{
	errors: string[];
	seed: (seed: Seed) => Promise<void>;
	seedRaw: (version: number, record: object) => Promise<void>;
}>({
	// `auto: true` runs this for every test, so no spec has to ask for it.
	errors: [
		async ({ page }, use) => {
			const errors: string[] = [];
			await page.route('**/*', (route) => {
				const url = route.request().url();
				if (url.startsWith('http://localhost:')) return route.continue();
				return route.fulfill({ status: 204, body: '' });
			});
			page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
			page.on('console', (m) => {
				if (m.type() === 'error') errors.push(`console: ${m.text()}`);
			});
			await use(errors);
			expect(errors, 'no page or console errors').toEqual([]);
		},
		{ auto: true },
	],
	/** Store a record as it is, under the key for `version`, for tests of the migration path. */
	seedRaw: async ({ page }, use) => {
		await use(async (version, record) => {
			await page.addInitScript(
				([key, value]) => {
					if (!localStorage.getItem(key)) localStorage.setItem(key, value);
				},
				[storageKeyFor(version), JSON.stringify(record)] as const,
			);
		});
	},
	seed: async ({ seedRaw }, use) => {
		await use(async (seed) => {
			await seedRaw(VERSION, {
				version: VERSION,
				goals: [],
				lessons: {},
				checkpoints: {},
				reviews: {},
				quizzes: {},
				...seed,
			});
		});
	},
});

export { expect };

/** The stored progress record as the page sees it, under this version's key unless another is given. */
export async function storedRecord(page: Page, key = STORAGE_KEY): Promise<Record<string, Record<string, unknown>>> {
	return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), key);
}

/** Answer a choice or scenario checkpoint with its correct option and press Check. */
export async function answerChoice(page: Page, id: string) {
	const cp = page.locator(`#${id}`);
	await cp.locator('label[data-correct]').click();
	await cp.locator('.cp-check').click();
	await expect(cp).toHaveAttribute('data-state', 'passed');
}

/**
 * A native drag with the mouse. `Locator.dragTo` moves the pointer once, and
 * Chromium then sometimes skips the `drop`, so this moves in steps and nudges
 * once more over the target. `targetY` is the fraction of the target's height
 * to point at: 0.5 is its middle, near 0 its top edge.
 */
export async function drag(page: Page, source: Locator, target: Locator, targetY = 0.5) {
	// Both must be on screen at once: `page.mouse` works in viewport coordinates and a scroll mid-drag
	// changes which element Chromium picks up. The sort test sets a tall viewport for this reason.
	await target.scrollIntoViewIfNeeded();
	await source.scrollIntoViewIfNeeded();
	const s = await source.boundingBox();
	const t = await target.boundingBox();
	if (!s || !t) throw new Error('drag: source or target has no box');
	const view = page.viewportSize();
	if (!view || s.y < 0 || t.y < 0 || s.y + s.height > view.height || t.y + t.height > view.height) {
		throw new Error('drag: source and target do not fit the viewport together');
	}
	await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
	await page.mouse.down();
	await page.mouse.move(t.x + t.width / 2, t.y + t.height * targetY, { steps: 5 });
	await page.mouse.move(t.x + t.width / 2 + 1, t.y + t.height * targetY, { steps: 2 });
	await page.mouse.up();
}
