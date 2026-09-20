#!/usr/bin/env bun
/**
 * Screenshot one page of the built site (`mise run site-screenshot`): serve
 * site/dist (scripts/serve-dist.mjs), wait until it answers, take the
 * picture, stop the server. Usage: `bun scripts/screenshot.mjs [out.png] [/ai-training/]`.
 * Needs `mise run site-build` first and `mise run site-browser` once.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const [out = 'out.png', path = '/ai-training/'] = process.argv.slice(2);
const port = 4321;
const url = `http://localhost:${port}${path}`;

const server = spawn('bun', [new URL('./serve-dist.mjs', import.meta.url).pathname, String(port)], {
	stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => {
	serverLog += d;
});
server.stderr.on('data', (d) => {
	serverLog += d;
});

async function waitForServer(timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`server did not answer on ${url} within ${timeoutMs / 1000}s\n${serverLog}`);
}

let status = 0;
try {
	await waitForServer(30_000);
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	await page.goto(url);
	await page.screenshot({ path: out, fullPage: true });
	await browser.close();
	console.log(`wrote ${out} (${url})`);
} catch (err) {
	console.error(err instanceof Error ? err.message : err);
	status = 1;
} finally {
	server.kill();
}
process.exit(status);
