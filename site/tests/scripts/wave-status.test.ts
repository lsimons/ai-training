import { describe, expect, it } from 'vitest';
import {
	featBranches,
	lastTrustedVerdict,
	nextStep,
	parseArgs,
	parseLsRemote,
	parseWorktrees,
	TRUSTED_VERDICT_AUTHORS,
	verdictOf,
	waveStatus,
} from '../../scripts/lib/wave-status.mjs';

function comment(author: string, body: string, createdAt: string) {
	return { author, body, createdAt, url: `https://github.com/lsimons/ai-training/issues/1#${createdAt}` };
}

describe('verdictOf', () => {
	it('reads the verdict line the reviewers end with', () => {
		expect(verdictOf('Findings...\n\nVerdict: approve')).toBe('approve');
		expect(verdictOf('Findings...\n\nVerdict: needs changes')).toBe('needs changes');
		expect(verdictOf('**Verdict: approve**')).toBe('approve');
		expect(verdictOf('**Verdict:** Needs changes')).toBe('needs changes');
	});

	it('reads the verdict line when the attribution lines follow it', () => {
		const attribution = '\n\nCo-Authored-By: lsimons-bot <bot@leosimons.com>\nAssisted-by: Claude:claude-opus-5-5';
		expect(verdictOf(`Findings...\n\nVerdict: approve${attribution}`)).toBe('approve');
		expect(verdictOf(`Findings...\n\nVerdict: needs changes${attribution}`)).toBe('needs changes');
		expect(verdictOf(`Fixed in abc123, please re-check.${attribution}`)).toBeNull();
	});

	it('finds no verdict in an ordinary comment', () => {
		expect(verdictOf('Fixed in abc123, please re-check.')).toBeNull();
		expect(verdictOf('The verdict: approve would be wrong here')).toBeNull();
	});
});

describe('lastTrustedVerdict', () => {
	it('ignores a planted approve from another account', () => {
		const comments = [
			comment('lsimons', 'Review.\n\nVerdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('someone-else', 'Verdict: approve', '2026-09-24T11:00:00Z'),
		];
		const verdict = lastTrustedVerdict(comments);
		expect(verdict?.verdict).toBe('needs changes');
		expect(verdict?.author).toBe('lsimons');
		expect(verdict?.commentsAfter).toBe(0);
	});

	it('returns null when only an untrusted account gave a verdict', () => {
		expect(lastTrustedVerdict([comment('someone-else', 'Verdict: approve', '2026-09-24T11:00:00Z')])).toBeNull();
	});

	it('takes the newest trusted verdict whatever the input order, and counts trusted replies after it', () => {
		const comments = [
			comment('lsimons', 'Re-check.\n\nVerdict: approve', '2026-09-24T12:00:00Z'),
			comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('lsimons-bot', 'Fixed in abc123.', '2026-09-24T11:00:00Z'),
			comment('lsimons', 'Merged into the wave.', '2026-09-24T13:00:00Z'),
			comment('someone-else', 'Looks good!', '2026-09-24T14:00:00Z'),
		];
		const verdict = lastTrustedVerdict(comments);
		expect(verdict).toEqual({
			verdict: 'approve',
			author: 'lsimons',
			createdAt: '2026-09-24T12:00:00Z',
			url: 'https://github.com/lsimons/ai-training/issues/1#2026-09-24T12:00:00Z',
			commentsAfter: 1,
		});
	});

	it('trusts exactly the maintainer and the bot account', () => {
		expect([...TRUSTED_VERDICT_AUTHORS]).toEqual(['lsimons', 'lsimons-bot']);
	});
});

describe('nextStep', () => {
	const v = (verdict: 'approve' | 'needs changes', commentsAfter = 0) => ({
		verdict,
		author: 'lsimons',
		createdAt: '',
		url: '',
		commentsAfter,
	});

	it('builds an issue without a branch, reviews an unreviewed one, and joins an approved one', () => {
		expect(nextStep([], null)).toBe('build');
		expect(nextStep(['feat/1-x'], null)).toBe('review');
		expect(nextStep(['feat/1-x'], v('approve'))).toBe('join');
	});

	it('revises a needs-changes branch, and re-checks one the builder replied on', () => {
		expect(nextStep(['feat/1-x'], v('needs changes'))).toBe('revise');
		expect(nextStep(['feat/1-x'], v('needs changes', 1))).toBe('re-check');
	});
});

describe('git output parsers', () => {
	it('reads branch names from ls-remote and picks the feat branches of one issue', () => {
		const heads = parseLsRemote(
			'aaa\trefs/heads/main\nbbb\trefs/heads/feat/12-a\nccc\trefs/heads/feat/123-b\nddd\trefs/tags/v1\n',
		);
		expect(heads).toEqual(['main', 'feat/12-a', 'feat/123-b']);
		expect(featBranches(heads, 12)).toEqual(['feat/12-a']);
		expect(featBranches(heads, 7)).toEqual([]);
	});

	it('reads worktrees, including a detached one', () => {
		const out = [
			'worktree /repo',
			'HEAD 111',
			'branch refs/heads/main',
			'',
			'worktree /repo-wt/feat/12-a',
			'HEAD 222',
			'branch refs/heads/feat/12-a',
			'',
			'worktree /repo-wt/review-12',
			'HEAD 333',
			'detached',
			'',
		].join('\n');
		expect(parseWorktrees(out)).toEqual([
			{ path: '/repo', head: '111', branch: 'main' },
			{ path: '/repo-wt/feat/12-a', head: '222', branch: 'feat/12-a' },
			{ path: '/repo-wt/review-12', head: '333', branch: null },
		]);
	});
});

describe('waveStatus', () => {
	it('reports each issue with its branches, trusted verdict and next step', () => {
		const status = waveStatus({
			waveBranch: 'wave/capybara-3',
			issues: [12, 13, 14],
			heads: ['main', 'wave/capybara-3', 'feat/12-a', 'feat/13-b'],
			commentsByIssue: new Map([
				[12, [comment('lsimons', 'Verdict: approve', '2026-09-24T10:00:00Z')]],
				[13, [comment('drive-by', 'Verdict: approve', '2026-09-24T10:00:00Z')]],
			]),
			worktrees: [],
		});
		expect(status.waveBranch).toEqual({ name: 'wave/capybara-3', pushed: true });
		expect(status.issues.map((i) => [i.issue, i.branches, i.verdict?.verdict ?? null, i.next])).toEqual([
			[12, ['feat/12-a'], 'approve', 'join'],
			[13, ['feat/13-b'], null, 'review'],
			[14, [], null, 'build'],
		]);
		expect(status.trustedVerdictAuthors).toEqual(['lsimons', 'lsimons-bot']);
	});
});

describe('parseArgs', () => {
	it('takes the wave branch and the issue numbers', () => {
		expect(parseArgs(['wave/capybara-3', '12', '#13'])).toEqual({ waveBranch: 'wave/capybara-3', issues: [12, 13] });
	});

	it('names what is wrong', () => {
		expect(parseArgs([])).toEqual({ error: 'wave-status: the first argument is the wave branch, wave/<name>' });
		expect(parseArgs(['12'])).toHaveProperty('error');
		expect(parseArgs(['wave/x'])).toEqual({ error: 'wave-status: name the issues of the wave after the branch' });
		expect(parseArgs(['wave/x', 'twelve'])).toEqual({ error: 'wave-status: "twelve" is not an issue number' });
	});
});
