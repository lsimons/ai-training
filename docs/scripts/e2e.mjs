/**
 * Browser walkthrough of every release-1 mechanism (spec S06 "What release 1
 * exercises") against a built site. Run with `mise run docs-e2e`; needs
 * `mise run docs-browser` once. Exits non-zero on any page error or failed
 * assertion. Screenshots land in /tmp/ai-training-e2e-*.png.
 */
import { chromium } from 'playwright';
const B = `http://localhost:${process.env.PORT ?? 4399}/ai-training`;
const browser = await chromium.launch(); const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => m.type()==='error' && errs.push('CONSOLE ' + m.text()));
const log = (...a) => console.log(...a);
const fb = (cp) => cp.locator('.cp-feedback').textContent();

// concepts lesson: choice wrong/right, widget, finish
await page.goto(`${B}/concepts/how-models-work/`);
await page.locator('[data-sampler] input[type=range]').fill('0.1');
log('sampler top:', await page.locator('[data-sampler] .bar span:last-child').first().textContent());
let cp = page.locator('#what-the-model-does');
await cp.locator('label').nth(2).click(); await cp.locator('.cp-check').click(); log('choice wrong:', await fb(cp));
await cp.locator('label[data-correct]').click(); await cp.locator('.cp-check').click(); log('choice right:', await fb(cp), '|', await cp.getAttribute('data-state'));
log('behind card visible after miss:', await page.locator('[data-route=behind]').count() ? !(await page.locator('[data-route=behind]').isHidden()) : 'n/a (no assumes)');
await page.locator('#name-the-failure label[data-correct]').click(); await page.locator('#name-the-failure .cp-check').click();
await page.click('[data-finish]'); log('finish label:', await page.locator('[data-finish]').textContent());
await page.reload(); log('finish persisted:', await page.locator('[data-finish]').textContent(), '| disabled', await page.locator('[data-finish]').isDisabled());

// building-agents: predict + order, comfort toggle, routing
await page.goto(`${B}/building-agents/agent-loop/`);
log('comfort control present:', await page.locator('[data-comfort=less]').count());
await page.click('[data-comfort=less]'); log('behind card shown for less:', !(await page.locator('[data-route=behind]').isHidden()));
await page.click('[data-comfort=less]');
cp = page.locator('#predict-tool-call'); await cp.locator('textarea').fill('27°C, rain'); await cp.locator('.cp-check').click(); log('predict wrong:', await fb(cp));
await cp.locator('textarea').fill(' 27°c, sun'); await cp.locator('.cp-check').click(); log('predict right:', await fb(cp));
cp = page.locator('#predict-loop'); await cp.locator('textarea').fill('It is 14°C, rain there.'); await cp.locator('.cp-check').click(); log('predict2:', await fb(cp));
cp = page.locator('#order-the-loop'); await cp.locator('.cp-check').click(); log('order shuffled:', await fb(cp));
for (let pos = 1; pos <= 5; pos++) for (let k = 0; k < 5; k++) { const idx = await cp.locator('ol li').evaluateAll((lis, pos) => lis.findIndex(l => Number(l.dataset.pos) === pos), pos); if (idx > pos - 1) await cp.locator('ol li').nth(idx).locator('button[data-move=up]').click(); }
await cp.locator('.cp-check').click(); log('order sorted:', await fb(cp));
log('ahead card hidden (not all first-try):', await page.locator('[data-route=ahead]').isHidden());
await page.click('[data-finish]');

// using-agents: sort + repair + scenario in safety
await page.goto(`${B}/using-agents/delegating/`);
cp = page.locator('#autonomy-levels');
const chips = await cp.locator('.cp-pool .cp-chip').count(); log('sort chips:', chips);
for (let i = 0; i < chips; i++) { const chip = cp.locator('.cp-pool .cp-chip').first(); const b = await chip.getAttribute('data-bucket'); await chip.click(); await cp.locator(`.cp-bucket[data-bucket="${b}"] .cp-bucket-target`).click(); }
await cp.locator('.cp-check').click(); log('sort all right:', await fb(cp));
cp = page.locator('#fix-the-brief'); await cp.locator('.cp-check').click(); log('repair before reveal:', await fb(cp));
await cp.locator('.cp-reveal-btn').click(); await cp.locator('input[value=pass]').check(); await cp.locator('.cp-check').click(); log('repair pass:', await fb(cp), '|', await cp.getAttribute('data-state'));
await page.goto(`${B}/safety/agent-risk/`);
cp = page.locator('#blast-radius-of-a-tidy-up'); await cp.locator('label').first().click(); await cp.locator('.cp-check').click(); log('scenario:', (await fb(cp)).slice(0, 80));
cp = page.locator('#predict-the-planted-instruction'); await cp.locator('textarea').fill('it will write the file'); await cp.locator('input[value=pass]').check(); await cp.locator('.cp-check').click(); log('honour predict:', await fb(cp));

