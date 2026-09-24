# Orchestrating agents

How one coordinating agent runs many implementation and review agents in
parallel against the GitHub issues, and what a session of that looks like.
Written after the session of 2026-09-20 that took twelve `ready-for-agent`
issues to twelve merged pull requests, and extended after the two waves
later that day, the second of which ran on an integration branch.

The coordinator never edits code itself. It triages the issues, dispatches the agents, relays review findings and
decides what goes back to a builder, and it runs the merge queue. Everything
else is delegated.

## Roles

| Role        | How many                            | Lives in                                 | Model and effort            |
| ----------- | ----------------------------------- | ---------------------------------------- | --------------------------- |
| Coordinator | one                                 | the main checkout, on `main`             | the session's own           |
| Builder     | one per issue                       | its own worktree and branch              | Fable, low reasoning effort |
| Reviewer    | one per pull request, sometimes two | its own worktree, detached at the PR tip | Fable, default effort       |

A builder takes one issue, one branch and one pull request from start to
merge, including every revision and rebase. A reviewer does one review pass
and posts it on the pull request. The coordinator reads both and talks to
both, so the builder and the reviewer never talk to each other.

## The flow

1. **Triage first.** Read every open issue and its comments, and leave
   each one `ready-for-agent` with its decisions written down, or
   `ready-for-human` with the one action named, or closed. How to run that
   pass with the maintainer, what a ready issue contains, and how to handle
   issues that hold a list of entries, and blocked ones, is in `triage.md`. The labels are in
   `issue-tracker.md`.

2. **Dispatch one builder per ready issue**, in a single batch, each in an
   isolated worktree. Issues that depend on an unmerged branch wait for the
   second wave and are then stacked on that branch (see below). The prompt
   is self-contained, because the builder starts with no context. It holds:

   - the issue number and the instruction to load the `build` skill;
   - the branch name (`feat/<issue>-<slug>`);
   - the setup a fresh worktree needs before any check runs:
     `mise run site-install-frozen` before the `site-*` tasks and
     `mise run prose-sync` before `mise run prose`. Without the sync
     `prose` stops and names the sync task, so the `ai-tells` errors
     can't appear only in CI (issue #103);
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
     share;
   - when the issue asks for a comment on GitHub, edit only the comment
     whose id the builder's own `gh issue comment` call returned. One
     builder overwrote two siblings' comments by id.

   Tell the builder not to ask questions, to make the call, and to state
   the call in the pull request body.

3. **Spawn a reviewer the moment a pull request opens.** Match the review
   to the change: the `code-review` skill for code, a content and prose
   review against `writing-a-lesson.md` and spec S03 for a lesson, a
   licensing check where a source is cited, a supply-chain check where a
   dependency or pin changes. Name the specific risks to probe, such as an
   exclusion added to a validator, a claim in a lesson that needs a public
   source, or a package name that must not exist on npm. A reviewer of
   lesson content compares the new sentences against the cited sources and
   reports near-verbatim text, since paraphrase is the license condition
   for most of them. Where the change is data with a rule behind it (a
   course plan whose lessons must cover the topics their competencies draw
   on), ask the reviewer for a throwaway script that checks the rule
   mechanically. Reading found the plans convincing, and the script found
   the same defect in four of the six. The reviewer posts
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
   to the coordinator, who merges with `gh pr merge --rebase`. The
   coordinator plays a chime when a pull request is ready for that call,
   which is the maintainer's preference. After every
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
- When the base merges by rebase, its commits get new SHAs. Change the
  stacked pull request's base to `main` (`gh pr edit N --base main`) and have the
  builder rebase; the old base commits drop out as already applied. If
  `git rebase` replays them anyway, reset to `origin/main` and cherry-pick
  the branch's own commits.

Never amend or force-push a commit another branch is stacked on. A builder
asked to add one more change to such a branch appends a commit instead, and
says so.

## Integration branches for content waves

Content or data work in a wave (lesson passes, course plans, spec text)
has a cost per pull request that has little to do with the size of the
change: a review round, a revision, a rebase, two CI runs, a maintainer
approval, and a deploy. Wave 2 of the 2026-09-20 session was six pull
requests for six areas, and the six merges were six deploys of the same
kind of change. For that kind of wave the coordinator collects the approved
branches on one integration branch and opens one pull request for the wave.
Code work that changes shared modules or adds gates gets a separate pull
request, because its review and its CI run are what protect the other
branches.

