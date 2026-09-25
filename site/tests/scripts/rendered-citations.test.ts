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
			'The act applies (@EC AI Act) here.',
		]);
	});

	it('finds a token that the markup splits over two elements', () => {
		expect(unresolvedCitations(page('<p>See (<em>@Some key</em>).</p>'), window)).toHaveLength(1);
	});

	it('finds a token whose key a line break splits', () => {
		expect(unresolvedCitations(page('<p>It shows (@EC AI\nAct).</p>'), window)).toEqual(['It shows (@EC AI Act).']);
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

	it('passes a resolved citation link and a token in an attribute', () => {
		const html = page('<p>Runs <a href="#ref-1" title="(@k)" class="citation">[1]</a>.</p>');
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
			errors: ['topics/a/t/index.html: unresolved citation "Behavior (@Vendor page)."'],
			pages: 2,
		});
	});
});
