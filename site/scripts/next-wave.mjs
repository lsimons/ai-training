#!/usr/bin/env bun
/**
 * Wave picker (`mise run next-wave -- --size 6 [--json]`): the planned lessons
 * the next wave of builders should take on, from the data tree of this
 * checkout and the `ready-for-agent` issues on GitHub (`gh issue list`). The
 * rules are in scripts/lib/next-wave.mjs, which tests/scripts/next-wave.test.ts
 * covers; this file fetches the issues and prints.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readAreaTree } from './lib/area-tree.mjs';
import { lessonPages } from './lib/data.mjs';
import { pickWave } from './lib/next-wave.mjs';

const REPO = 'lsimons/ai-training';

/** `--size N` (default 6) and `--json` from the command line. */
function parseArgs(argv) {
	let size = 6;
	let json = false;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--json') json = true;
		else if (argv[i] === '--size') {
			size = Number.parseInt(argv[++i] ?? '', 10);
			if (!Number.isInteger(size) || size < 1) {
				console.error('next-wave: --size needs a positive integer');
				process.exit(2);
			}
		} else {
			console.error(`next-wave: unknown argument ${argv[i]}`);
			process.exit(2);
		}
	}
	return { size, json };
}

/** The open `ready-for-agent` issues, with assignees as login names. */
function readyIssues() {
	const out = execFileSync(
		'gh',
		['issue', 'list', '-R', REPO, '-l', 'ready-for-agent', '-L', '500', '--json', 'number,title,assignees'],
		{ encoding: 'utf8' },
	);
	return JSON.parse(out).map((i) => ({
		number: i.number,
		title: i.title,
		assignees: (i.assignees ?? []).map((a) => a.login),
	}));
}

const { size, json } = parseArgs(process.argv.slice(2));
const root = new URL('..', import.meta.url).pathname;
const tree = readAreaTree(join(root, 'src/data'));
const livePageIds = lessonPages(join(root, 'src/content/docs'), new Set(tree.areas.map((a) => a.dir))).keys();
const result = pickWave({ tree, livePageIds, readyIssues: readyIssues(), size });

if (json) {
	console.log(JSON.stringify(result, null, 2));
} else {
	console.log(`## Wave (${result.wave.length} of ${size})\n`);
	console.log('| Issue | Lesson | Course position | Planned `after` |');
	console.log('| ----- | ------ | --------------- | --------------- |');
	for (const w of result.wave) {
		const position = w.position === null ? `${w.course} (unlisted)` : `${w.course} ${w.position}`;
		console.log(
			`| #${w.issue} | \`${w.id}\` | ${position} | ${w.afterPlanned.map((x) => `\`${x}\``).join(', ') || '-'} |`,
		);
	}
	console.log(`\n## Blocked (${result.blocked.length})\n`);
	for (const b of result.blocked) console.log(`- #${b.issue} \`${b.id}\`: assumes ${b.blockedBy.join(', ')}`);
	console.log(`\n## Skipped (${result.skipped.length})\n`);
	for (const s of result.skipped) console.log(`- #${s.issue} \`${s.id}\`: ${s.reason}`);
	console.log(`\n## Waiting for a later wave (${result.waiting.length})\n`);
	const byArea = Map.groupBy(result.waiting, (w) => w.area);
	for (const [area, entries] of byArea) console.log(`- ${area}: ${entries.map((w) => `#${w.issue}`).join(' ')}`);
}
