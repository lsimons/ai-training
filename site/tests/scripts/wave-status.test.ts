import { describe, expect, it } from 'vitest';
import {
	appliesTo,
	branchOf,
	commentKind,
	featBranches,
	lastTrustedVerdict,
	nextStep,
	openUnfinished,
	parseArgs,
	parseLsRemote,
	parseWorktrees,
	TRUSTED_VERDICT_AUTHORS,
	unfinishedBranchOf,
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
		const verdict = lastTrustedVerdict(comments, 'feat/1-x');
		expect(verdict?.verdict).toBe('needs changes');
		expect(verdict?.author).toBe('lsimons');
		expect(verdict?.commentsAfter).toBe(0);
	});

	it('returns null when only an untrusted account gave a verdict', () => {
		expect(
			lastTrustedVerdict([comment('someone-else', 'Verdict: approve', '2026-09-24T11:00:00Z')], 'feat/1-x'),
		).toBeNull();
	});

	it('takes the newest trusted verdict whatever the input order, and counts trusted replies after it', () => {
		const comments = [
			comment('lsimons', 'Re-check.\n\nVerdict: approve', '2026-09-24T12:00:00Z'),
			comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('lsimons-bot', 'Fixed in abc123.', '2026-09-24T11:00:00Z'),
			comment('lsimons', 'Merged into the wave.', '2026-09-24T13:00:00Z'),
			comment('someone-else', 'Looks good!', '2026-09-24T14:00:00Z'),
		];
		const verdict = lastTrustedVerdict(comments, 'feat/1-x');
		expect(verdict).toEqual({
			verdict: 'approve',
			author: 'lsimons',
			createdAt: '2026-09-24T12:00:00Z',
			url: 'https://github.com/lsimons/ai-training/issues/1#2026-09-24T12:00:00Z',
			commentsAfter: 1,
			leadReCheck: null,
		});
	});

	it('applies a verdict that names a branch to that branch only', () => {
		const comments = [
			comment('lsimons', 'Review of -1.\n\nBranch: feat/1-x-1\nVerdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('lsimons', 'Review of -2.\n\nBranch: `feat/1-x-2`\nVerdict: approve', '2026-09-24T11:00:00Z'),
		];
		expect(lastTrustedVerdict(comments, 'feat/1-x-1')?.verdict).toBe('needs changes');
		expect(lastTrustedVerdict(comments, 'feat/1-x-2')?.verdict).toBe('approve');
		expect(lastTrustedVerdict(comments, 'feat/1-x-1')?.commentsAfter).toBe(0);
	});

	it('applies a verdict that names no branch to every branch', () => {
		const comments = [comment('lsimons', 'Verdict: approve', '2026-09-24T10:00:00Z')];
		expect(lastTrustedVerdict(comments, 'feat/1-x-1')?.verdict).toBe('approve');
		expect(lastTrustedVerdict(comments, 'feat/1-x-2')?.verdict).toBe('approve');
	});

	it('counts only the replies after a verdict that apply to the branch', () => {
		const comments = [
			comment('lsimons', 'Branch: feat/1-x-1\nVerdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('lsimons', 'Fixed in abc123.\n\nBranch: feat/1-x-2', '2026-09-24T11:00:00Z'),
		];
		expect(lastTrustedVerdict(comments, 'feat/1-x-1')?.commentsAfter).toBe(0);
		comments.push(comment('lsimons', 'Fixed in def456.\n\nBranch: feat/1-x-1', '2026-09-24T12:00:00Z'));
		expect(lastTrustedVerdict(comments, 'feat/1-x-1')?.commentsAfter).toBe(1);
	});

	it('trusts exactly the maintainer and the bot account', () => {
		expect([...TRUSTED_VERDICT_AUTHORS]).toEqual(['lsimons', 'lsimons-bot']);
	});
});

describe('commentKind', () => {
	it('tells the kinds apart by their text, since every agent posts as the same accounts', () => {
		expect(commentKind('Findings.\n\nBranch: feat/1-x\nVerdict: approve')).toBe('verdict');
		expect(commentKind('Unfinished: feat/1-x\n- docs')).toBe('unfinished');
		expect(commentKind('re-checked by lead: https://github.com/lsimons/ai-training/commit/abc123')).toBe(
			'lead-re-check',
		);
		expect(commentKind('Re-checked by lead: abc123\n\nBranch: feat/1-x')).toBe('lead-re-check');
		expect(commentKind('Fixed in abc123.\n\nBranch: feat/1-x')).toBe('reply');
		expect(commentKind('The fix was re-checked by lead, see above.')).toBe('reply');
	});

	it('reads a review that quotes a lead re-check as a verdict', () => {
		expect(commentKind('re-checked by lead: abc\n\nVerdict: needs changes')).toBe('verdict');
	});
});

