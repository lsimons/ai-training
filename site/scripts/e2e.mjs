/**
 * Browser walkthrough of every release-1 mechanism (spec S06 "What release 1
 * exercises") against a built site. Run with `mise run site-e2e`; needs
 * `mise run site-browser` once. Exits non-zero on any page error or failed
 * assertion. Screenshots land in /tmp/ai-training-e2e-*.png.
 */
import { chromium } from 'playwright';
const B = `http://localhost:${process.env.PORT ?? 4399}/ai-training`;
const browser = await chromium.launch(); const page = await browser.newPage();
// Only the site under test: webfonts and other external requests get an empty reply, so the walkthrough never waits on the network.
await page.route('**/*', (r) => (r.request().url().startsWith(`http://localhost:`) ? r.continue() : r.fulfill({ status: 204, body: '' })));
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => m.type()==='error' && errs.push('CONSOLE ' + m.text()));
const log = (...a) => console.log(...a);
const fb = (cp) => cp.locator('.cp-feedback').textContent();

// Assertions collect failures and are reported at the end, so one miss does
// not hide the rest of the walkthrough.
const failures = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function expect(actual, expected, label) {
	const ok = expected instanceof RegExp ? expected.test(String(actual)) : typeof expected === 'function' ? expected(actual) : same(actual, expected);
	log(`${ok ? 'ok  ' : 'FAIL'} ${label}:`, actual);
	if (!ok) failures.push(`${label}: got ${JSON.stringify(actual)}, expected ${expected instanceof RegExp ? expected : typeof expected === 'function' ? '<predicate>' : JSON.stringify(expected)}`);
}
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const atLeast = (n) => (v) => Number(v) >= n;

// concepts lesson: choice wrong/right, widget, finish
await page.goto(`${B}/concepts/how-models-work/`);
await page.locator('[data-sampler] input[type=range]').fill('0.1');
expect(await page.locator('[data-sampler] .bar span:last-child').first().textContent(), nonEmpty, 'sampler top');
let cp = page.locator('#what-the-model-does');
expect(await page.locator('[data-finish]').isDisabled(), true, 'finish disabled before checkpoints passed');
await cp.locator('label').nth(2).click(); await cp.locator('.cp-check').first().click();
expect(await fb(cp), 'Search is a separate tool some products add on top. The model itself only predicts tokens; it has no built-in search.', 'choice wrong');
await cp.locator('label[data-correct]').click(); await cp.locator('.cp-check').first().click();
expect(await fb(cp), 'Correct.', 'choice right'); expect(await cp.getAttribute('data-state'), 'passed', 'choice state');
if (await page.locator('[data-route=behind]').count()) expect(await page.locator('[data-route=behind]').isHidden(), false, 'behind card visible after miss');
else log('behind card: n/a (no assumes)');
await page.locator('#name-the-failure label[data-correct]').click(); await page.locator('#name-the-failure .cp-check').click();
expect(await page.locator('#name-the-failure').getAttribute('data-state'), 'passed', 'second choice state');
expect(await page.locator('[data-finish]').isDisabled(), false, 'finish enabled once all checkpoints passed');
await page.click('[data-finish]'); expect(await page.locator('[data-finish]').textContent(), /^Finished ✓ \(\d{4}-\d{2}-\d{2}\)$/, 'finish label');
await page.reload(); expect(await page.locator('[data-finish]').textContent(), /^Finished ✓/, 'finish persisted'); expect(await page.locator('[data-finish]').isDisabled(), true, 'finish disabled after finishing');

expect((await page.locator('.ai-notice').textContent()).trim(), 'Content co-authored by AI.', 'AI notice in the footer');

// settings: comfort level lives here, not on the lesson; it drives routing there
await page.goto(`${B}/settings/`);
expect(await page.locator('[data-comfort=less]').count(), 1, 'comfort control on settings page');
expect(await page.locator('[data-review-item]').count(), 2, 'review schedule lists the finished lesson\'s checkpoints');
const item = () => page.locator('[data-review-item="concepts/how-models-work#what-the-model-does"]');
expect(await item().locator('.cp-later').isDisabled(), false, 'less often enabled at stage 1');
await item().locator('.cp-later').click(); await page.waitForTimeout(100);
expect(await item().locator('.cp-stage-label').textContent(), /^stage 2 of 5, due \d{4}-\d{2}-\d{2}$/, 'less often raises the stage');
await item().locator('.cp-sooner').click(); await page.waitForTimeout(100);
expect(await item().locator('.cp-stage-label').textContent(), /^stage 1 of 5/, 'sooner lowers the stage');
expect(await item().locator('.cp-sooner').isDisabled(), true, 'sooner disabled at stage 1');
await page.click('[data-comfort=less]'); expect(await page.locator('[data-comfort=less]').getAttribute('aria-pressed'), 'true', 'comfort less pressed');

