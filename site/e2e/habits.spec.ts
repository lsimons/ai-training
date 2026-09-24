/** The habit layer (spec S07): the lesson card, the course review page block, the progress page lines and the import migration. */
import { expect, lessonCheckpoints, storedRecord, test, VERSION } from './fixtures';

// Local calendar day, as progress-model.ts `today()` builds it (see progress.spec.ts).
const pad = (n: number) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const LESSON = 'safety/agent-risk';
const HABITS = [`${LESSON}#name-the-blast-radius`, `${LESSON}#check-the-diff-first`];
// The `first` checkpoints of the lesson, from its source, so a new checkpoint changes no literal here.
const passed = Object.fromEntries(
	lessonCheckpoints(LESSON)
		.filter((c) => c.phase === 'first')
		.map((c) => [`${LESSON}#${c.id}`, { state: 'passed' as const, attempts: 1 }]),
);

test('finishing the lesson enters its habits, and Done on a due habit moves it on everywhere', async ({
	page,
	seed,
}) => {
	await seed({ checkpoints: passed });
	await page.goto(`${LESSON}/`);
	const cards = page.locator('[data-habit]');
	await expect(cards).toHaveCount(2);
	await expect(cards.first()).toHaveAttribute('data-state', 'unfinished');
	await expect(cards.first().locator('[data-habit-actions]')).toBeHidden();

	// Finish through the recap button: the lesson script collects the habit ids from the cards.
	await page.locator('[data-finish]').click();
	await expect(page.locator('[data-finish]')).toHaveText(/^Finished ✓/);
	await expect(cards.first()).toHaveAttribute('data-state', 'waiting');
	let record = await storedRecord(page);
	expect(Object.keys(record.habits ?? {}).sort()).toEqual([...HABITS].sort());
	for (const id of HABITS) expect(record.habits?.[id]).toMatchObject({ since: TODAY, history: [] });

	// Move both habits to due today, as the day after the finish would.
	await page.evaluate(
		([key, ids, day]) => {
			const r = JSON.parse(localStorage.getItem(key) ?? '{}');
			for (const id of ids) r.habits[id].next = day;
			localStorage.setItem(key, JSON.stringify(r));
		},
		[`ai-training-progress-v${VERSION}`, HABITS, TODAY] as const,
	);
	await page.reload();
	await expect(cards.first()).toHaveAttribute('data-state', 'due');
	await expect(cards.first().locator('[data-habit-done]')).toBeVisible();

	// The course review page lists both above the items; Skip on one records it there.
	await page.goto('safety/review/');
	const block = page.locator('.review [data-habits]');
	await expect(block).toBeVisible();
	await expect(block.locator('[data-habit]')).toHaveCount(2);
	const first = block.locator(`[data-habit][data-progress-id="${HABITS[0]}"]`);
	await expect(first.locator('.habit-text')).toContainText('The next time you hand an agent a task');
	await first.locator('[data-habit-skip]').click();
	await expect(first).toHaveAttribute('data-state', 'waiting');
	await expect(first.locator('[data-habit-results] li')).toHaveText(`${TODAY}: skipped`);

	// Done on the other one from the lesson card.
	await page.goto(`${LESSON}/`);
	const second = page.locator(`[data-habit][data-progress-id="${HABITS[1]}"]`);
	await expect(second).toHaveAttribute('data-state', 'due');
	await second.locator('[data-habit-done]').click();
	await expect(second).toHaveAttribute('data-state', 'waiting');
	await expect(second.locator('[data-habit-status]')).toHaveText(/^Next on \d{4}-\d{2}-\d{2}\.$/);
	record = await storedRecord(page);
	expect(record.habits?.[HABITS[0] ?? '']).toMatchObject({ history: [{ at: TODAY, result: 'skipped' }] });
	expect(record.habits?.[HABITS[1] ?? '']).toMatchObject({ history: [{ at: TODAY, result: 'done' }] });

	// Nothing due: the review page shows no habit block.
	await page.goto('safety/review/');
	await expect(page.locator('.review [data-habits]')).toBeHidden();
	await expect(page.locator('.review [data-habits] [data-habit]')).toHaveCount(0);

	// The progress page shows one line per active habit with the result so far.
	await page.goto('progress/');
	const lines = page.locator('[data-progress-habit]');
	await expect(lines).toHaveCount(2);
	await expect(page.locator(`[data-progress-habit="${HABITS[0]}"] .progress-habit-when`)).toHaveText(
		/^Next on \d{4}-\d{2}-\d{2}\. So far: skipped\.$/,
	);
	await expect(page.locator(`[data-progress-habit="${HABITS[1]}"] .progress-habit-when`)).toHaveText(
		/^Next on \d{4}-\d{2}-\d{2}\. So far: done\.$/,
	);
});

test('a version 2 export file imports with an empty habits map', async ({ page }) => {
	const v2Record = {
		version: 2,
		goals: [],
		lessons: { 'concepts/how-models-work': { state: 'finished', at: '2026-03-10' } },
		checkpoints: { 'concepts/how-models-work#what-the-model-does': { state: 'passed', attempts: 1 } },
		reviews: {
			'concepts/how-models-work#what-the-model-does': {
				stage: 1,
				due: '2026-03-11',
				last: null,
				history: [],
				revision: 1,
			},
		},
		practice: {},
		quizzes: {},
	};
	await page.goto('progress/');
	page.once('dialog', (d) => d.accept());
	await page.locator('[data-import]').setInputFiles({
		name: 'ai-training-progress-2026-03-10.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(v2Record, null, 2)),
	});
	await expect(page.locator('[data-message]')).toHaveText('Imported.');
	const dump = JSON.parse((await page.locator('[data-dump]').textContent()) ?? '{}');
	expect(dump.version).toBe(VERSION);
	expect(dump.habits).toEqual({});
	expect(dump.reviews).toEqual(v2Record.reviews);
	await expect(page.locator('[data-progress-habit]')).toHaveCount(0);
});