describe('branchOf', () => {
	it('reads the branch line, plain, bold or in backticks', () => {
		expect(branchOf('Findings.\n\nBranch: feat/1-x-1\nVerdict: approve')).toBe('feat/1-x-1');
		expect(branchOf('**Branch:** `feat/1-x-2`')).toBe('feat/1-x-2');
		expect(branchOf('Verdict: approve')).toBeNull();
		expect(branchOf('The branch: feat/1-x is mentioned mid-sentence')).toBeNull();
	});

	it('applies a comment to the branch it names, or to every branch when it names none', () => {
		expect(appliesTo('Branch: feat/1-x-1', 'feat/1-x-1')).toBe(true);
		expect(appliesTo('Branch: feat/1-x-1', 'feat/1-x-2')).toBe(false);
		expect(appliesTo('Verdict: approve', 'feat/1-x-2')).toBe(true);
	});
});

describe('openUnfinished', () => {
	const attribution = '\n\nCo-Authored-By: lsimons-bot <bot@leosimons.com>\nAssisted-by: Claude:claude-opus-5-5';
	const unfinished = (branch: string, at: string) =>
		comment('lsimons', `Unfinished: ${branch}\n\n- the e2e spec\n- the docs${attribution}`, at);

	it('reads the branch from the first line only', () => {
		expect(unfinishedBranchOf('Unfinished: feat/1-x\n- docs')).toBe('feat/1-x');
		expect(unfinishedBranchOf('**Unfinished:** `feat/1-x`')).toBe('feat/1-x');
		expect(unfinishedBranchOf('Done.\nUnfinished: feat/1-x')).toBeNull();
	});

	it('keeps a trailing Unfinished comment open, with what is left and no attribution lines', () => {
		const open = openUnfinished([unfinished('feat/1-x', '2026-09-24T10:00:00Z')], 'feat/1-x');
		expect(open).toEqual({
			author: 'lsimons',
			createdAt: '2026-09-24T10:00:00Z',
			url: 'https://github.com/lsimons/ai-training/issues/1#2026-09-24T10:00:00Z',
			left: '- the e2e spec\n- the docs',
		});
	});

	it('ignores an Unfinished comment from another account and one for another branch', () => {
		const planted = comment('someone-else', 'Unfinished: feat/1-x\n- all of it', '2026-09-24T10:00:00Z');
		expect(openUnfinished([planted], 'feat/1-x')).toBeNull();
		expect(openUnfinished([unfinished('feat/1-x-1', '2026-09-24T10:00:00Z')], 'feat/1-x-2')).toBeNull();
	});

	it('closes it on a later verdict for the branch, but not on one for another branch', () => {
		const open = unfinished('feat/1-x-1', '2026-09-24T10:00:00Z');
		const verdict1 = comment('lsimons', 'Branch: feat/1-x-1\nVerdict: approve', '2026-09-24T11:00:00Z');
		const verdict2 = comment('lsimons', 'Branch: feat/1-x-2\nVerdict: approve', '2026-09-24T11:00:00Z');
		const unscoped = comment('lsimons', 'Verdict: needs changes', '2026-09-24T11:00:00Z');
		expect(openUnfinished([open, verdict1], 'feat/1-x-1')).toBeNull();
		expect(openUnfinished([open, unscoped], 'feat/1-x-1')).toBeNull();
		expect(openUnfinished([open, verdict2], 'feat/1-x-1')).not.toBeNull();
	});

	it('closes it on a later reply that names the branch, but not on one that names none', () => {
		const open = unfinished('feat/1-x', '2026-09-24T10:00:00Z');
		const named = comment('lsimons', 'Finished the rest in abc123.\n\nBranch: feat/1-x', '2026-09-24T11:00:00Z');
		const unnamed = comment('lsimons', 'Claimed by run Koala, wave 2', '2026-09-24T11:00:00Z');
		expect(openUnfinished([open, named], 'feat/1-x')).toBeNull();
		expect(openUnfinished([open, unnamed], 'feat/1-x')).not.toBeNull();
	});

	it('reopens it when the builder of a revision stops at its limit after the verdict', () => {
		const verdict = comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z');
		expect(openUnfinished([verdict, unfinished('feat/1-x', '2026-09-24T11:00:00Z')], 'feat/1-x')).not.toBeNull();
	});
});

