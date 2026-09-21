import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkCheckpoints, conceptIds, pageCheckpointIds } from '../../scripts/lib/checkpoints.mjs';

const roots: string[] = [];
afterAll(() => {
	for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const TOPIC =
	'id: a/t\narea: a\nname: T\ndefinition: d\nconcepts:\n  - id: c1\n    name: C\n    definition: d\nlinks: {prerequisites: [], related: [], specializations: []}\n';
const PAGE =
	'<Choice id="one" objective="o" title="T" hint="h" concepts={[\'c1\']}\n  options={[{ text: \'a\', correct: true }]}>\nStem.\n</Choice>\n\n<Sort id="two" objective="o" title="T" hint="h" concepts={[\'c1\']} buckets={[]} items={[]} />\n\n<Predict id="shown" title="Shown" answer="1" run="x.py">\nRun this.\n</Predict>\n';
const item = (id: string, over: Record<string, unknown> = {}) => ({
	id,
	lesson: 'a/x',
	kind: 'choice',
	objective: 'o',
	concepts: ['c1'],
	context: null,
	stem: 'Stem.',
	options: ['a'],
	answer: 'a',
	hint: 'h',
	reviewable: true,
	revision: 1,
	...over,
});
const GOOD = { version: 1, items: [item('one'), item('two', { kind: 'sort', stem: '' })] };

/** A temp tree with one topic, one lesson page `a/x` with two checkpoints, and the given export (an object, or raw text). */
function tree(data: unknown, files: Record<string, string | null> = {}) {
	const root = mkdtempSync(join(tmpdir(), 'checkpoints-'));
	roots.push(root);
	const all: Record<string, string | null> = {
		'data/areas/a/topics/t.yaml': TOPIC,
		'content/a/x.mdx': PAGE,
		'content/a/index.mdx': '<Choice id="not-a-lesson">\n',
		'dist/data/checkpoints.json': data === null ? null : typeof data === 'string' ? data : JSON.stringify(data),
		...files,
	};
	for (const [rel, text] of Object.entries(all)) {
		if (text === null) continue;
		mkdirSync(dirname(join(root, rel)), { recursive: true });
		writeFileSync(join(root, rel), text);
	}
	return root;
}
const check = (root: string) =>
	checkCheckpoints(join(root, 'dist/data/checkpoints.json'), join(root, 'content'), join(root, 'data'));

describe('checkCheckpoints', () => {
	it('passes a consistent export and counts the items', () => {
		expect(check(tree(GOOD))).toEqual({ errors: [], items: 2 });
	});
	it('reports a missing file, a file that is not JSON, a wrong version and a missing items list', () => {
		expect(check(tree(null)).errors[0]).toMatch(/does not exist; run site-build first/);
		expect(check(tree('{nope')).errors[0]).toMatch(/not JSON/);
		expect(check(tree({ version: 2 })).errors).toEqual(['version is 2, expected 1', 'no items list']);
	});
	it('reports a checkpoint missing from the export and an item no page has', () => {
		const { errors } = check(tree({ version: 1, items: [item('one'), item('three')] }));
		expect(errors).toEqual([
			'a/x#three: no lesson page has this checkpoint',
			'a/x#two: checkpoint in the lesson page is missing from the export',
		]);
	});
	it('reports a missing or mistyped field, a bad kind, empty or unknown concepts, and a duplicate', () => {
		const broken = {
			version: 1,
			items: [
				item('one', { revision: '1', kind: 'quiz', concepts: [] }),
				item('two', { kind: 'sort', stem: '', concepts: ['nope'] }),
				item('two', { kind: 'sort', stem: '' }),
				{ id: 'x' },
			],
		};
		const { errors } = check(tree(broken));
		expect(errors).toContain('a/x#one: revision must be a number');
		expect(errors).toContain('a/x#one: kind "quiz" is not a checkpoint kind');
		expect(errors).toContain('a/x#one: concepts must list at least one id');
		expect(errors).toContain('a/x#two: concept "nope" is not in the topic YAML');
		expect(errors).toContain('a/x#two: listed twice');
		expect(errors).toContain('items[3]: lesson must be a string');
		expect(errors).toContain('items[3]: context is missing (null when absent)');
	});
});

describe('helpers', () => {
	it('conceptIds collects every concept id in the data tree', () => {
		expect([...conceptIds(join(tree(GOOD), 'data'))]).toEqual(['c1']);
	});
	it('pageCheckpointIds skips an ungraded example (a Predict without an objective), so the export need not list it', () => {
		const root = tree(GOOD);
		const { ids } = pageCheckpointIds(join(root, 'content'), join(root, 'data'));
		expect([...ids]).not.toContain('a/x#shown');
		expect(check(tree(GOOD)).errors).toEqual([]);
	});
	it('pageCheckpointIds reads lesson pages only, not the course page, with the same scanner as the build', () => {
		const spaced = PAGE.replace('<Choice id="one"', '<Choice id = "one"');
		const root = tree(GOOD, { 'content/a/x.mdx': spaced });
		const { ids, errors } = pageCheckpointIds(join(root, 'content'), join(root, 'data'));
		expect([...ids].sort()).toEqual(['a/x#one', 'a/x#two']);
		expect(errors).toEqual([]);
	});
	it('pageCheckpointIds reports a tag without a string id and a tag the scanner rejects', () => {
		const noId = PAGE.replace('<Choice id="one"', '<Choice id={x}');
		const root = tree(GOOD, { 'content/a/x.mdx': noId });
		expect(pageCheckpointIds(join(root, 'content'), join(root, 'data')).errors).toEqual([
			'a/x: <Choice> without an id="..."',
		]);
		const broken = PAGE.replace('<Choice id="one"', '<Choice id="one" {...rest}');
		const { errors } = check(tree(GOOD, { 'content/a/x.mdx': broken }));
		expect(errors[0]).toMatch(/a\/x: <Choice> unexpected/);
	});
});
