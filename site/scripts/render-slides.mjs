#!/usr/bin/env bun
/**
 * Render a Quarto slide deck (`mise run site-slides`), then turn off the
 * reveal.js postMessage API in the HTML. Why the second step exists, and
 * the text it inserts, are in scripts/lib/render-slides.mjs, which
 * tests/scripts/render-slides.test.ts covers; this file runs Quarto and
 * reports.
 *
 * Usage: bun site/scripts/render-slides.mjs <deck.qmd> [--html-only]
 *
 * `--html-only` renders only the reveal.js HTML and skips the Beamer PDF,
 * for a machine without a working LaTeX. The committed PDF then stays as it
 * was, which is only right when the .qmd did not change.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { disablePostMessage } from './lib/render-slides.mjs';

const [deck, ...rest] = process.argv.slice(2);
const htmlOnly = rest.includes('--html-only');
const unknown = rest.filter((arg) => arg !== '--html-only');
if (!deck?.endsWith('.qmd') || unknown.length > 0) {
	console.error('usage: bun site/scripts/render-slides.mjs <deck.qmd> [--html-only]');
	process.exit(2);
}

// An argv array and no shell: the deck path is one argument, whatever it contains.
const quartoArgs = ['render', deck];
if (htmlOnly) {
	quartoArgs.push('--to', 'revealjs');
}
const render = spawnSync('quarto', quartoArgs, { stdio: 'inherit' });
if (render.error) {
	console.error(`render-slides: quarto failed to start: ${render.error.message}`);
	process.exit(1);
}
if (render.status !== 0) {
	console.error(`render-slides: quarto render exited with ${render.status}`);
	process.exit(render.status ?? 1);
}

const html = deck.replace(/\.qmd$/, '.html');
let patched;
try {
	patched = disablePostMessage(readFileSync(html, 'utf8'));
} catch (error) {
	console.error(`render-slides: ${html}: ${error instanceof Error ? error.message : error}`);
	process.exit(1);
}
writeFileSync(html, patched);
console.log(`render-slides: ${html}: reveal.js postMessage API disabled`);