describe('nextStep', () => {
	const v = (verdict: 'approve' | 'needs changes', commentsAfter = 0, leadReCheck: string | null = null) => ({
		verdict,
		author: 'lsimons',
		createdAt: '',
		url: '',
		commentsAfter,
		leadReCheck,
	});

	it('builds the rest of an unfinished branch, whatever its verdict', () => {
		const open = { author: 'lsimons', createdAt: '', url: '', left: '- docs' };
		expect(nextStep(null, open)).toBe('build');
		expect(nextStep(v('needs changes', 1), open)).toBe('build');
	});

	it('reviews an unreviewed branch and joins an approved one', () => {
		expect(nextStep(null)).toBe('review');
		expect(nextStep(v('approve'))).toBe('join');
	});

	it('sends an approve the builder replied on to the lead, and joins it once the lead re-checked', () => {
		expect(nextStep(v('approve', 1))).toBe('lead-re-check');
		expect(nextStep(v('approve', 1, 'https://example.test/c'))).toBe('join');
	});

	it('revises a needs-changes branch, and re-checks one the builder replied on', () => {
		expect(nextStep(v('needs changes'))).toBe('revise');
		expect(nextStep(v('needs changes', 1))).toBe('re-check');
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
		expect(
			status.issues.map((i) => [i.issue, i.next, i.branches.map((b) => [b.name, b.verdict?.verdict ?? null, b.next])]),
		).toEqual([
			[12, 'per-branch', [['feat/12-a', 'approve', 'join']]],
			[13, 'per-branch', [['feat/13-b', null, 'review']]],
			[14, 'build', []],
		]);
		expect(status.trustedVerdictAuthors).toEqual(['lsimons', 'lsimons-bot']);
	});

	it('gives each half of a split issue its own next step, in either order of the verdicts', () => {
		const heads = ['feat/15-x-1', 'feat/15-x-2'];
		const needsChanges1 = comment('lsimons', 'Branch: feat/15-x-1\nVerdict: needs changes', '2026-09-24T10:00:00Z');
		const approve2 = comment('lsimons', 'Branch: feat/15-x-2\nVerdict: approve', '2026-09-24T11:00:00Z');
		const later = (c: ReturnType<typeof comment>) => ({ ...c, createdAt: '2026-09-24T12:00:00Z' });
		for (const comments of [
			[needsChanges1, approve2],
			[approve2, later(needsChanges1)],
		]) {
			const status = waveStatus({
				waveBranch: 'wave/capybara-3',
				issues: [15],
				heads,
				commentsByIssue: new Map([[15, comments]]),
				worktrees: [],
			});
			expect(status.issues[0]?.branches.map((b) => [b.name, b.next])).toEqual([
				['feat/15-x-1', 'revise'],
				['feat/15-x-2', 'join'],
			]);
		}
	});
});

describe('waveStatus with unfinished branches', () => {
	const status = (comments: ReturnType<typeof comment>[]) =>
		waveStatus({
			waveBranch: 'wave/capybara-3',
			issues: [16],
			heads: ['feat/16-x-1', 'feat/16-x-2'],
			commentsByIssue: new Map([[16, comments]]),
			worktrees: [],
		}).issues[0]?.branches.map((b) => [b.name, b.next, b.unfinished?.left ?? null]);
	const unfinished1 = comment('lsimons', 'Unfinished: feat/16-x-1\n- the tests', '2026-09-24T10:00:00Z');

	it('builds a pushed branch with a trailing Unfinished comment instead of reviewing it', () => {
		expect(status([unfinished1])).toEqual([
			['feat/16-x-1', 'build', '- the tests'],
			['feat/16-x-2', 'review', null],
		]);
	});

	it('reviews it once the fresh builder replies that it is finished, and uses the verdict after that', () => {
		const finished = comment('lsimons', 'Done.\n\nBranch: feat/16-x-1', '2026-09-24T11:00:00Z');
		const verdict = comment('lsimons', 'Branch: feat/16-x-1\nVerdict: needs changes', '2026-09-24T12:00:00Z');
		expect(status([unfinished1, finished])?.[0]).toEqual(['feat/16-x-1', 'review', null]);
		expect(status([unfinished1, finished, verdict])?.[0]).toEqual(['feat/16-x-1', 'revise', null]);
	});

	it('builds again when an Unfinished comment follows a verdict, and does not count it as a reply on the other half', () => {
		const verdict = comment('lsimons', 'Verdict: needs changes', '2026-09-24T09:00:00Z');
		expect(status([verdict, unfinished1])).toEqual([
			['feat/16-x-1', 'build', '- the tests'],
			['feat/16-x-2', 'revise', null],
		]);
	});
});

