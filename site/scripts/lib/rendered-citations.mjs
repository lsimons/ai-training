/**
 * The unresolved citation check's logic (issue #310): a `(@` in the text of a
 * built HTML page is a `(@key)` citation that no renderer resolved, and the
 * reader sees the raw syntax. Spec S03 "Citations and terms" defines the
 * token; `plugins/citation-syntax.mjs` matches it for lesson pages and
 * `src/lib/citations.ts` for text from the data tree.
 *
 * Scope: every `.html` page under `site/dist`, lesson, course, topic and
 * competency pages included. Text inside `<code>`, `<pre>`, `<script>`,
 * `<style>`, `<template>` and `<textarea>` is skipped, because a lesson may
 * show the syntax as code. Attribute values are not text and are not read.
 * The JSON exports under `site/dist/data/` are out of scope: `citationsOutsideCode`
 * in `bundles.mjs` checks a bundle's `prose`, and the raw tokens left in
 * bundle `behaviors[].why`, `checkpoints[].stem` and `checkpoints.json` are
 * issue #437.
 *
 * The page is parsed with happy-dom and read as the text of its elements,
 * so a `(@` that the markup splits over two elements (`(<em>@key</em>)`) or
 * over a line break is still one run of text. `scripts/check-bundles.mjs`
 * runs this after the bundle check; tests import it.
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { Window } from 'happy-dom';
import { walk } from './data.mjs';

/** Elements whose text is code or not shown as prose. */
export const SKIPPED = ['code', 'pre', 'script', 'style', 'template', 'textarea'];

const TOKEN = '(@';
const CONTEXT = 40;

/**
 * The text of an HTML page with every `SKIPPED` element replaced by one
 * space, so the text on either side of a code span does not join into a
 * token. Whitespace runs are collapsed to one space.
 * @param {string} html
 * @param {Window} window
 */
export function pageText(html, window) {
	const doc = new window.DOMParser().parseFromString(html, 'text/html');
	for (const el of [...doc.querySelectorAll(SKIPPED.join(','))]) {
		// A skipped element inside another one was removed with its parent.
		if (el.isConnected) el.replaceWith(doc.createTextNode(' '));
	}
	return (doc.documentElement.textContent ?? '').replace(/\s+/g, ' ');
}

/**
 * Each `(@` in the page text outside the skipped elements, as a snippet of
 * the text around it.
 * @param {string} html
 * @param {Window} window
 * @returns {string[]}
 */
export function unresolvedCitations(html, window) {
	const text = pageText(html, window);
	const found = [];
	for (let i = text.indexOf(TOKEN); i !== -1; i = text.indexOf(TOKEN, i + TOKEN.length)) {
		found.push(text.slice(Math.max(0, i - CONTEXT), i + CONTEXT).trim());
	}
	return found;
}

/**
 * One problem per `(@` on every `.html` page under `distDir`.
 * @param {string} distDir
 * @returns {{ errors: string[], pages: number }}
 */
export function checkRenderedCitations(distDir) {
	const window = new Window();
	const errors = [];
	let pages = 0;
	try {
		for (const file of [...walk(distDir)].filter((p) => p.endsWith('.html')).sort()) {
			pages += 1;
			for (const snippet of unresolvedCitations(readFileSync(file, 'utf8'), window)) {
				errors.push(`${relative(distDir, file)}: unresolved citation "${snippet}"`);
			}
		}
	} finally {
		window.happyDOM.close();
	}
	return { errors, pages };
}
