import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Window } from 'happy-dom';
import { afterAll, describe, expect, it } from 'vitest';
import { checkRenderedCitations, pageText, unresolvedCitations } from '../../scripts/lib/rendered-citations.mjs';

const window = new Window();
const roots: string[] = [];
afterAll(() => {
	window.happyDOM.close();
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const page = (body: string) => `<!doctype html><html><head></head><body>${body}</body></html>`;

/** A temp dist tree with the given files, path to content. */
function dist(files: Record<string, string>) {
	const root = mkdtempSync(join(tmpdir(), 'rendered-citations-'));
	roots.push(root);
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), content);
	}
	return root;
}

describe('unresolvedCitations', () => {
	it('finds a raw token in paragraph text', () => {
		expect(unresolvedCitations(page('<p>The act applies (@EC AI Act) here.</p>'), window)).toEqual([
			{ where: 'text', snippet: 'The act applies (@EC AI Act) here.' },
		]);
	});

	it('finds a token that the markup splits over two elements', () => {
		expect(unresolvedCitations(page('<p>See (<em>@Some key</em>).</p>'), window)).toHaveLength(1);
	});

	it('finds a token whose key a line break splits', () => {
		expect(unresolvedCitations(page('<p>It shows (@EC AI\nAct).</p>'), window)).toEqual([
			{ where: 'text', snippet: 'It shows (@EC AI Act).' },
		]);
	});

	it('finds a token written with character references', () => {
		expect(unresolvedCitations(page('<p>See &#40;&#64;key).</p>'), window)).toHaveLength(1);
	});

	it('finds a token in the page title', () => {
		expect(unresolvedCitations('<html><head><title>X (@key)</title></head><body></body></html>', window)).toHaveLength(
			1,
		);
	});

	it('finds every token on a page', () => {
		expect(unresolvedCitations(page('<p>(@a)</p><li>(@b)</li>'), window)).toHaveLength(2);
	});

	it('passes a token inside inline code and a code block', () => {
		const html = page('<p>Write <code>(@key)</code> to cite.</p><pre><code>text (@key)\n</code></pre>');
		expect(unresolvedCitations(html, window)).toEqual([]);
	});

	it('passes a token inside a script, a style and a template', () => {
		const html = page(
			'<script>const s = "(@key)";</script><style>a::after { content: "(@x)"; }</style><template><p>(@t)</p></template>',
		);
		expect(unresolvedCitations(html, window)).toEqual([]);
	});

	it('passes a resolved citation link, whose key is in its title and data-key', () => {
		const html = page(
			'<p>Runs <a href="#ref-1" title="(@k)" data-key="(@k)" class="citation">[1]</a>.</p><div data-x="(@k)"></div>',
		);
		expect(unresolvedCitations(html, window)).toEqual([]);
	});

	it('finds a token in a meta description and an og:description', () => {
		const html = `<html><head><meta name="description" content="Covers (@Some page)."><meta property="og:description" content="Covers (@Some page)."></head><body></body></html>`;
		expect(unresolvedCitations(html, window)).toEqual([
			{ where: 'content attribute of <meta>', snippet: 'Covers (@Some page).' },
			{ where: 'content attribute of <meta>', snippet: 'Covers (@Some page).' },
		]);
	});

	it('finds a token in an alt and an aria-label', () => {
		const html = page('<img src="x.png" alt="A chart (@key)"><button aria-label="Open (@key)">o</button>');
		expect(unresolvedCitations(html, window).map((f) => f.where)).toEqual([
			'alt attribute of <img>',
			'aria-label attribute of <button>',
		]);
	});

	it('passes a meta tag that is not a description', () => {
		const html = `<html><head><meta name="keywords" content="(@k)"></head><body></body></html>`;
		expect(unresolvedCitations(html, window)).toEqual([]);
	});

	it('does not join the text of two block elements into a token', () => {
		const html = page('<ul><li>see (</li><li>@team on chat</li></ul><p>a (</p><p>@b</p>');
		expect(pageText(html, window)).toContain('see ( @team');
		expect(unresolvedCitations(html, window)).toEqual([]);
	});

	it('does not join text on the two sides of a code span into a token', () => {
		expect(pageText(page('<p>(<code>x</code>@y</p>'), window)).toContain('( @y');
		expect(unresolvedCitations(page('<p>(<code>x</code>@y</p>'), window)).toEqual([]);
	});
});

describe('checkRenderedCitations', () => {
	it('reports each raw token with its page and passes a clean page', () => {
		const root = dist({
			'index.html': page('<p>Clean <code>(@key)</code>.</p>'),
			'topics/a/t/index.html': page('<p>Behavior (@Vendor page).</p>'),
			'data/lessons/a/x.json': '{"prose": "(@not html)"}',
		});
		expect(checkRenderedCitations(root)).toEqual({
			errors: ['topics/a/t/index.html: unresolved citation in text: "Behavior (@Vendor page)."'],
			pages: 2,
		});
	});
});
