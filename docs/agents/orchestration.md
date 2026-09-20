# Orchestrating agents

How one coordinating agent runs many implementation and review agents in
parallel against the GitHub issues, and what a session of that looks like.
Written after the session of 2026-09-20 that took twelve `ready-for-agent`
issues to twelve merged pull requests.

The coordinator never edits code itself. It triages, dispatches, relays
review findings, decides what goes back to a builder, manages the merge
queue, and writes the summary. Everything else is delegated.

## Roles

| Role        | How many                           | Lives in                                 | Model and effort            |
| ----------- | ---------------------------------- | ---------------------------------------- | --------------------------- |
| Coordinator | one                                | the main checkout, on `main`             | the session's own           |
| Builder     | one per issue                      | its own worktree and branch              | Fable, low reasoning effort |
| Reviewer    | one per pull request, sometimes two | its own worktree, detached at the PR tip | Fable, default effort       |

A builder owns one issue, one branch and one pull request from start to
merge, including every revision and rebase. A reviewer owns one review pass
and posts it on the pull request. The coordinator reads both and talks to
both, so the builder and the reviewer never talk to each other.

## The flow

1. **Triage first.** Read every open issue and its comments. Label an issue
   `ready-for-agent` only when the body holds every decision the work
   needs, with a suggested default for each. Label it `ready-for-human`
   when the actual work is a decision. Leave it `needs-triage` with a
   comment naming the blocker when it depends on another issue, and flip
   the label the day the blocker merges. The triage flow and labels are in
   `issue-tracker.md`.

2. **Dispatch one builder per ready issue**, in a single batch, each in an
   isolated worktree. Issues that depend on an unmerged branch wait for the
   second wave and are then stacked on that branch (see below). The prompt
   is self-contained, because the builder starts with no context. It holds:

   - the issue number and the instruction to load the `build` skill;
   - the branch name (`feat/<issue>-<slug>`);
   - the definition of done: `mise run ci` green locally, pushed, a pull
     request against `main` whose body says `Closes #N`, GitHub CI green,
     not merged;
   - the attribution lines every commit and pull request body ends with;
   - the rule to rebase on `origin/main` before the final push and never
     resolve a conflict by discarding another agent's work;
   - what the other builders are doing that could collide, so the builder
     writes for the future state (for example, write fixtures in Python
     because another builder is removing bash support);
   - what not to run: `site-dev` and anything on a fixed port that siblings
     share.

   Tell the builder not to ask questions, to make the call, and to state
   the call in the pull request body.

3. **Spawn a reviewer the moment a pull request opens.** Match the review
   to the change: the `code-review` skill for code, a content and prose
   review against `writing-a-lesson.md` and spec S03 for a lesson, a
   licensing check where a source is cited, a supply-chain check where a
   dependency or pin changes. Name the specific risks to probe, such as an
   exclusion added to a validator, a claim in a lesson that needs a public
   source, or a package name that must not exist on npm. The reviewer posts
   the review on the pull request with `gh pr review --comment` (GitHub
   refuses `--request-changes` on a pull request the same account opened),
   findings ordered by severity, each with `file:line` and a concrete
   failure scenario, and a final `Verdict: approve / needs changes` line.
   It returns the same report to the coordinator.

4. **Decide what goes back.** The coordinator reads the verdict and sends
   the builder one message: which findings are required, which are
   suggested rewrites to apply unless they read worse, which to skip, and
   the expected shape (one commit, reply on the pull request, CI green, do
   not merge). Cheap findings go back even on an approve, since a follow-up
   commit costs less than a follow-up issue. A finding that needs the
   maintainer's decision (strike a spec feature, choose between two
   designs) is reported to the maintainer instead.

5. **Merge queue.** The maintainer approves each pull request in a message
   to the coordinator, who merges with `gh pr merge --rebase`. After every
   merge, wait a minute and list the open pull requests with their
   `mergeable` state. Anything `CONFLICTING` goes back to its builder with
   the likely conflict files named. When a big change is in the queue (new
   quality gates, a refactor everyone touches), merge it first and freeze
   `main` until it lands, then let the rest rebase once onto the result.

