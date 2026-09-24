import { execFileSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Browser walkthrough of the built site (`mise run site-e2e`). The specs in
 * e2e/ run against a static server for site/dist, which `site-e2e` builds
 * first. Playwright starts and stops the server itself.
 */

/**
 * The static server's port: `E2E_PORT` when it is set, else a free port the OS
 * hands out, so two e2e runs on one machine never collide (#345). The chosen
 * port goes back into `E2E_PORT` because the worker processes load this file
 * again and inherit the runner's environment, so they must see the same value.
 * The probe runs in a child process since the config has to be synchronous.
 */
function e2ePort(): number {
	const fromEnv = process.env.E2E_PORT;
	if (fromEnv !== undefined && fromEnv !== '') {
		const port = Number(fromEnv);
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			throw new Error(`E2E_PORT must be a port number from 1 to 65535, got "${fromEnv}"`);
		}
		return port;
	}
	const probe =
		"const s=require('node:net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close()})";
	const port = Number(execFileSync(process.execPath, ['-e', probe], { encoding: 'utf8' }).trim());
	process.env.E2E_PORT = String(port);
	return port;
}

const PORT = e2ePort();
export const BASE = `http://localhost:${PORT}/ai-training`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		...devices['Desktop Chrome'],
		baseURL: `${BASE}/`,
		trace: 'retain-on-failure',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// Not `astro preview`: in Astro 7 it hands the port to a detached child and
		// exits, so Playwright could not stop it. scripts/serve-dist.mjs stays in the
		// foreground and serves site/dist under the same base path.
		command: `bun scripts/serve-dist.mjs ${PORT}`,
		url: `${BASE}/`,
		reuseExistingServer: false,
		timeout: 60_000,
	},
});
