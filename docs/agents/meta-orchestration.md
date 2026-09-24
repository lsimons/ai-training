# Meta-orchestration: a dispatcher over many waves

How one long-running session works through every `ready-for-agent` lesson
issue without filling its own context. It adds one layer above
`orchestration.md`. That document describes one wave, from issues to a merged
wave pull request, and nothing in it changes. This one describes the loop
that runs wave after wave.

## Why a second layer

The coordinator of `orchestration.md` spends about 20k tokens of its own
context per issue. The session of 2026-09-20 (waves 2 and 3, about twenty
issues) peaked at 456k tokens and was compacted once. Wave 5 (ten issues)
reached 220k. What fills it is relayed detail. The final reports of builders
and reviewers are 3k to 9k characters each, and the output of `gh pr list`
and CI polling adds to that. The coordinator's own decisions are a few
hundred words per issue.

With 113 issues ready on 2026-09-23, one coordinator context can't hold the
run. So the coordinator role moves down one level, into a disposable *wave
lead* agent that lives for one wave, and the session becomes a *dispatcher*
that only ever holds one short report per wave.

## Roles

| Role       | Agent                              | How many       | Lives in                                | Context per wave               |
| ---------- | ---------------------------------- | -------------- | --------------------------------------- | ------------------------------ |
| Dispatcher | the `/wave` session                | one            | the main checkout, on `main`, in a loop | one report, under 200 words    |
| Wave lead  | `wave-lead`                        | one per wave   | its own context, spawning the others    | the whole wave, then discarded |
| Builder    | `builder`                          | one per issue  | its own worktree and branch             | as in `orchestration.md`       |
| Reviewer   | `lesson-reviewer`, `code-reviewer` | one per branch | its own worktree                        | as in `orchestration.md`       |

The four agents are defined in `.claude/agents/`, all on Opus 5.5: the
lead at `high` effort with a 400-turn limit, the builder and the reviewers
at `medium` with 200 and 80. The dispatcher spawns `wave-lead` by name,
and the lead spawns the others by name, so no prompt sets a model. The
`wave-lead` file holds everything that is the same for every wave, and the
template holds the rest.

Nested spawning works: a `general-purpose` agent can spawn its own agents,
resume them with `SendMessage`, and receive their notifications. Only the
wave lead's final text reaches the dispatcher. (Tested 2026-09-23 with a
lead that ran two sub-agents and a follow-up message: three results, no
duplicate or missing notifications.)

A lead waits by ending its turn. When a subagent ends its turn while its
own children run, nothing reaches its parent. Each child's notification
wakes it, and its parent hears from it only when it stops with no child
left running. (Tested 2026-09-24 with a lead that spawned two children
running `sleep 90` and ended its turn at once: the children woke it about
90 seconds later, and the dispatcher got one notification, the final
report, after both had finished.) So the lead ends its turn while
builders and reviewers run, and waits in the foreground only for a check
it started itself (`mise run ci`, `gh pr checks --watch`,
`gh run watch`), and it never ends its turn while one of those runs.
Sleeping and polling cost the most: waves 9 to 13 spent 61 to 81% of the
leads' wall time in `sleep`, and a sleeping lead started each reviewer 2
to 6 minutes late. Verdicts come back in the reviewer's hand-back, and nobody polls a
pull request for review comments. The Bash guard hook rejects a `sleep`
over 60 seconds and a shell loop that calls `gh`.

The concurrent-agent cap (20 on this platform) is shared by every level, so
the dispatcher runs one wave at a time. With six issues in a wave, the lead
runs six builders plus up to six reviewers, under the cap with room for the
`code-review` skill's own sub-agents.

## Starting the loop

`/wave` (`.claude/skills/wave/SKILL.md`) is the dispatcher. On a fresh
session in this repo it pulls `main`, runs the picker, fills the wave lead
template at `.claude/skills/wave/wave-lead-prompt.md`, spawns the lead,
reads the report, commits the record, and repeats until a stop condition,
with no further instruction from the maintainer. Its arguments:
`/wave [size]`, default 6, then any of `--kind lessons|content` (what the
picker selects, planned lessons by default), `--only N,N,...` (an issue
whitelist for the run, and the picker skips everything else) and
`--no-filing`. The skill loops on its own and waits for each lead in the
foreground. An optional watchdog is the maintainer's choice, and a second
`/wave` on a session with a lead running would spawn a second dispatcher,
so don't run one.

`--no-filing` is the bounded-run mode for an unattended session. In the
default mode every wave files follow-up issues, and some of those are
`ready-for-agent` content issues, so a content run can feed its own queue
and never reach the empty wave that ends the loop. With `--no-filing`
nobody files an issue while the run goes, so the queue only shrinks and
the loop ends. The follow-up rule is otherwise the same in both modes:
each lead writes the issue it would have filed, title, body and labels,
to a follow-ups file on its wave branch, and when the run ends the
dispatcher checks each entry once against `main` and files the ones that
still hold. The overnight run of 2026-09-24 left 24 follow-ups in a record
instead, and 6 of them were obsolete by the evening. Nothing waits in a
record for the maintainer to reconcile.