6. **Finish.** Update the front page status, flip the issues that were
   blocked on now-merged work, and remove the agent worktrees, leaving the
   branches in place. Report what merged, what review caught, and what is
   left.

## Stacked pull requests

A builder whose issue depends on an unmerged branch starts from that branch
(`git checkout -b feat/N-slug origin/feat/M-slug`) and opens its pull
request with `--base feat/M-slug`. Two consequences:

- The CI workflow runs on `pull_request` against `main` only, so a stacked
  pull request gets no automatic run. The builder triggers
  `gh workflow run ci.yml --ref <branch>` and watches that.
- When the base merges by rebase, its commits get new SHAs. Retarget the
  stacked pull request to `main` (`gh pr edit N --base main`) and have the
  builder rebase; the old base commits drop out as already applied. If
  `git rebase` replays them anyway, reset to `origin/main` and cherry-pick
  the branch's own commits.

Never amend or force-push a commit another branch is stacked on. A builder
asked to add one more change to such a branch appends a commit instead, and
says so.

## What collides, and how to avoid it

- **Shared config files.** `.mise.toml`, `.github/workflows/ci.yml` and
  `AGENTS.md` are touched by every tooling change. Two tooling issues in
  one wave means one of them rebases through conflicts. Keep the `ci` task
  list and the workflow steps in the same order in both files when
  resolving.
- **Semantic conflicts.** A new build check on one branch fails on content
  another branch adds, with no git conflict at all. The course plan check
  had to learn about three lessons that merged while it was in review.
  When a check-adding pull request is in the queue, tell its builder what
  landed on `main` since it branched.
- **New gates on old code.** A pull request that adds lint, coverage or
  e2e gates forces every later pull request to bring its code under them.
  Tell those builders exactly what the gates are and where the docs are
  (`testing.md`), and expect them to split logic out of scripts into
  tested modules, the way `check-examples.mjs` and `check-courses.mjs` were
  split.
- **Rules that change mid-flight.** When one branch removes bash fixtures,
  a lesson builder that started earlier still adds a `.sh` file. Say the
  future rule in every builder prompt, and check each finished pull request
  against rules merged since it started.
- **Ports.** Anything that serves the site on a fixed port (`site-e2e`,
  `site-screenshot`, a stale `astro dev` daemon) breaks a sibling doing the
  same. Only the builder changing that tooling runs it, on a spare port.

## Working with the platform

- Concurrent agents are capped (20 in this session). A spawn that hits the
  cap fails with a clear message; retry when a builder or reviewer
  finishes. Finished agents do not free a slot until their turn ends.
- A message to a finished agent resumes it with its context intact, which
  is how a builder gets its revision and rebase instructions. An agent that
  has worked for a very long time carries a huge context; for a follow-up
  on such a branch, spawn a fresh agent in a new worktree checked out on
  the branch, with the pull request and review as its whole brief.
- The `code-review` skill spawns its own sub-agents (angles and verifiers).
  Their notifications arrive at the coordinator too. Ignore them and act on
  the reviewer's consolidated verdict.
- GitHub reports `mergeable: UNKNOWN` for a minute after `main` moves. Wait
  and list again. A pull request in `CONFLICTING` state gets no
  `pull_request` CI run at all, so a builder that pushes into a conflict
  sees no run and should rebase rather than wait.
- Rebase merges keep every commit. An intermediate commit that would fail a
  gate added later (a `.sh` fixture that a later commit removes) is fine as
  long as the tip is green.

## What a builder prompt says about history

Builders may `git push --force-with-lease` their own branch after a rebase,
because nothing is stacked on it and the coordinator asked. They never
force-push a branch another pull request is based on, never delete a branch,
and never merge. Merging is the maintainer's call, relayed by the
coordinator.

## Session record, 2026-09-20

Twelve issues, twelve pull requests, thirteen merges including the front
page update, eleven reviews, six pull requests sent back for a revision,
zero merged with an open blocking finding. Review caught two real npm
package names presented as invented, a false claim about the MCP
specification, a misattributed framework, an unverified interpreter
download in place of a lockfile pin, a validator exclusion that hid typo
links, and a crash in the e2e static server. Each of those would have
shipped without the review pass.
