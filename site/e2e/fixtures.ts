/**
 * Shared test setup: every page blocks requests that leave the site under
 * test (web fonts and the like get an empty reply, so no spec waits on the
 * network), and any `pageerror` or console error fails the test. Specs
 * import `test` and `expect` from here instead of `@playwright/test`.
 */
import { test as base, expect, type Page } from '@playwright/test';

export const VERSION = 2;
export const storageKeyFor = (version: number) => `ai-training-progress-v${version}`;
export const STORAGE_KEY = storageKeyFor(VERSION);

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