## The loop

The dispatcher keeps a meta record, named once at the start of the run,
`docs/agents/sessions/<start-date>-meta.md`, with the run's remaining
whitelist, the parked issues and one report per wave, so the history is a
file and never the dispatcher's context. One tick:

1. **Pull.** `git pull --rebase` on `main`. The dispatcher commits its
   record after every wave, so the tree is clean here.
2. **Wave number.** One more than the highest `wave-<n>` in
   `docs/agents/sessions/`, or 6 when there is none. `orchestration.md`
   keeps the records of waves 1 to 5 inline.
3. **Resume check.** An `origin/wave/<n>-*` branch with the computed
   number is a wave whose lead never finished, and so is an `In flight`
   line in the meta record with no report after it. The dispatcher then
   spawns a lead for that wave number and branch with the resuming line
   filled in, and the lead follows "Resuming a half-done wave" in the
   template: run `mise run wave-status`, which reads each issue's last
   review verdict from the trusted accounts only, reuse the worktrees
   that exist, spawn only what is missing, and never redo a branch with
   an approve verdict. Only the issues on the `In flight` line
   count for `origin/feat/<issue>-*` branches, so a stale branch from an
   earlier run starts nothing. The wave branch is `wave/<n>-<kind>`,
   without a date, so a next-day resume finds it.
4. **Pick.** Run `mise run next-wave -- --size 6`, with `--kind` and the
   remaining whitelist as `--only`. For a lessons wave it lists the planned
   lessons whose issue is `ready-for-agent` and unassigned, and drops the
   ones that assume an objective no live lesson on `main` serves. A plan
   file's `assumes` entries name only the objective, the builder adds the
   `lesson` and `section` that teach it when the page goes live, and the
   build (`mise run site-build`, through `MarkdownContent.astro`) rejects a
   page that names a lesson without a page, so such a lesson can't be
   merged in this wave. Within an area it orders the rest with no planned
   `after` first, then earliest-in-course, takes them round-robin across
   the areas, and prints the wave as a table plus `--json` for the prompt.
   With `--unblockers-first`, each candidate is scored by how many blocked
   lessons it serves a missing objective for, the score sorts before the
   course position and after the planned `after` rule, and the table gains
   an `Unblocks` column with that count.
   It also lists what it blocked and skipped and why, which candidates wait
   for a later wave, and, under `--only`, every listed number it didn't
   pick with the reason, so nothing drops silently. A content wave
   (`--kind content`) is the ready, unassigned `content` issues that no plan
   file claims, by ascending number, with no dependency logic. An issue
   that has the `code` label too is marked so the lead adds a code review,
   and a nits issue is left out because it arrives as the nits row. The
   picker reads the tree of the checkout it runs in, which is why the
   pull comes first. The dispatcher then decides on the nits row: the one open
   issue titled `Cosmetic nits`, as one row for one nits builder in one
   worktree and branch, reviewed with a diff read plus the fast checks and
   no content review. It joins only when the issue has 10 or more nit
   lines or the table is otherwise empty. A wave that is only the nits
   row proceeds. An empty table ends
   the loop.
5. **Mark the wave in flight and spawn the wave lead.** The dispatcher
   writes `In flight: wave <n>, branch <b>, issues #a #b ...` to the meta
   record, commits and pushes it, then spawns the lead with the filled
   template, waits for the lead's notification and does nothing else.
6. **Read the report and commit the record.** Replace the `In flight` line
   with the report, copy its `Add to collision notes` and
   `Remove from collision notes` lines to the record's
   `Pending collision notes` section, and under `--only` remove the merged and the left-out issues
   from the remaining whitelist, parking the left-out ones so the run
   never picks them again. Run `mise run spell` and `mise run prose` on
   the two files, commit them on `main` as
   `docs(agents): meta record wave <n>`, `git pull --rebase` right before
   the push because the lead merged into `origin/main` in the meantime,
   and push. Nothing of the dispatcher's stays uncommitted between ticks,
   and the wave lead never edits either file. Then, on `merged`, play the chime
   and go to step 1. On `open`, the lead has hit the standing-approval
   exception (below). Report it to the maintainer and stop. On `failed`,
   report to the maintainer and stop. The next `/wave` finds the wave in
   step 3 and resumes it.
