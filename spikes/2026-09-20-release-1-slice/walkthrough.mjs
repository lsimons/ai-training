import { chromium } from 'playwright';
const B = 'http://localhost:4399/ai-training';
const browser = await chromium.launch(); const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && errs.push(m.text()));
const log = (...a) => console.log(...a);

await page.goto(`${B}/concepts/how-models-work/`);
// widget
await page.locator('#sampler input[type=range]').fill('0.1');
const top = await page.locator('#sampler .bar .pct').first().textContent(); log('sampler top pct at T=0.1:', top);
await page.click('#sampler button'); log('generated:', await page.locator('#sampler .gen').textContent());
// choice wrong then right
const cp1 = page.locator('[data-checkpoint=what-the-model-does]');
await cp1.locator('label').nth(2).click(); await cp1.locator('.cp-check').click(); log('choice wrong ->', await cp1.locator('.cp-feedback').textContent());
await cp1.locator('label[data-correct]').click(); await cp1.locator('.cp-check').click(); log('choice right ->', await cp1.locator('.cp-feedback').textContent(), '|', await cp1.locator('.cp-state').textContent());
await page.locator('[data-checkpoint=name-the-failure] .cp-skip').click();
await page.click('[data-finish]');
// second lesson
await page.goto(`${B}/building-agents/agent-loop/`);
const p1 = page.locator('[data-checkpoint=predict-tool-call]');
await p1.locator('textarea').fill('27°C, rain'); await p1.locator('.cp-check').click(); log('predict wrong ->', await p1.locator('.cp-feedback').textContent());
await p1.locator('textarea').fill('  27°C, Sun '); await p1.locator('.cp-check').click(); log('predict right ->', await p1.locator('.cp-feedback').textContent());
const ord = page.locator('[data-checkpoint=order-the-loop]');
// sort by clicking up repeatedly: brute-force selection sort via DOM eval
await ord.locator('.cp-check').click(); log('order (shuffled) ->', await ord.locator('.cp-feedback').textContent());
for (let pos = 1; pos <= 5; pos++) { for (let k = 0; k < 5; k++) { const idx = await ord.locator('ol li').evaluateAll((lis, pos) => lis.findIndex(l => Number(l.dataset.pos) === pos), pos); if (idx > pos - 1) await ord.locator('ol li').nth(idx).locator('button[aria-label="move up"]').click(); } }
await ord.locator('.cp-check').click(); log('order (sorted) ->', await ord.locator('.cp-feedback').textContent());
// course page
await page.goto(`${B}/concepts/`); log('course node:', await page.locator('.node-state').textContent(), '|', await page.locator('.node-count').textContent(), '| ring pct', await page.locator('.ring').evaluate(e => e.style.getPropertyValue('--pct')));
await page.goto(`${B}/building-agents/`); log('course node:', await page.locator('.node-state').textContent(), '|', await page.locator('.node-count').textContent());
// progress page: export, reset, import
await page.goto(`${B}/progress/`);
const record = await page.locator('[data-progress-dump]').textContent(); log('record:', record);
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export]')]); const path = await dl.path(); log('exported', dl.suggestedFilename());
page.once('dialog', d => d.accept()); await page.click('[data-reset]'); log('after reset:', await page.locator('[data-progress-dump]').textContent());
page.once('dialog', d => d.accept()); await page.setInputFiles('[data-import]', path); await page.waitForTimeout(300);
log('after import equals export:', (await page.locator('[data-progress-dump]').textContent()) === record);
await page.screenshot({ path: '/tmp/spike-progress.png', fullPage: true });
await page.goto(`${B}/concepts/how-models-work/`); await page.screenshot({ path: '/tmp/spike-lesson.png', fullPage: true });
log('page errors:', errs);
await browser.close();
