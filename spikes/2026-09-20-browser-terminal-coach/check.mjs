// Drives the spike page with Playwright: live shell -> claude -> typed prompt -> coach tip.
import { chromium } from '../../docs/node_modules/playwright/index.mjs';
const URL = process.env.SPIKE_URL || 'http://localhost:4401/ai-training/spike/terminal/';
const step = (s) => console.log('==', s);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => m.type() === 'error' && console.log('browser:', m.text()));
await page.goto(URL);
step('wait for shell prompt');
await page.waitForFunction(() => document.getElementById('spike-term-status')?.textContent.includes('connected'), null, { timeout: 15000 });
await page.waitForTimeout(2500);
const screen = async () => { await page.click('#btn-screen'); await page.waitForTimeout(400); return page.evaluate(() => window.__lastScreen); };
console.log('--- shell screen ---\n' + (await screen()).split('\n').slice(-5).join('\n'));

step('start claude');
await page.evaluate(() => window.__spike.send({ type: 'in', data: 'cd /tmp && mkdir -p spike-learner && cd spike-learner && claude\r' }));
await page.waitForFunction(async () => { window.__spike.send({ type: 'screen' }); await new Promise(r => setTimeout(r, 300)); return /Claude Code|Welcome|trust|Tips|\? for shortcuts/i.test(window.__lastScreen || ''); }, null, { timeout: 30000 });
await page.waitForTimeout(3000);
let s = await screen();
if (/trust|Yes, proceed|Enter to confirm/i.test(s)) { step('accept trust dialog'); await page.evaluate(() => window.__spike.send({ type: 'in', data: '\x1b[B' })); await page.waitForTimeout(300); await page.evaluate(() => window.__spike.send({ type: 'in', data: '\r' })); await page.waitForTimeout(3000); s = await screen(); }
console.log('--- claude screen ---\n' + s.split('\n').slice(-12).join('\n'));
await page.screenshot({ path: 'claude-running.png' });

step('type for me');
await page.click('#btn-type');
await page.waitForTimeout(20000);
s = await screen();
console.log('--- after typed prompt ---\n' + s.split('\n').slice(-14).join('\n'));

step('ask the coach');
await page.click('#btn-coach');
await page.waitForFunction(() => window.__lastCoach, null, { timeout: 90000 });
const coach = await page.evaluate(() => window.__lastCoach);
console.log('--- coach ---\n', JSON.stringify(coach, null, 2));
await page.waitForTimeout(500);
await page.screenshot({ path: 'coach-tip.png', fullPage: true });

step('exit claude');
await page.evaluate(() => window.__spike.send({ type: 'in', data: '/exit\r' }));
await page.waitForTimeout(2000);
await browser.close();
console.log('DONE');