7. **File the follow-ups.** Every item on the report's maintainer line,
   every nit the lead left open on a merged branch, and every improvement
   deferred during the session becomes a GitHub issue before the next wave
   starts, filed and triaged as `triage.md` describes and linked from the
   session record. The wave lead files the ones it has the context for and
   lists their numbers on the report's `Filed` line. The dispatcher files
   the rest. There is one open nits issue at a time, titled
   `Cosmetic nits`: a lead appends a line per open nit to its body and
   creates it only when none is open. The nits row joins a wave only when
   that issue has 10 or more lines or the picker's table is otherwise
   empty, so the nits no longer chain from wave to wave (#256 to #315 were
   eight such issues). With `--no-filing` the lead writes its follow-ups
   file instead, and the dispatcher files it when the run ends.

The dispatcher edits no code and runs no check of the site. The loop ends
on an empty wave, an exhausted whitelist, an `open` or `failed` report, or
the maintainer saying stop, and the dispatcher reports which.

## Standing approval

The maintainer gives standing approval, up front, for a green wave pull
request: `mise run ci` green on the wave branch, GitHub CI green, every
branch in it approved on its re-check, and no open finding. The wave lead
merges such a pull request itself with `gh pr merge --rebase`, without a
round trip. A wave that doesn't meet every condition stays open, and the
lead returns `open` with the reason. A review finding that needs the
maintainer's decision (strike a spec feature, choose between two designs)
always goes to them instead of being merged, and so does any change to a
spec, a gate, or shared tooling that a lesson branch drags along.

## The wave lead prompt

The lead starts with no context but its agent file,
`.claude/agents/wave-lead.md`, which holds the brief, the roles it spawns
by name, integration, the standing approval, the waiting rule, the
two-round revision limit and the resume steps. Its prompt is the template
at `.claude/skills/wave/wave-lead-prompt.md`, which `/wave` fills with the
wave number, the branch, the date, the picker's table, the filing
paragraph and the fresh-or-resuming line. Between them they hold
everything below.

- The wave as `next-wave` printed it: issue numbers, lesson ids, course
  positions, and for each lesson the `after` entries that are still
  planned. A planned `after` is ordering advice for the lead (spec S11:
  `after` is only read while a lesson is coming, and neither the data check
  nor the build needs its target live). It never requires stacking one
  branch on another. The picker blocks the `assumes` dependencies that
  would.

- The instruction to follow `docs/agents/orchestration.md` end to end, in
  integration mode: one builder per issue, one reviewer per pushed branch,
  the review on the issue, the revision loop until `Verdict: approve`, the
  wave branch `wave/<n>-<slug>`, one pull request with the review table,
  `mise run ci` on the wave branch. The builder prompt items in that
  document, and everything its session records say the prompt should have
  said, are the builder brief.

- The standing approval as written above, and the merge command.

- The builder, lead and reviewer rules, and two collision lists, one for
  lessons and one for code. The lead passes each builder the builder
  rules and the list that matches its issue. The template is the
  canonical copy, and this document keeps none. Durable rules live in
  `writing-a-lesson.md` ("Rules that bite") and `testing.md` ("Rules from
  review") instead. Each list holds at most 15 bullets. A wave report
  proposes changes on its `Add to collision notes` and
  `Remove from collision notes` lines, the dispatcher keeps them under
  `Pending collision notes` in the meta record, and they reach the
  template only after the maintainer has read them. At the cap a new note
  replaces an old one or becomes a check.

- The nits row rule and the "Resuming a half-done wave" section, so a lead
  that starts after a failed one knows what to reuse and what to spawn.

- The filing paragraph: file per `triage.md` and append open nits to the
  one `Cosmetic nits` issue, or, under `--no-filing`, write the follow-ups
  file for the dispatcher to file when the run ends.

- What the lead writes and returns. It writes the session record to
  `docs/agents/sessions/<date>-wave-<n>.md` on the wave branch, in the form
  of the "Session record" sections of `orchestration.md`: counts, what
  review caught, what the builder prompt should have said. It returns a
  report of at most 200 words in exactly this form:

  ```text
  WAVE <n> <merged|open|failed>
  PR: #<number>
  Merged issues: #a #b ...
  Left out: #c (<reason>) ...
  For the maintainer: <decisions needed, or none>
  Filed: #<issue> <title> ... (or none)
  Follow-ups: <none, or the follow-ups file under --no-filing>
  Add to collision notes: <lessons|code: one line each, or none>
  Remove from collision notes: <lessons|code: the bullet's first words and why, one line each, or none>
  ```

  The 200 words exclude the `Follow-ups` lines.

- The rule not to ask questions. The lead makes the call, states it in the
  pull request body, and puts the decision in the report's maintainer line.

## What stays by hand

`next-wave` picks lesson issues from their plan files, and content issues
by label. Code and tooling issues (`code` label alone) still go through
`orchestration.md` directly, one pull request each, since their review and
their CI run are what protect the lesson branches. Run those between waves,
or as the first wave of the day with `main` frozen, as the "What collides"
section says.
