import { describe, expect, it } from 'vitest';
import {
	appliesTo,
	branchOf,
	commentKind,
	featBranches,
	lastTrustedVerdict,
	nextStep,
	normalizeBranch,
	openUnfinished,
	parseArgs,
	parseLsRemote,
	parseWorktrees,
	TRUSTED_VERDICT_AUTHORS,
	unfinishedBranchOf,
	verdictOf,
	waveStatus,
} from '../../scripts/lib/wave-status.mjs';

/** The pushed branches of issue 1, as one branch or as the two halves of a split. */
const ONE = ['feat/1-x'];
const SPLIT = ['feat/1-x-1', 'feat/1-x-2'];

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
		const verdict = lastTrustedVerdict(comments, 'feat/1-x', ONE);
		expect(verdict?.verdict).toBe('needs changes');
		expect(verdict?.author).toBe('lsimons');
		expect(verdict?.commentsAfter).toBe(0);
	});

	it('returns null when only an untrusted account gave a verdict', () => {
		expect(
			lastTrustedVerdict([comment('someone-else', 'Verdict: approve', '2026-09-24T11:00:00Z')], 'feat/1-x', ONE),
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
		const verdict = lastTrustedVerdict(comments, 'feat/1-x', ONE);
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
		expect(lastTrustedVerdict(comments, 'feat/1-x-1', SPLIT)?.verdict).toBe('needs changes');
		expect(lastTrustedVerdict(comments, 'feat/1-x-2', SPLIT)?.verdict).toBe('approve');
		expect(lastTrustedVerdict(comments, 'feat/1-x-1', SPLIT)?.commentsAfter).toBe(0);
	});

	it('applies a verdict that names no branch to every branch, except an approve on a split issue', () => {
		const needsChanges = [comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z')];
		expect(lastTrustedVerdict(needsChanges, 'feat/1-x-1', SPLIT)?.verdict).toBe('needs changes');
		expect(lastTrustedVerdict(needsChanges, 'feat/1-x-2', SPLIT)?.verdict).toBe('needs changes');
		const approve = [comment('lsimons', 'Verdict: approve', '2026-09-24T10:00:00Z')];
		expect(lastTrustedVerdict(approve, 'feat/1-x', ONE)?.verdict).toBe('approve');
		expect(lastTrustedVerdict(approve, 'feat/1-x-1', SPLIT)).toBeNull();
		expect(lastTrustedVerdict(approve, 'feat/1-x-2', SPLIT)).toBeNull();
	});

	it('counts only the replies after a verdict that apply to the branch', () => {
		const comments = [
			comment('lsimons', 'Branch: feat/1-x-1\nVerdict: needs changes', '2026-09-24T10:00:00Z'),
			comment('lsimons', 'Fixed in abc123.\n\nBranch: feat/1-x-2', '2026-09-24T11:00:00Z'),
		];
		expect(lastTrustedVerdict(comments, 'feat/1-x-1', SPLIT)?.commentsAfter).toBe(0);
		comments.push(comment('lsimons', 'Fixed in def456.\n\nBranch: feat/1-x-1', '2026-09-24T12:00:00Z'));
		expect(lastTrustedVerdict(comments, 'feat/1-x-1', SPLIT)?.commentsAfter).toBe(1);
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
		expect(appliesTo('Branch: feat/1-x-1', 'feat/1-x-1', SPLIT)).toBe(true);
		expect(appliesTo('Branch: feat/1-x-1', 'feat/1-x-2', SPLIT)).toBe(false);
		expect(appliesTo('Verdict: needs changes', 'feat/1-x-2', SPLIT)).toBe(true);
		expect(appliesTo('Fixed.', 'feat/1-x-2', SPLIT)).toBe(true);
		expect(appliesTo('Verdict: approve', 'feat/1-x', ONE)).toBe(true);
		expect(appliesTo('re-checked by lead: abc', 'feat/1-x', ONE)).toBe(true);
	});

	it('applies an approve or a lead re-check that names no branch to no half of a split issue', () => {
		expect(appliesTo('Verdict: approve', 'feat/1-x-1', SPLIT)).toBe(false);
		expect(appliesTo('re-checked by lead: abc', 'feat/1-x-2', SPLIT)).toBe(false);
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
		const open = openUnfinished([unfinished('feat/1-x', '2026-09-24T10:00:00Z')], 'feat/1-x', ONE);
		expect(open).toEqual({
			author: 'lsimons',
			createdAt: '2026-09-24T10:00:00Z',
			url: 'https://github.com/lsimons/ai-training/issues/1#2026-09-24T10:00:00Z',
			left: '- the e2e spec\n- the docs',
		});
	});

	it('ignores an Unfinished comment from another account and one for another branch', () => {
		const planted = comment('someone-else', 'Unfinished: feat/1-x\n- all of it', '2026-09-24T10:00:00Z');
		expect(openUnfinished([planted], 'feat/1-x', ONE)).toBeNull();
		expect(openUnfinished([unfinished('feat/1-x-1', '2026-09-24T10:00:00Z')], 'feat/1-x-2', SPLIT)).toBeNull();
	});

	it('closes it on a later verdict for the branch, but not on one for another branch', () => {
		const open = unfinished('feat/1-x-1', '2026-09-24T10:00:00Z');
		const verdict1 = comment('lsimons', 'Branch: feat/1-x-1\nVerdict: approve', '2026-09-24T11:00:00Z');
		const verdict2 = comment('lsimons', 'Branch: feat/1-x-2\nVerdict: approve', '2026-09-24T11:00:00Z');
		const unscoped = comment('lsimons', 'Verdict: needs changes', '2026-09-24T11:00:00Z');
		expect(openUnfinished([open, verdict1], 'feat/1-x-1', SPLIT)).toBeNull();
		expect(openUnfinished([open, unscoped], 'feat/1-x-1', SPLIT)).toBeNull();
		expect(openUnfinished([open, verdict2], 'feat/1-x-1', SPLIT)).not.toBeNull();
	});

	it('closes it on a later reply that names the branch, but not on one that names none', () => {
		const open = unfinished('feat/1-x', '2026-09-24T10:00:00Z');
		const named = comment('lsimons', 'Finished the rest in abc123.\n\nBranch: feat/1-x', '2026-09-24T11:00:00Z');
		const unnamed = comment('lsimons', 'Claimed by run Koala, wave 2', '2026-09-24T11:00:00Z');
		expect(openUnfinished([open, named], 'feat/1-x', ONE)).toBeNull();
		expect(openUnfinished([open, unnamed], 'feat/1-x', ONE)).not.toBeNull();
	});

	it('reopens it when the builder of a revision stops at its limit after the verdict', () => {
		const verdict = comment('lsimons', 'Verdict: needs changes', '2026-09-24T10:00:00Z');
		expect(openUnfinished([verdict, unfinished('feat/1-x', '2026-09-24T11:00:00Z')], 'feat/1-x', ONE)).not.toBeNull();
	});
});

