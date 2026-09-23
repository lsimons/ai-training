#!/usr/bin/env bun
/**
 * Wave picker (`mise run next-wave -- --size 6 [--kind lessons|content]
 * [--only N,N,...] [--json]`): the issues the next wave of builders should
 * take on, from the data tree of this checkout and the `ready-for-agent`
 * issues on GitHub (`gh issue list`). The rules and the markdown output are
 * in scripts/lib/next-wave.mjs, which tests/scripts/next-wave.test.ts
 * covers. This file fetches the issues, calls the lib, and prints.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readAreaTree } from './lib/area-tree.mjs';
import { lessonPages } from './lib/data.mjs';
import { formatWave, pickWave } from './lib/next-wave.mjs';

const REPO = 'lsimons/ai-training';

/**
 * `--size N` (default 6, a positive integer in plain digits), `--kind`
 * (`lessons`, the default, or `content`), `--only N,N,...` (issue numbers,
 * the whitelist) and `--json` from the command line.
 */
function parseArgs(argv) {
	let size = 6;
	let kind = 'lessons';
	let only = null;
	let json = false;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--json') json = true;
		else if (argv[i] === '--size') {
			const raw = argv[++i] ?? '';
			if (!/^[1-9][0-9]*$/.test(raw)) {
				console.error(`next-wave: --size needs a positive integer, got ${JSON.stringify(raw)}`);
				process.exit(2);
			}
			size = Number(raw);
		} else if (argv[i] === '--kind') {
			const raw = argv[++i] ?? '';
			if (raw !== 'lessons' && raw !== 'content') {
				console.error(`next-wave: --kind is lessons or content, got ${JSON.stringify(raw)}`);
				process.exit(2);
			}
			kind = raw;
		} else if (argv[i] === '--only') {
			const raw = argv[++i] ?? '';
			if (!/^[1-9][0-9]*(,[1-9][0-9]*)*$/.test(raw)) {
				console.error(`next-wave: --only needs issue numbers separated by commas, got ${JSON.stringify(raw)}`);
				process.exit(2);
			}
			only = raw.split(',').map(Number);
		} else {
			console.error(`next-wave: unknown argument ${argv[i]}`);
			process.exit(2);
		}
	}
	return { size, kind, only, json };
}

/**
 * Every open issue, with assignees as login names and labels as names. The
 * lib takes the `ready-for-agent` ones as candidates and the full number
 * set to tell a closed or unknown `--only` number from a not-ready one.
 */
function openIssues() {
	let out;
	try {
		out = execFileSync(
			'gh',
			['issue', 'list', '-R', REPO, '-s', 'open', '-L', '1000', '--json', 'number,title,assignees,labels'],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
		);
	} catch (e) {
		console.error(`next-wave: gh issue list failed: ${e instanceof Error ? e.message : String(e)}`);
		process.exit(1);
	}
	return JSON.parse(out).map((i) => ({
		number: i.number,
		title: i.title,
		assignees: (i.assignees ?? []).map((a) => a.login),
		labels: (i.labels ?? []).map((l) => l.name),
	}));
}

const { size, kind, only, json } = parseArgs(process.argv.slice(2));
const root = new URL('..', import.meta.url).pathname;
const tree = readAreaTree(join(root, 'src/data'));
const livePageIds = lessonPages(join(root, 'src/content/docs'), new Set(tree.areas.map((a) => a.dir))).keys();
const issues = openIssues();
const readyIssues = issues.filter((i) => i.labels.includes('ready-for-agent'));
const openNumbers = issues.map((i) => i.number);
const result = pickWave({ tree, livePageIds, readyIssues, openIssues: openNumbers, size, kind, only });
process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : formatWave(result));
