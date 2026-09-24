#!/usr/bin/env bun
/**
 * Names for dispatcher runs (`mise run run-name [-- --check N]`, #353).
 * Prints JSON with the open runs (the `dispatcher-run` issues) and the name
 * the next run takes. With `--check N`, for the run issue #N this
 * dispatcher just opened, it also prints `takenBy`: the older open run with
 * the same name, or null. The rules are in scripts/lib/run-names.mjs, which
 * tests/scripts/run-names.test.ts covers. This file reads the names, runs
 * gh and prints.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { nameTakenBy, nextRunName, parseArgs, RUN_LABEL, runNameSequence, runOf } from './lib/run-names.mjs';

const REPO = 'lsimons/ai-training';
const NAMES = new URL('../../.claude/skills/wave/run-names.yaml', import.meta.url);

const args = parseArgs(process.argv.slice(2));
if ('error' in args) {
	console.error(args.error);
	console.error('usage: mise run run-name [-- --check <issue>]');
	process.exit(2);
}

let out;
try {
	out = execFileSync(
		'gh',
		['issue', 'list', '-R', REPO, '-l', RUN_LABEL, '-s', 'all', '-L', '1000', '--json', 'number,title,state,createdAt'],
		{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
	);
} catch (e) {
	console.error(`run-name: gh issue list failed: ${e instanceof Error ? e.message : String(e)}`);
	process.exit(1);
}
const runs = JSON.parse(out).flatMap((issue) => runOf(issue) ?? []);
const sequence = runNameSequence(readFileSync(NAMES, 'utf8'));
const report = {
	open: runs.filter((r) => r.open).sort((a, b) => a.number - b.number),
	next: nextRunName(sequence, runs),
	...(args.check === null ? {} : { takenBy: nameTakenBy(runs, args.check) }),
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
