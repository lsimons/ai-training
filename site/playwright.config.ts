import { defineConfig, devices } from '@playwright/test';

/**
 * Browser walkthrough of the built site (`mise run site-e2e`). The specs in
 * e2e/ run against a static server for site/dist, which `site-e2e` builds
 * first. Playwright starts and stops the server itself.
 */
const PORT = 4400;
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
