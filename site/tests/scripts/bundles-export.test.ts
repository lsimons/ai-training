import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { bundleIds, checkBundle, checkBundles, fencedBlocks } from '../../scripts/lib/bundles.mjs';

const roots: string[] = [];
afterAll(() => {
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const TOPIC =
	'id: a/t\narea: a\nname: T\ndefinition: d\nconcepts:\n  - id: c1\n    name: C\n    definition: d\nlinks: {prerequisites: [], related: [], specializations: []}\n';
const PAGE =
	"import { Prompt } from '@components/lesson';\n\nSee [x](/glossary/).\n\n```py\nprint('/glossary/')\n```\n\n<Prompt model=\"illustrative\">\n~~~\nA [link](/a/) inside.\n~~~\n</Prompt>\n";
const PROSE =
	"See [x](https://s/ai-training/glossary/).\n\n```py\nprint('/glossary/')\n```\n\n#### Prompt (illustrative, not a recorded transcript)\n\n````text\n~~~\nA [link](/a/) inside.\n~~~\n````\n";
const bundle = (over: Record<string, unknown> = {}) => ({
	version: 1,
	id: 'a/x',
	url: 'https://s/ai-training/a/x/',
	title: 'X',
	mode: 'tutorial',
	prose: PROSE,
	topics: [],
	objectives: [],
	assumes: [],
	checkpoints: [],
	extends_to: [],
	...over,
});

/** A temp tree with one topic, one lesson page `a/x`, and the given bundle files (an object, raw text, or null for none). */
function tree(bundles: Record<string, unknown> = { 'a/x': bundle() }, files: Record<string, string> = {}) {
	const root = mkdtempSync(join(tmpdir(), 'bundles-'));
	roots.push(root);
	const all: Record<string, string> = {
		'data/areas/a/topics/t.yaml': TOPIC,
		'content/a/x.mdx': PAGE,
		'content/a/index.mdx': 'Course page.\n',
		...files,
	};
	for (const [id, data] of Object.entries(bundles)) {
		all[`dist/data/lessons/${id}.json`] = typeof data === 'string' ? data : JSON.stringify(data);
	}
	for (const [rel, text] of Object.entries(all)) {
		mkdirSync(dirname(join(root, rel)), { recursive: true });
		writeFileSync(join(root, rel), text);
	}
	return root;
}
const check = (root: string) =>
	checkBundles(join(root, 'dist/data/lessons'), join(root, 'content'), join(root, 'data'));

describe('fencedBlocks', () => {
	it('returns each fenced block with its fences, nested fences included, to the end when unclosed', () => {
		expect(fencedBlocks('a\n```js\nx\n```\nb\n  ~~~\n  y\n  ~~~\n````md\n```\ninner\n```\n````\n~~~\nopen')).toEqual([
			'```js\nx\n```',
			'  ~~~\n  y\n  ~~~',
			'````md\n```\ninner\n```\n````',
			'~~~\nopen',
		]);
		expect(fencedBlocks('no `inline` code')).toEqual([]);
	});
});

describe('checkBundles', () => {
	it('passes a tree with one bundle per lesson page and counts them', () => {
		expect(check(tree())).toEqual({ errors: [], bundles: 1 });
	});
	it('reports a missing dist directory', () => {
		expect(check(tree({})).errors).toEqual([expect.stringMatching(/does not exist; run site-build first/)]);
	});
	it('reports a page without a bundle and a bundle without a page', () => {
		expect(check(tree({ 'a/y': bundle({ id: 'a/y' }) })).errors).toEqual([
			'a/x: lesson page without a bundle',
			'a/y: bundle without a lesson page',
		]);
		expect(bundleIds(join(tree({ 'a/y': bundle() }), 'dist/data/lessons'))).toEqual(new Set(['a/y']));
	});
	it('reports a bundle that is not JSON, not an object, or has the wrong id or version', () => {
		expect(check(tree({ 'a/x': '{nope' })).errors).toEqual([expect.stringMatching(/^a\/x: not JSON/)]);
		expect(check(tree({ 'a/x': '[]' })).errors).toEqual(['a/x: not a JSON object']);
		expect(check(tree({ 'a/x': bundle({ id: 'a/y', version: 2 }) })).errors).toEqual([
			'a/x: version is 2, expected 1',
			'a/x: id is "a/y"',
		]);
	});
	it('reports a missing or mistyped field and an unknown mode', () => {
		const { title: _title, checkpoints: _checkpoints, ...rest } = bundle();
		expect(check(tree({ 'a/x': { ...rest, mode: 'essay', prose: 7 } })).errors).toEqual([
			'a/x: title must be a string',
			'a/x: prose must be a string',
			'a/x: checkpoints must be a list',
			'a/x: mode is "essay", expected tutorial or explanation',
		]);
	});
	it('reports a fenced block of the page that the prose changed', () => {
		const prose = PROSE.replace("print('/glossary/')", "print('https://s/ai-training/glossary/')").replace(
			'A [link](/a/)',
			'A [link](https://s/ai-training/a/)',
		);
		expect(check(tree({ 'a/x': bundle({ prose }) })).errors).toEqual([
			'a/x: the fenced block starting "```py" is not in prose unchanged',
			'a/x: the fenced block starting "~~~" is not in prose unchanged',
		]);
	});
	it('checks one bundle file against its page source', () => {
		const root = tree();
		expect(checkBundle('a/x', join(root, 'dist/data/lessons/a/x.json'), PAGE)).toEqual([]);
	});
});
