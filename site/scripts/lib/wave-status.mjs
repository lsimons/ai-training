/**
 * The state of a wave for a resuming lead (`mise run wave-status`, #351):
 * per issue, its pushed `feat/<issue>-*` branches and the last review verdict,
 * plus the wave branch and the local worktrees. Pure functions over what
 * scripts/wave-status.mjs fetches, so tests/scripts/wave-status.test.ts can
 * feed them planted comments.
 *
 * Only comments by an account in TRUSTED_VERDICT_AUTHORS count as a verdict.
 * Anyone can comment on a public issue, and a lead never redoes a branch
 * with an approve verdict, so a `Verdict: approve` from another account
 * must not end a review. Every agent here posts with the maintainer's token.
 */

/** The accounts whose `Verdict:` comments a lead acts on. */
export const TRUSTED_VERDICT_AUTHORS = Object.freeze(['lsimons', 'lsimons-bot']);

/** A `Verdict:` line anywhere in a comment, as the reviewers end their reviews. */
const VERDICT_LINE = /^\s*\**Verdict:?\**:?\s*\**\s*(approve|needs changes)\b/im;

/**
 * @typedef {{ author: string, body: string, createdAt: string, url: string }} IssueComment
 * @typedef {{ verdict: 'approve' | 'needs changes', author: string, createdAt: string, url: string,
 *   commentsAfter: number }} Verdict
 * @typedef {{ path: string, branch: string | null, head: string | null }} Worktree
 */

/**
 * The verdict a comment states, or null when it states none.
 * @param {string} body
 * @returns {'approve' | 'needs changes' | null}
 */
export function verdictOf(body) {
	const match = VERDICT_LINE.exec(body);
	if (!match?.[1]) return null;
	return match[1].toLowerCase() === 'approve' ? 'approve' : 'needs changes';
}

/**
 * The last verdict from a trusted account, with the number of trusted
 * comments after it (a builder's reply to a `needs changes`), or null.
 * Comments from other accounts are ignored entirely.
 * @param {IssueComment[]} comments
 * @param {readonly string[]} [trusted]
 * @returns {Verdict | null}
 */
export function lastTrustedVerdict(comments, trusted = TRUSTED_VERDICT_AUTHORS) {
	const own = comments.filter((c) => trusted.includes(c.author)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	for (let i = own.length - 1; i >= 0; i--) {
		const c = /** @type {IssueComment} */ (own[i]);
		const verdict = verdictOf(c.body);
		if (verdict) {
			return { verdict, author: c.author, createdAt: c.createdAt, url: c.url, commentsAfter: own.length - 1 - i };
		}
	}
	return null;
}

/**
 * The `feat/<issue>-*` branch names in a list of remote heads.
 * @param {string[]} heads branch names without `refs/heads/`
 * @param {number} issue
 */
export function featBranches(heads, issue) {
	return heads.filter((h) => h.startsWith(`feat/${issue}-`)).sort();
}

/**
 * Branch names from `git ls-remote --heads` output.
 * @param {string} output
 */
export function parseLsRemote(output) {
	return output
		.split('\n')
		.map((line) => line.split('\t')[1] ?? '')
		.filter((ref) => ref.startsWith('refs/heads/'))
		.map((ref) => ref.slice('refs/heads/'.length));
}

/**
 * Worktrees from `git worktree list --porcelain` output.
 * @param {string} output
 * @returns {Worktree[]}
 */
export function parseWorktrees(output) {
	/** @type {Worktree[]} */
	const trees = [];
	for (const block of output.split('\n\n')) {
		const lines = block.split('\n').filter(Boolean);
		const path = lines.find((l) => l.startsWith('worktree '))?.slice('worktree '.length);
		if (!path) continue;
		const head = lines.find((l) => l.startsWith('HEAD '))?.slice('HEAD '.length) ?? null;
		const ref = lines.find((l) => l.startsWith('branch '))?.slice('branch '.length) ?? null;
		trees.push({ path, head, branch: ref?.replace(/^refs\/heads\//, '') ?? null });
	}
	return trees;
}

/**
 * What a resuming lead does with a branch, in the words of the template's
 * "Resuming a half-done wave": join as it is, revise, review, or build.
 * @param {string[]} branches
 * @param {Verdict | null} verdict
 */
export function nextStep(branches, verdict) {
	if (branches.length === 0) return 'build';
	if (!verdict) return 'review';
	if (verdict.verdict === 'approve') return 'join';
	return verdict.commentsAfter > 0 ? 're-check' : 'revise';
}

/**
 * The report `mise run wave-status` prints as JSON.
 * @param {{ waveBranch: string, issues: number[], heads: string[],
 *   commentsByIssue: Map<number, IssueComment[]>, worktrees: Worktree[] }} input
 */
export function waveStatus({ waveBranch, issues, heads, commentsByIssue, worktrees }) {
	return {
		trustedVerdictAuthors: [...TRUSTED_VERDICT_AUTHORS],
		waveBranch: { name: waveBranch, pushed: heads.includes(waveBranch) },
		issues: issues.map((issue) => {
			const branches = featBranches(heads, issue);
			const verdict = lastTrustedVerdict(commentsByIssue.get(issue) ?? []);
			return { issue, branches, verdict, next: nextStep(branches, verdict) };
		}),
		worktrees,
	};
}

/**
 * `<wave-branch> <issue> <issue> ...` from the command line, or an error message.
 * @param {string[]} argv
 * @returns {{ waveBranch: string, issues: number[] } | { error: string }}
 */
export function parseArgs(argv) {
	const [waveBranch, ...rest] = argv;
	if (!waveBranch?.startsWith('wave/')) {
		return { error: 'wave-status: the first argument is the wave branch, wave/<name>' };
	}
	if (rest.length === 0) return { error: 'wave-status: name the issues of the wave after the branch' };
	const issues = rest.map((r) => r.replace(/^#/, ''));
	const bad = issues.find((r) => !/^[1-9][0-9]*$/.test(r));
	if (bad !== undefined) return { error: `wave-status: ${JSON.stringify(bad)} is not an issue number` };
	return { waveBranch, issues: issues.map(Number) };
}
