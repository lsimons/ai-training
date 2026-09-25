/**
 * The state of a wave for a resuming lead (`mise run wave-status`, #351):
 * per issue, its pushed `feat/<issue>-*` branches, and per branch the last
 * review verdict that applies to it and the next step (#417), plus the wave
 * branch and the local worktrees. Pure functions over what
 * scripts/wave-status.mjs fetches, so tests/scripts/wave-status.test.ts can
 * feed them planted comments.
 *
 * Only comments by an account in TRUSTED_VERDICT_AUTHORS count as a verdict.
 * Anyone can comment on a public issue, and a lead never redoes a branch
 * with an approve verdict, so a `Verdict: approve` from another account
 * must not end a review. Every agent here posts with the maintainer's token.
 *
 * A comment with a `Branch: <name>` line applies to that branch only, so the
 * two halves of a split issue (`feat/<issue>-<slug>-1` and `-2`) each get
 * their own verdict. A comment without one applies to every branch of the
 * issue.
 *
 * A builder that stops at its turn limit posts a comment whose first line is
 * `Unfinished: <branch>`, then the list of what is left (#418). The branch is
 * `build` again, with that list as the brief, until a later trusted comment
 * finishes it: a verdict that applies to the branch, or a builder reply that
 * names the branch on a `Branch:` line.
 */

/** The accounts whose `Verdict:` comments a lead acts on. */
export const TRUSTED_VERDICT_AUTHORS = Object.freeze(['lsimons', 'lsimons-bot']);

/** A `Verdict:` line anywhere in a comment, as the reviewers end their reviews. */
const VERDICT_LINE = /^\s*\**Verdict:?\**:?\s*\**\s*(approve|needs changes)\b/im;

/** A `Branch:` line, as the reviewers write it next to their `Verdict:` line. */
const BRANCH_LINE = /^\s*\**Branch:?\**:?\s*\**\s*`?([^\s`*]+)`?/im;

/** The first line of a builder's hand-back at its turn limit. */
const UNFINISHED_LINE = /^\s*\**Unfinished:?\**:?\s*\**\s*`?([^\s`*]+)`?/i;

/** The attribution lines at the end of every agent comment. */
const ATTRIBUTION_LINE = /^\s*(Co-Authored-By|Assisted-by):/i;

/**
 * @typedef {{ author: string, body: string, createdAt: string, url: string }} IssueComment
 * @typedef {{ verdict: 'approve' | 'needs changes', author: string, createdAt: string, url: string,
 *   commentsAfter: number }} Verdict
 * @typedef {{ author: string, createdAt: string, url: string, left: string }} Unfinished
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
 * The branch a comment names on a `Branch:` line, or null when it names none.
 * @param {string} body
 */
export function branchOf(body) {
	return BRANCH_LINE.exec(body)?.[1] ?? null;
}

/**
 * The branch an `Unfinished: <branch>` first line names, or null when the
 * comment doesn't start with one.
 * @param {string} body
 */
export function unfinishedBranchOf(body) {
	const first = body.split('\n', 1)[0] ?? '';
	return UNFINISHED_LINE.exec(first)?.[1] ?? null;
}

/**
 * Whether a comment applies to a branch: it names that branch on its
 * `Unfinished:` or `Branch:` line, or names none.
 * @param {string} body
 * @param {string} branch
 */
export function appliesTo(body, branch) {
	const named = unfinishedBranchOf(body) ?? branchOf(body);
	return named === null || named === branch;
}

/**
 * What is left, from an `Unfinished:` comment: the lines after the first,
 * without the attribution lines.
 * @param {string} body
 */
function leftOf(body) {
	return body
		.split('\n')
		.slice(1)
		.filter((line) => !ATTRIBUTION_LINE.test(line))
		.join('\n')
		.trim();
}

/**
 * The last trusted `Unfinished:` comment for a branch, or null when there is
 * none or a later trusted comment finished the branch: a verdict that applies
 * to it, or a reply that names it on a `Branch:` line. A reply that names no
 * branch leaves it unfinished, so a stray note can't send a half-built branch
 * to review.
 * @param {IssueComment[]} comments
 * @param {string} branch
 * @param {readonly string[]} [trusted]
 * @returns {Unfinished | null}
 */
export function openUnfinished(comments, branch, trusted = TRUSTED_VERDICT_AUTHORS) {
	/** @type {Unfinished | null} */
	let open = null;
	for (const c of trustedInOrder(comments, trusted)) {
		const unfinished = unfinishedBranchOf(c.body);
		if (unfinished !== null) {
			if (unfinished === branch) open = { author: c.author, createdAt: c.createdAt, url: c.url, left: leftOf(c.body) };
		} else if (verdictOf(c.body) ? appliesTo(c.body, branch) : branchOf(c.body) === branch) {
			open = null;
		}
	}
	return open;
}

/**
 * The comments from trusted accounts, oldest first. Comments from other
 * accounts are dropped entirely.
 * @param {IssueComment[]} comments
 * @param {readonly string[]} trusted
 */
function trustedInOrder(comments, trusted) {
	return comments.filter((c) => trusted.includes(c.author)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * The last trusted verdict that applies to a branch, with the number of
 * trusted comments after it that apply to the branch too (a builder's reply
 * to a `needs changes`), or null.
 * @param {IssueComment[]} comments
 * @param {string} branch
 * @param {readonly string[]} [trusted]
 * @returns {Verdict | null}
 */
export function lastTrustedVerdict(comments, branch, trusted = TRUSTED_VERDICT_AUTHORS) {
	const own = trustedInOrder(comments, trusted).filter((c) => appliesTo(c.body, branch));
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
 * What a resuming lead does with a pushed branch, in the words of
 * "Resuming a half-done wave" in .claude/agents/wave-lead.md: build the rest,
 * join as it is, revise, re-check or review. An issue without a pushed
 * branch is `build` too.
 * @param {Verdict | null} verdict the last verdict that applies to the branch
 * @param {Unfinished | null} [unfinished] the branch's open `Unfinished:` comment
 */
export function nextStep(verdict, unfinished = null) {
	if (unfinished) return 'build';
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
			const comments = commentsByIssue.get(issue) ?? [];
			const branches = featBranches(heads, issue).map((name) => {
				const verdict = lastTrustedVerdict(comments, name);
				const unfinished = openUnfinished(comments, name);
				return { name, verdict, unfinished, next: nextStep(verdict, unfinished) };
			});
			return { issue, next: branches.length === 0 ? 'build' : 'per-branch', branches };
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