describe('branch names that are near misses', () => {
	it('requires the colon and the capital B, so a line that starts with the word names no branch', () => {
		expect(branchOf('Fixed the two nits.\nBranch coverage of wave-status.mjs stays at 95%.')).toBeNull();
		expect(branchOf('Branches pushed: feat/1-x-1 and feat/1-x-2')).toBeNull();
		expect(branchOf('branch: feat/1-x')).toBeNull();
		expect(branchOf('Fixed.\nBranch coverage of wave-status.mjs stays at 95%.\nBranch: feat/1-x')).toBe('feat/1-x');
	});

	it('takes the last Branch line outside a code fence', () => {
		const fenced =
			'The reviewers now write:\n\n```text\nBranch: feat/9-example\nVerdict: approve\n```\n\nBranch: feat/1-x';
		expect(branchOf(fenced)).toBe('feat/1-x');
		expect(branchOf('~~~\nBranch: feat/9-example\n~~~')).toBeNull();
		expect(branchOf('Branch: feat/1-x-1\nlater:\nBranch: feat/1-x-2')).toBe('feat/1-x-2');
	});

	it('drops a leading origin/ and trailing punctuation', () => {
		expect(normalizeBranch('origin/feat/1-x')).toBe('feat/1-x');
		expect(normalizeBranch('feat/1-x.')).toBe('feat/1-x');
		expect(branchOf('Branch: feat/1-x.')).toBe('feat/1-x');
		expect(unfinishedBranchOf('Unfinished: origin/feat/1-x')).toBe('feat/1-x');
		expect(unfinishedBranchOf('Unfinished: feat/1-x.')).toBe('feat/1-x');
	});

	it('reads a first line that starts with the word Unfinished but has no colon as no hand-back', () => {
		expect(unfinishedBranchOf('Unfinished items from the review are below')).toBeNull();
		expect(commentKind('Unfinished items from the review are below')).toBe('reply');
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
		const approve1 = comment('lsimons', 'Branch: feat/17-x-1\nVerdict: approve', '2026-09-24T10:00:00Z');
		const approve2 = comment('lsimons', 'Branch: feat/17-x-2\nVerdict: approve', '2026-09-24T10:00:00Z');
		expect(next([approve1, approve2, reply2, reply1, reCheck1], heads)).toEqual([
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

describe('waveStatus with near-miss branch names', () => {
	const next = (comments: ReturnType<typeof comment>[], heads = ['feat/18-x']) =>
		waveStatus({
			waveBranch: 'wave/capybara-3',
			issues: [18],
			heads,
			commentsByIssue: new Map([[18, comments]]),
			worktrees: [],
		}).issues[0]?.branches.map((b) => [b.name, b.next]);
	const approve = comment('lsimons', 'Branch: feat/18-x\nVerdict: approve', '2026-09-24T10:00:00Z');
	const at = (body: string) => comment('lsimons', body, '2026-09-24T11:00:00Z');

	it('sends a fix reply with a Branch coverage line to the lead instead of joining it', () => {
		const reply = at('Fixed the two nits.\nBranch coverage of wave-status.mjs stays at 95%.\nBranch: feat/18-x');
		expect(next([approve, reply])).toEqual([['feat/18-x', 'lead-re-check']]);
	});

	it('reads origin/ and trailing punctuation on Unfinished and Branch lines as the pushed branch', () => {
		expect(next([approve, at('Unfinished: origin/feat/18-x\n- the nit')])).toEqual([['feat/18-x', 'build']]);
		expect(next([approve, at('Unfinished: feat/18-x.\n- the nit')])).toEqual([['feat/18-x', 'build']]);
		expect(next([approve, at('Fixed.\n\nBranch: feat/18-x.')])).toEqual([['feat/18-x', 'lead-re-check']]);
	});

	it('reads an Unfinished line without a colon as a reply, so an approve still goes to the lead', () => {
		expect(next([approve, at('Unfinished items from the review are below:\n- none')])).toEqual([
			['feat/18-x', 'lead-re-check'],
		]);
	});

	it('applies a reply or Unfinished comment that names no pushed branch to every branch', () => {
		const heads = ['feat/18-x-1', 'feat/18-x-2'];
		const approve1 = comment('lsimons', 'Branch: feat/18-x-1\nVerdict: approve', '2026-09-24T10:00:00Z');
		const approve2 = comment('lsimons', 'Branch: feat/18-x-2\nVerdict: approve', '2026-09-24T10:00:00Z');
		expect(next([approve1, approve2, at('Fixed.\n\nBranch: feat/18-typo')], heads)).toEqual([
			['feat/18-x-1', 'lead-re-check'],
			['feat/18-x-2', 'lead-re-check'],
		]);
		expect(next([approve1, approve2, at('Unfinished: feat/18-typo\n- tests')], heads)).toEqual([
			['feat/18-x-1', 'build'],
			['feat/18-x-2', 'build'],
		]);
	});

	it('applies a needs changes that names no pushed branch to every branch, so an earlier approve does not join', () => {
		const needsChanges = comment('lsimons', 'Branch: feat/18-typo\nVerdict: needs changes', '2026-09-24T11:00:00Z');
		expect(next([approve, needsChanges])).toEqual([['feat/18-x', 'revise']]);
	});

	it('applies an approve or lead re-check that names no pushed branch to none', () => {
		expect(next([comment('lsimons', 'Branch: feat/18-typo\nVerdict: approve', '2026-09-24T10:00:00Z')])).toEqual([
			['feat/18-x', 'review'],
		]);
		const reply = at('Fixed.\n\nBranch: feat/18-x');
		const reCheck = comment('lsimons', 're-checked by lead: abc\n\nBranch: feat/18-typo', '2026-09-24T12:00:00Z');
		expect(next([approve, reply, reCheck])).toEqual([['feat/18-x', 'lead-re-check']]);
	});
});

describe('waveStatus for every comment kind and every way it names a branch', () => {
	// Each row: a comment kind, the comments before it, and the step it gives
	// for each way of naming a branch. A comment that fails to match gives
	// more work, never `join`, unless an approve (or a lead re-check of one)
	// really applies to the branch.
	type Naming = 'branch' | 'origin/' | 'period' | 'other half' | 'typo' | 'nothing';
	const at = (minute: number, body: string) =>
		comment('lsimons', body, `2026-09-24T10:${String(minute).padStart(2, '0')}:00Z`);
	const branchLine = (name: string) => (name ? `\n\nBranch: ${name}` : '');

	function matrix(heads: string[], branch: string) {
		const other = heads.find((h) => h !== branch) ?? '';
		const names: Record<Naming, string> = {
			branch,
			'origin/': `origin/${branch}`,
			period: `${branch}.`,
			'other half': other,
			typo: 'feat/19-typo',
			nothing: '',
		};
		const approveAll = heads.map((h, i) => at(i, `Findings.${branchLine(h)}\nVerdict: approve`));
		const needsChangesAll = heads.map((h, i) => at(i, `Findings.${branchLine(h)}\nVerdict: needs changes`));
		const replyAll = heads.map((h, i) => at(10 + i, `Fixed in abc.${branchLine(h)}`));
		const kinds = {
			approve: { before: needsChangesAll, body: (n: string) => `Findings.${branchLine(n)}\nVerdict: approve` },
			'needs changes': { before: approveAll, body: (n: string) => `Findings.${branchLine(n)}\nVerdict: needs changes` },
			'Unfinished:': { before: approveAll, body: (n: string) => `Unfinished: ${n}\n- the tests` },
			're-checked by lead': {
				before: [...approveAll, ...replyAll],
				body: (n: string) => `re-checked by lead: https://example.test/commit/abc${branchLine(n)}`,
			},
			reply: { before: approveAll, body: (n: string) => `Fixed in def.${branchLine(n)}` },
		};
		return (kind: keyof typeof kinds, naming: Naming) => {
			const { before, body } = kinds[kind];
			const status = waveStatus({
				waveBranch: 'wave/capybara-3',
				issues: [19],
				heads,
				commentsByIssue: new Map([[19, [...before, at(30, body(names[naming]))]]]),
				worktrees: [],
			});
			return status.issues[0]?.branches.find((b) => b.name === branch)?.next;
		};
	}

	const split = matrix(['feat/19-x-1', 'feat/19-x-2'], 'feat/19-x-1');
	it.each([
		['approve', ['join', 'join', 'join', 'revise', 'revise', 'revise']],
		['needs changes', ['revise', 'revise', 'revise', 'join', 'revise', 'revise']],
		['Unfinished:', ['build', 'build', 'build', 'join', 'build', 'build']],
		['re-checked by lead', ['join', 'join', 'join', 'lead-re-check', 'lead-re-check', 'lead-re-check']],
		['reply', ['lead-re-check', 'lead-re-check', 'lead-re-check', 'join', 'lead-re-check', 'lead-re-check']],
	] as const)('on a split issue, a %s comment gives %j', (kind, steps) => {
		const namings: Naming[] = ['branch', 'origin/', 'period', 'other half', 'typo', 'nothing'];
		expect(namings.map((naming) => split(kind, naming))).toEqual(steps);
	});

	const one = matrix(['feat/19-x'], 'feat/19-x');
	it.each([
		['approve', ['join', 'revise', 'join']],
		['needs changes', ['revise', 'revise', 'revise']],
		['Unfinished:', ['build', 'build', 'build']],
		['re-checked by lead', ['join', 'lead-re-check', 'join']],
		['reply', ['lead-re-check', 'lead-re-check', 'lead-re-check']],
	] as const)('on an issue with one branch, a %s comment gives %j', (kind, steps) => {
		const namings: Naming[] = ['branch', 'typo', 'nothing'];
		expect(namings.map((naming) => one(kind, naming))).toEqual(steps);
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