Builders work as before: one issue, one branch from `origin/main`, pushed
when its local checks pass, and without a pull request. Reviewers check
the branch out in their own worktree and review it as before. The review
goes on the issue as a comment, because the pull request doesn't exist
yet, with the same findings by severity and the same `Verdict:` line, and
the revisions and re-checks follow it there.

The coordinator keeps the integration branch, `wave/<n>-<slug>`, in a
dedicated worktree created from `main`
(`git worktree add ../wave-3 -b wave/3-course-plans origin/main`). When a
branch is approved, it is rebased onto the wave branch rather than merged
into it. The wave history then has no merge commits, and the later rebase
merge into `main` keeps one commit per change:

```sh
git fetch origin
git rebase --onto wave/3-course-plans origin/main origin/feat/31-safety-plan
git branch -f wave/3-course-plans HEAD
git checkout wave/3-course-plans
```

The wave branch now holds the earlier branches and this one, in the order
they were approved. When every approved branch is in, the coordinator runs
`mise run ci` on the wave branch, pushes it, and opens one pull request
against `main`. A branch that joins after that gets its own `mise run ci`
on the wave branch before the next push. The pull request body holds a
table with one row per branch: the issue, the branch, a link to the review
comment, and a link to the re-check comment where there was one. The
review record is then on GitHub next to the pull request that shipped it.
The maintainer approves the wave, and the coordinator merges it with
`gh pr merge --rebase` as usual. The deploy happens once.

The cases that come up:

- **A branch fails review.** It is left out of the wave, and the rest go
  on. Its builder revises on the issue, the reviewer re-checks there, and
  the branch joins the wave if the pull request is still open or waits for
  the next one. Nothing on the wave branch depends on it.
- **A rebase conflict between branches in the wave.** The rebase of the
  second branch stops on the conflict. The coordinator doesn't resolve it.
  It runs `git rebase --abort`, which leaves the wave worktree as it was,
  and tells the builder whose branch came second to redo the `--onto`
  rebase in that worktree, resolve the conflict there, and run the
  `branch -f` and `checkout` lines itself. The first branch is left as it
  was rebased.
- **A follow-up after the branch is on the wave.** A builder that pushes
  one more commit to its own branch, after a review finding on the wave
  pull request, tells the coordinator the SHA. The coordinator
  cherry-picks that commit onto the wave branch. Rebasing the branch onto
  the wave again would replay commits the wave already holds.
- **A change stacked on the wave.** A lesson whose course needs the plan
  entry the wave adds starts from the wave branch and opens a draft pull
  request with `--base wave/<n>-<slug>`. The rules under "Stacked pull
  requests" apply as written, with the wave branch as the base and the
  change to `main` after the wave merges.
- **The port.** The port rule under "What collides" applies. The
  coordinator's `mise run ci` on the wave branch is the one e2e run, so it
  waits until `lsof -i :4400` is empty, and builders run the individual
  tasks their change touches instead of `mise run ci`.

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
  tested modules, the way `check-examples.mjs` and `check-data.mjs` were
  split.
- **Rules that change mid-flight.** When one branch removes bash fixtures,
  a lesson builder that started earlier still adds a `.sh` file. Say the
  future rule in every builder prompt, and check each finished pull request
  against rules merged since it started.
- **Ports.** Anything that serves the site on a fixed port (`site-e2e` on
  4400, `site-screenshot`, a stale `astro dev` daemon) breaks a sibling
  doing the same. Only the builder changing that tooling runs it, after
  `lsof -i :4400` comes back empty, and in integration mode the
  coordinator's wave run is the one e2e run.

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
  Their notifications arrive at the coordinator too, and sometimes only
  there. The reviewer then gets an empty result from the skill. Ignore the
  notifications at the coordinator, act on the reviewer's consolidated
  verdict, and tell every reviewer to fall back on its own probing when the
  skill returns nothing.
- GitHub reports `mergeable: UNKNOWN` for about a minute after every merge.
  Wait and list again. A pull request in `CONFLICTING` state gets no
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

## Session record, 2026-09-20, waves 2 and 3