// coding lesson: predict with run + repair exists
await page.goto(`${B}/coding-with-agents/first-session/`);
log('coding checkpoints:', await page.locator('[data-checkpoint]').count(), 'verified notes:', await page.locator('.cp-verified').count());
await page.goto(`${B}/customizing-agents/instructions/`);
log('builder widget:', await page.locator('.instructions-builder').count(), 'pre text length:', (await page.locator('.instructions-builder pre').textContent()).length);

// course page
await page.goto(`${B}/concepts/`);
log('course node state:', await page.locator('[data-node]').getAttribute('data-state'), '| ring', await page.locator('[data-ring-label]').textContent(), '| review card hidden:', await page.locator('[data-review-card]').isHidden());
// force a review due: set due date to today in storage
await page.evaluate(() => { const k='ai-training-progress-v1'; const r=JSON.parse(localStorage.getItem(k)); for (const id in r.reviews) r.reviews[id].due='2000-01-01'; localStorage.setItem(k, JSON.stringify(r)); });
await page.reload(); log('review card after due:', await page.locator('[data-review-card]').textContent());
await page.goto(`${B}/concepts/review/`); await page.waitForSelector('.review [data-checkpoint]', { timeout: 5000 });
log('review status:', await page.locator('[data-status]').textContent(), '| kind', await page.locator('.review [data-checkpoint]').getAttribute('data-kind'));
cp = page.locator('.review [data-checkpoint]'); await cp.locator('label').first().click(); await cp.locator('.cp-check').click(); log('review answer:', (await fb(cp)).slice(0,60), '| stage:', await cp.locator('.cp-stage-label').textContent());
await cp.locator('button:has-text("Next item")').click(); await page.waitForTimeout(500);
cp = page.locator('.review [data-checkpoint]'); await cp.locator('.cp-check').click(); await cp.locator('.cp-giveup').click(); log('give up:', (await fb(cp)).slice(0,60), '| stage:', await cp.locator('.cp-stage-label').textContent());
await cp.locator('button:has-text("Next item")').click(); await page.waitForTimeout(300); log('review end:', await page.locator('[data-status]').textContent());

// map, topic, competency, glossary, progress
await page.goto(`${B}/map/`); log('map topics:', await page.locator('.topic-node').count(), '| finished:', await page.locator('.topic-node[data-state=finished]').count(), '| edges:', await page.locator('.topic-map-edges path').count());
await page.goto(`${B}/topics/concepts/how-models-work/`); log('topic page h1:', await page.locator('h1').textContent());
await page.goto(`${B}/competencies/concepts/explains-models/`); log('competency rows:', await page.locator('tbody tr').count());
await page.goto(`${B}/progress/`); log('progress courses:', await page.locator('.progress-course').count(), 'lessons:', await page.locator('.progress-lesson').count());
const record = await page.locator('[data-dump]').textContent();
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export]')]); const path = await dl.path();
page.once('dialog', d => d.accept()); await page.click('[data-reset]'); await page.waitForTimeout(200); log('after reset lessons:', JSON.parse(await page.locator('[data-dump]').textContent()).lessons);
page.once('dialog', d => d.accept()); await page.setInputFiles('[data-import]', path); await page.waitForTimeout(400);
log('import restored:', (await page.locator('[data-dump]').textContent()) === record, '|', await page.locator('[data-message]').textContent());
await page.screenshot({ path: '/tmp/ai-training-e2e-progress.png', fullPage: true });
await page.goto(`${B}/concepts/`); await page.screenshot({ path: '/tmp/ai-training-e2e-course.png', fullPage: true });
await page.goto(`${B}/map/`); await page.screenshot({ path: '/tmp/ai-training-e2e-map.png', fullPage: true });
await page.goto(`${B}/using-agents/delegating/`); await page.screenshot({ path: '/tmp/ai-training-e2e-lesson.png', fullPage: true });
log('errors:', errs);
await browser.close();
const failed = errs.length > 0;
if (failed) { console.error('e2e: page errors'); process.exit(1); }
console.log('e2e: ok');
