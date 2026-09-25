#!/usr/bin/env bun
/**
 * The state of a wave for a resuming lead (`mise run wave-status -- <wave-branch> <issue>...`):
 * prints JSON with the wave branch, each issue's pushed `feat/<issue>-*`
 * branches, per branch the last `Verdict:` comment from a trusted account
 * that applies to it and the next step, and the local worktrees. The rules are in scripts/lib/wave-status.mjs,
 * which tests/scripts/wave-status.test.ts covers. This file runs git and gh and prints.
 */
import { execFileSync } from 'node:child_process';
import { parseArgs, parseLsRemote, parseWorktrees, waveStatus } from './lib/wave-status.mjs';

const REPO = 'lsimons/ai-training';

/** @param {string} cmd @param {string[]} args */
function run(cmd, args) {
	try {
		return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
	} catch (e) {
		console.error(`wave-status: ${cmd} ${args.join(' ')} failed: ${e instanceof Error ? e.message : String(e)}`);
		process.exit(1);
	}
}

/** @param {number} issue */
function comments(issue) {
	const out = run('gh', ['issue', 'view', String(issue), '-R', REPO, '--json', 'comments']);
	return JSON.parse(out).comments.map((c) => ({
		author: c.author?.login ?? '',
		body: c.body ?? '',
		createdAt: c.createdAt ?? '',
		url: c.url ?? '',
	}));
}

const args = parseArgs(process.argv.slice(2));
if ('error' in args) {
	console.error(args.error);
	console.error('usage: mise run wave-status -- <wave-branch> <issue> [<issue> ...]');
	process.exit(2);
}
const heads = parseLsRemote(run('git', ['ls-remote', '--heads', 'origin']));
const commentsByIssue = new Map(args.issues.map((n) => [n, comments(n)]));
const worktrees = parseWorktrees(run('git', ['worktree', 'list', '--porcelain']));
const status = waveStatus({ waveBranch: args.waveBranch, issues: args.issues, heads, commentsByIssue, worktrees });
process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