Wave 2 ran in per-pull-request mode. Twenty-five issues were in scope at
the start of the day, twenty pull requests merged, sixteen issues closed,
about twenty-two review passes, fifteen pull requests sent back or given
items to apply at least once, zero merged with an open blocking finding.
Review caught a tutor exemplar dialogue that leaked a graded checkpoint's
answer, a reset that
resurrected a migrated progress record, a skills-check input rename that
broke self-graded checkpoints, a spec bootstrap contract that WebFetch couldn't
meet, near-verbatim Academy sentences in three lesson pull requests,
four wrong concept tags, a sidebar badge invisible in the light theme, and
a widget whose bars had never rendered on `main`.

Wave 3 was the first run of the integration mode. Nine issues (#30
to #35, then #60, #61 and #19) plus a plan-table request from the maintainer
became eleven branches, and the wave and stacked pull requests that merged
were #108 with the six course plans and the plan table, #109 with two
lesson changes, and #110 with the EU AI Act lesson stacked on the plans. A
write-back pull request, #219, followed with the issue numbers of the 103 lesson
issues the plans opened (deliverable 2 of #30 to #35). About twenty review
passes, nine of the eleven branches sent back or given items to apply
once. Review caught the competency-topic mismatch in four of the six
plans, an exercise that had the learner paste their own confidential
document, a sort item with two defensible answers, and a course-plan table
that scrolled the page sideways on a phone. It also verified a July 2026
amendment to the EU AI Act and every article reference against EUR-Lex
before the maintainer's own check. The wave
pull requests, two of them, replaced what would have been nine pull
requests and nine deploys.

## Session record, 2026-09-21, wave 4

Five Concepts lesson issues (#117, #119, #121, #123, #125) became five
branches and one wave pull request, #222, merged the same evening with the
maintainer's standing approval for a green wave. Three of the lessons had
`after: concepts/prompt-anatomy`, and the build rejects an `assumes` entry
whose lesson page doesn't exist, so those three started from the #119
branch once it was pushed, and #119 appended its review fixes instead of
rewriting. Ten review passes, five branches sent back once, all five
approved on the re-check, zero merged with an open finding. Review caught a
fictional freight company that turned out to be real (used by two lessons),
a fixture that parsed the pitfall's own JSON object as lines, a misreading
of the few-shot paper's example counts, two sort items with two defensible
buckets, a "put the instruction first" rule that contradicts the vendor
docs, and a system prompt too close to an Academy example. Two things the
builder prompt should have said: the sidebar in `astro.config.mjs` is
manual, and `mise run prose-sync` has to run before `mise run prose` or
the builder reports a clean page that isn't. The wave's `mise run ci`
found the semantic conflict the branches couldn't: three e2e specs assumed
Concepts had one live lesson. Every branch added its sidebar line at the
same spot, and the coordinator resolved those add/add conflicts on the wave
branch by keeping every line in course order, since no builder's work was
at stake.

## Session record, 2026-09-21, wave 5

Ten lesson issues, the first unwritten lesson or two of each of the six
courses (#113, #115, #129, #131, #133, #147, #151, #177, #185, #188), became
ten branches and one wave pull request, #229, merged about ninety minutes
after the first builder started. Three earlier-in-course candidates were
skipped because their `assumes` named a planned lesson, which `mise run data`
rejects. Twenty review passes: every first review said needs changes, every
re-check approved, zero merged with an open finding. Review caught an
overstated claim that an abstain instruction changes nothing, a hedge about
temperature 0 attributed to an Academy page that says the opposite, a
done-criterion the lesson's own model answer failed, a page that promised no
pasting and then asked for it, a git worktree presented as isolation for
bypass mode against the vendor docs, a graded prediction whose answer
depended on code the page never showed, and four sort items with two
defensible buckets. Two things for the builder prompt: `mise run prose` and
`mise run spell` read `git ls-files`, so a builder must stage the new page
before trusting either (one branch shipped twelve Vale errors that way), and
two builders adding a bibliography key both reflowed the S02 source table,
so name the key pattern (`Claude docs <slug>`) and say not to add a table
row. The coordinator resolved the add/add conflicts in the word list, the
source table and the bibliography by keeping every line, squashed one branch
whose second commit reverted part of its first, and delegated the e2e fix
for two specs that assumed Concepts had six live lessons.
