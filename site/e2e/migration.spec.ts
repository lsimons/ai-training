/** A version 1 progress record, in local storage or in an import file, migrates to version 2 (spec S04 "Storage"). */
import { expect, storageKeyFor, storedRecord, test, VERSION } from './fixtures';

const ITEM = 'concepts/how-models-work#what-the-model-does';
const OTHER = 'concepts/how-models-work#name-the-failure';

/** Hand-written as the site stored it at version 1: `history` holds bare results. */
const v1Record = {
	version: 1,
	comfort: 'more',
	goals: [],
	lessons: { 'concepts/how-models-work': { state: 'finished', at: '2026-03-10' } },
	checkpoints: { [ITEM]: { state: 'passed', attempts: 1 }, [OTHER]: { state: 'passed', attempts: 2 } },
	reviews: {
		// Passed into stage 2, which is due 3 days after the answer.
		[ITEM]: { stage: 2, due: '2999-03-13', last: 'pass', history: ['fail', 'pass'], revision: 1 },
		// Failed on 2026-03-10, due the next day.
		[OTHER]: { stage: 1, due: '2026-03-11', last: 'fail', history: ['fail'], revision: 1 },
	},
	quizzes: {},
};

const migratedReviews = {
	[ITEM]: {
		stage: 2,
		due: '2999-03-13',
		last: 'pass',
		history: [
			{ at: '2999-03-10', result: 'fail' },
			{ at: '2999-03-10', result: 'pass' },
		],
		revision: 1,
	},
	[OTHER]: {
		stage: 1,
		due: '2026-03-11',
		last: 'fail',
		history: [{ at: '2026-03-10', result: 'fail' }],
		revision: 1,
	},
};

test('a version 1 record in local storage migrates on load and keeps its schedule', async ({ page, seedRaw }) => {
	await seedRaw(1, v1Record);
	await page.goto('settings/');
	await expect(page.locator('[data-review-item]')).toHaveCount(2);
	await expect(page.locator('[data-due-now] a')).toHaveText('Concepts (1)');
	const item = page.locator(`[data-review-item="${ITEM}"]`);
	await expect(item.locator('.cp-stage-label')).toHaveText('stage 2 of 5, due 2999-03-13');
	await expect(item.locator('.schedule-history')).toHaveText('2 answered, last pass on 2999-03-10');
	await expect(page.locator(`[data-review-item="${OTHER}"] .schedule-history`)).toHaveText(
		'1 answered, last fail on 2026-03-10',
	);

	const record = await storedRecord(page);
	expect(record.version).toBe(VERSION);
	expect(record.comfort).toBe('more');
	expect(record.lessons).toEqual(v1Record.lessons);
	expect(record.checkpoints).toEqual(v1Record.checkpoints);
	expect(record.reviews).toEqual(migratedReviews);
	// The old key stays for a manual export.
	expect(await storedRecord(page, storageKeyFor(1))).toEqual(v1Record);
});

test('a version 1 export file imports through the migration', async ({ page }) => {
	await page.goto('progress/');
	page.once('dialog', (d) => d.accept());
	await page.locator('[data-import]').setInputFiles({
		name: 'ai-training-progress-2026-03-10.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(v1Record, null, 2)),
	});
	await expect(page.locator('[data-message]')).toHaveText('Imported.');
	const dump = JSON.parse((await page.locator('[data-dump]').textContent()) ?? '{}');
	expect(dump.version).toBe(VERSION);
	expect(dump.reviews).toEqual(migratedReviews);
	await expect(page.locator('[data-progress-review=concepts]')).toHaveText('Review due: 1 item');
});