// building-agents: predict + order, routing from the comfort level
await page.goto(`${B}/building-agents/agent-loop/`);
expect(await page.locator('[data-comfort]').count(), 0, 'no comfort control on the lesson');
expect(await page.locator('[data-route=behind]').isHidden(), false, 'behind card shown for less');
await page.goto(`${B}/settings/`); await page.click('[data-comfort=less]');
expect(await page.locator('[data-comfort=less]').getAttribute('aria-pressed'), 'false', 'comfort less unset again');
await page.goto(`${B}/building-agents/agent-loop/`);
expect(await page.locator('[data-route=behind]').isHidden(), true, 'behind card hidden again after unsetting less');
expect((await page.locator('[data-finish-note]').textContent()).trim(), 'Pass or skip 3 more checkpoints to finish this lesson.', 'finish note');
expect(await page.locator('.recap-sources').count(), 0, 'no sources block on the lesson');
cp = page.locator('#predict-tool-call'); await cp.locator('textarea').fill('27°C, rain'); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Not quite. Trace it once more.', 'predict wrong');
await cp.locator('textarea').fill(' 27°c, sun'); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Correct. That is exactly the output.', 'predict right (normalised)');
cp = page.locator('#predict-loop'); await cp.locator('textarea').fill('It is 14°C, rain there.'); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Correct. That is exactly the output.', 'predict2');
cp = page.locator('#order-the-loop'); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Not the right order yet.', 'order shuffled');
for (let pos = 1; pos <= 5; pos++) for (let k = 0; k < 5; k++) { const idx = await cp.locator('ol li').evaluateAll((lis, pos) => lis.findIndex(l => Number(l.dataset.pos) === pos), pos); if (idx > pos - 1) await cp.locator('ol li').nth(idx).locator('button[data-move=up]').click(); }
await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Correct order.', 'order sorted');
expect(await page.locator('[data-route=ahead]').isHidden(), true, 'ahead card hidden (not all first-try)');
expect(await page.locator('[data-finish]').isDisabled(), false, 'agent-loop finish enabled');
await page.click('[data-finish]'); expect(await page.locator('[data-finish]').textContent(), /^Finished ✓/, 'agent-loop finished');

// using-agents: sort + repair + scenario in safety
await page.goto(`${B}/using-agents/delegating/`);
cp = page.locator('#autonomy-levels');
const chips = await cp.locator('.cp-pool .cp-chip').count(); expect(chips, atLeast(2), 'sort chips');
for (let i = 0; i < chips; i++) { const chip = cp.locator('.cp-pool .cp-chip').first(); const b = await chip.getAttribute('data-bucket'); await chip.click(); await cp.locator(`.cp-bucket[data-bucket="${b}"] .cp-bucket-target`).click(); }
await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'All placed correctly.', 'sort all right');
cp = page.locator('#fix-the-brief'); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Write your fix, then reveal the model answer and compare.', 'repair before reveal');
await cp.locator('.cp-reveal-btn').click(); await cp.locator('input[value=pass]').check(); await cp.locator('.cp-check').first().click();
expect(await fb(cp), 'Recorded as a pass.', 'repair pass'); expect(await cp.getAttribute('data-state'), 'passed', 'repair state');
await page.goto(`${B}/safety/agent-risk/`);
cp = page.locator('#blast-radius-of-a-tidy-up'); await cp.locator('label').first().click(); await cp.locator('.cp-check').first().click(); expect(await fb(cp), nonEmpty, 'scenario feedback');
cp = page.locator('#predict-the-planted-instruction');
expect(await cp.getAttribute('data-reviewable'), 'false', 'honor predict not reviewable');
await cp.locator('textarea').fill('it will write the file'); await cp.locator('input[value=pass]').check(); await cp.locator('.cp-check').first().click(); expect(await fb(cp), 'Recorded as a pass.', 'honor predict');

// coding lesson: predict with run + repair exists
await page.goto(`${B}/coding-with-agents/first-session/`);
expect(await page.locator('[data-checkpoint]').count(), 4, 'coding checkpoints'); expect(await page.locator('.cp-verified').count(), 3, 'verified notes');
await page.goto(`${B}/customizing-agents/instructions/`);
expect(await page.locator('.instructions-builder').count(), 1, 'builder widget'); expect((await page.locator('.instructions-builder pre').textContent()).length, atLeast(1), 'builder pre text length');

