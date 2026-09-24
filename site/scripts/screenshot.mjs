#!/usr/bin/env bun
/**
 * Screenshot one page of the built site (`mise run site-screenshot`): serve
 * site/dist (scripts/serve-dist.mjs) on a free port, wait until it answers,
 * take the picture, stop the server.
 * Usage: `bun scripts/screenshot.mjs [out.png] [/ai-training/]`.
 * Needs `mise run site-build` first and `mise run site-browser` once.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { chromium } from '@playwright/test';

const BASE = '/ai-training/';
const [out = 'out.png', path = BASE] = process.argv.slice(2);

/** Ask the OS for an unused port, so a stale `astro dev` on 4321 is never what gets photographed. */
function freePort() {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.unref();
		probe.on('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address();
			probe.close(() => resolve(port));
		});
	});
}

const port = await freePort();
const origin = `http://localhost:${port}`;
const url = `${origin}${path}`;

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
let serverExit = null;
server.on('exit', (code, signal) => {
	serverExit = `static server exited early (code ${code}, signal ${signal})`;
});

/**
 * Poll the base URL (not the requested page, so a 404 page can still be
 * photographed) until the static server answers 200. Fail with the server's
 * own output when it dies first or the timeout passes.
 */
async function waitForServer(timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	const probeUrl = `${origin}${BASE}`;
	while (Date.now() < deadline) {
		if (serverExit) throw new Error(`${serverExit}\n${serverLog}`);
		try {
			const res = await fetch(probeUrl);
			if (res.ok) return;
		} catch {
			// not listening yet
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(
		`static server did not answer 200 on ${probeUrl} within ${timeoutMs / 1000}s. Did \`mise run site-build\` run?\n${serverLog}`,
	);
}

let status = 0;
try {
	await waitForServer(30_000);
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	const res = await page.goto(url);
	if (res && !res.ok()) console.warn(`note: ${url} answered ${res.status()}`);
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