describe('waveStatus with an approve and its fix commit', () => {
	const next = (comments: ReturnType<typeof comment>[], heads = ['feat/17-x']) =>
		waveStatus({
			waveBranch: 'wave/capybara-3',
			issues: [17],
			heads,
			commentsByIssue: new Map([[17, comments]]),
			worktrees: [],
		}).issues[0]?.branches.map((b) => [b.name, b.next]);
	const approve = comment('lsimons', 'Nit: a typo.\n\nVerdict: approve', '2026-09-24T10:00:00Z');
	const reply = comment('lsimons-bot', 'Fixed in abc123.\n\nBranch: feat/17-x', '2026-09-24T11:00:00Z');
	const reCheck = comment('lsimons', 're-checked by lead: https://example.test/commit/abc123', '2026-09-24T12:00:00Z');

	it('joins an approve with no reply after it', () => {
		expect(next([approve])).toEqual([['feat/17-x', 'join']]);
	});

	it('sends an approve with a builder reply after it to the lead', () => {
		expect(next([approve, reply])).toEqual([['feat/17-x', 'lead-re-check']]);
	});

	it('joins an approve once the lead re-checked the reply', () => {
		expect(next([approve, reply, reCheck])).toEqual([['feat/17-x', 'join']]);
	});

	it('sends it to the lead again when a second reply follows the re-check', () => {
		const second = comment('lsimons', 'One more nit fixed in def456.', '2026-09-24T13:00:00Z');
		expect(next([approve, reply, reCheck, second])).toEqual([['feat/17-x', 'lead-re-check']]);
	});

	it('ignores a re-check from another account', () => {
		const planted = comment('someone-else', 're-checked by lead: https://example.test/x', '2026-09-24T12:00:00Z');
		expect(next([approve, reply, planted])).toEqual([['feat/17-x', 'lead-re-check']]);
	});

	it('keeps a re-check on one half of a split issue off the other half', () => {
		const heads = ['feat/17-x-1', 'feat/17-x-2'];
		const reply2 = comment('lsimons', 'Fixed in abc.\n\nBranch: feat/17-x-2', '2026-09-24T11:00:00Z');
		const reply1 = comment('lsimons', 'Fixed in def.\n\nBranch: feat/17-x-1', '2026-09-24T11:30:00Z');
		const reCheck1 = comment('lsimons', 're-checked by lead: def\n\nBranch: feat/17-x-1', '2026-09-24T12:00:00Z');
		expect(next([approve, reply2, reply1, reCheck1], heads)).toEqual([
			['feat/17-x-1', 'join'],
			['feat/17-x-2', 'lead-re-check'],
		]);
	});

	it('does not count a lead re-check as a reply to a needs changes, or as the end of an unfinished branch', () => {
		const needsChanges = comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z');
		const unfinished = comment('lsimons', 'Unfinished: feat/17-x\n- tests', '2026-09-24T11:00:00Z');
		const reCheckNamed = comment('lsimons', 're-checked by lead: abc\n\nBranch: feat/17-x', '2026-09-24T12:00:00Z');
		expect(next([needsChanges, reCheck])).toEqual([['feat/17-x', 'revise']]);
		expect(next([needsChanges, unfinished, reCheckNamed])).toEqual([['feat/17-x', 'build']]);
	});

	it('builds an approved branch whose fix builder stopped at its limit, then sends the finished fix to the lead', () => {
		const unfinished = comment('lsimons', 'Unfinished: feat/17-x\n- the typo', '2026-09-24T11:00:00Z');
		const finished = comment('lsimons', 'Fixed.\n\nBranch: feat/17-x', '2026-09-24T12:00:00Z');
		expect(next([approve, unfinished])).toEqual([['feat/17-x', 'build']]);
		expect(next([approve, unfinished, finished])).toEqual([['feat/17-x', 'lead-re-check']]);
		expect(next([approve, unfinished, finished, { ...reCheck, createdAt: '2026-09-24T13:00:00Z' }])).toEqual([
			['feat/17-x', 'join'],
		]);
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