// course page
await page.goto(`${B}/concepts/`);
expect(await page.locator('[data-node]').getAttribute('data-state'), 'finished', 'course node state');
expect(await page.locator('[data-ring-label]').textContent(), '100%', 'course ring');
expect(await page.locator('[data-review-card]').isHidden(), true, 'review card hidden (nothing due)');
// force a review due: set due date to today in storage
await page.evaluate(() => { const k='ai-training-progress-v1'; const r=JSON.parse(localStorage.getItem(k)); for (const id in r.reviews) r.reviews[id].due='2000-01-01'; localStorage.setItem(k, JSON.stringify(r)); });
await page.reload(); expect((await page.locator('[data-review-card]').textContent()).trim(), 'Review due: 2 items', 'review card after due');
await page.goto(`${B}/concepts/review/`); await page.waitForSelector('.review [data-checkpoint]', { timeout: 5000 });
expect(await page.locator('[data-status]').textContent(), 'Item 1 of 2', 'review status'); expect(await page.locator('.review [data-checkpoint]').getAttribute('data-kind'), 'choice', 'review kind');
cp = page.locator('.review [data-checkpoint]');
expect(await cp.locator('.cp-giveup').isDisabled(), true, 'give up disabled before an attempt');
// Item 1: a correct answer records a pass and closes the item.
await cp.locator('label[data-correct]').first().click(); await cp.locator('.cp-check').first().click();
expect(await fb(cp), 'Correct.', 'review correct answer'); expect(await cp.locator('.cp-stage-label').textContent(), 'stage 2 of 5', 'review stage after pass');
expect(await cp.locator('.cp-check').first().isDisabled(), true, 'review check disabled after result');
expect(await cp.locator('.cp-giveup').isDisabled(), true, 'give up disabled after result');
await cp.locator('button:has-text("Next item")').click(); await page.waitForTimeout(500);
expect(await page.locator('[data-status]').textContent(), 'Item 2 of 2', 'review status item 2');
cp = page.locator('.review [data-checkpoint]');
expect(await cp.locator('.cp-giveup').isDisabled(), true, 'give up disabled before an attempt (item 2)');
// Item 2: a wrong answer records nothing yet; the learner may retry or Give Up.
await cp.locator('label:not([data-correct])').first().click(); await cp.locator('.cp-check').first().click();
expect(await fb(cp), nonEmpty, 'review wrong answer');
expect(await cp.locator('.cp-check').first().isDisabled(), false, 'review check still enabled after wrong answer');
expect(await cp.locator('.cp-giveup').isDisabled(), false, 'give up enabled after one attempt');
await cp.locator('.cp-giveup').click();
expect(await cp.locator('.cp-stage-label').textContent(), 'stage 1 of 5', 'review stage after give up');
expect(await cp.locator('.cp-giveup').isDisabled(), true, 'give up disabled after result (item 2)');
expect(await cp.locator('.cp-check').first().isDisabled(), true, 'review check disabled after give up');
const hist = await page.evaluate(() => { const r=JSON.parse(localStorage.getItem('ai-training-progress-v1')); return Object.entries(r.reviews).filter(([id]) => id.startsWith('concepts/')).map(([, x]) => x.history.length); });
expect(hist, [1, 1], 'exactly one result recorded per review item');
await cp.locator('button:has-text("Next item")').click(); await page.waitForTimeout(300);
expect(await page.locator('[data-status]').textContent(), 'Done: 2 items reviewed. 0 more remain due.', 'review end');

// map, topic, competency, glossary, progress
await page.goto(`${B}/map/`);
expect(await page.locator('.topic-node').count(), atLeast(1), 'map topics'); expect(await page.locator('.topic-node[data-state=finished]').count(), atLeast(1), 'map finished topics'); log('map edges:', await page.locator('.topic-map-edges path').count());
await page.goto(`${B}/topics/concepts/how-models-work/`); expect(await page.locator('h1').textContent(), nonEmpty, 'topic page h1');
await page.goto(`${B}/competencies/concepts/explains-models/`); expect(await page.locator('tbody tr').count(), atLeast(1), 'competency rows');
await page.goto(`${B}/progress/`);
expect(await page.locator('.progress-course').count(), atLeast(1), 'progress courses'); expect(await page.locator('.progress-lesson').count(), atLeast(1), 'progress lessons');
const record = await page.locator('[data-dump]').textContent();
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export]')]); const path = await dl.path();
page.once('dialog', d => d.accept()); await page.click('[data-reset]'); await page.waitForTimeout(200);
expect(JSON.parse(await page.locator('[data-dump]').textContent()).lessons, {}, 'after reset lessons');
expect(await page.locator('[data-message]').textContent(), 'Progress reset.', 'reset message');
page.once('dialog', d => d.accept()); await page.setInputFiles('[data-import]', path); await page.waitForTimeout(400);
expect((await page.locator('[data-dump]').textContent()) === record, true, 'import restored');
expect(await page.locator('[data-message]').textContent(), 'Imported.', 'import message');
await page.screenshot({ path: '/tmp/ai-training-e2e-progress.png', fullPage: true });
await page.goto(`${B}/concepts/`); await page.screenshot({ path: '/tmp/ai-training-e2e-course.png', fullPage: true });
await page.goto(`${B}/map/`); await page.screenshot({ path: '/tmp/ai-training-e2e-map.png', fullPage: true });
await page.goto(`${B}/using-agents/delegating/`); await page.screenshot({ path: '/tmp/ai-training-e2e-lesson.png', fullPage: true });
await page.goto(`${B}/settings/`); await page.screenshot({ path: '/tmp/ai-training-e2e-settings.png', fullPage: true });
expect(errs, [], 'page errors');
await browser.close();
if (failures.length) {
	console.error(`\ne2e: ${failures.length} assertion failure(s)`);
	for (const f of failures) console.error('  - ' + f);
	process.exit(1);
}
console.log(`e2e: ok`);
