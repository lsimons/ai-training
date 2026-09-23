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

| Role       | How many       | Lives in                                | Context per wave               |
| ---------- | -------------- | --------------------------------------- | ------------------------------ |
| Dispatcher | one            | the main checkout, on `main`, in a loop | one report, under 200 words    |
| Wave lead  | one per wave   | its own context, spawning the others    | the whole wave, then discarded |
| Builder    | one per issue  | its own worktree and branch             | as in `orchestration.md`       |
| Reviewer   | one per branch | its own worktree                        | as in `orchestration.md`       |

Nested spawning works: a `general-purpose` agent can spawn its own agents,
resume them with `SendMessage`, and receive their notifications. Only the
wave lead's final text reaches the dispatcher. (Tested 2026-09-23 with a
lead that ran two sub-agents and a follow-up message: three results, no
duplicate or missing notifications.)

The concurrent-agent cap (20 on this platform) is shared by every level, so
the dispatcher runs one wave at a time. With six issues in a wave, the lead
runs six builders plus up to six reviewers, under the cap with room for the
`code-review` skill's own sub-agents.

## Starting the loop

`/wave` (`.claude/skills/wave/SKILL.md`) is the dispatcher. On a fresh
session in this repo it pulls `main`, runs the picker, fills the wave lead
template at `.claude/skills/wave/wave-lead-prompt.md`, spawns the lead, and
loops on the report, with no further instruction from the maintainer. Its
arguments: `/wave [size]`, default 6, then any of `--kind lessons|content`
(what the picker selects, planned lessons by default), `--only N,N,...` (an
issue whitelist, and the picker skips everything else) and `--no-filing`.
The skill runs one tick and waits for the lead in the foreground, so a
maintainer who wants self-pacing types `/loop /wave 6`.

`--no-filing` is the bounded-run mode for an unattended session. In the
default mode every wave files follow-up issues, and some of those are
`ready-for-agent` content issues, so a content run can feed its own queue
and never reach the empty wave that ends the loop. With `--no-filing` the
lead files nothing and lists every nit and follow-up under a `Follow-ups:`
line in its report and in the session record. The queue only shrinks, the
loop ends, and the maintainer files the follow-ups from the record the next
day. The `AGENTS.md` rule that work never waits in a session record has
this one exception, and the record names the run as unattended so the
follow-ups are found.

## The loop

The dispatcher runs as a self-paced `/loop`. One tick:

1. **Pick the wave.** Run `mise run next-wave -- --size 6`, with `--kind`
   and `--only` as given. For a lessons wave it lists the
   planned lessons whose issue is `ready-for-agent` and unassigned, and
   drops the ones that assume an objective no live lesson on `main` serves.
   A plan file's `assumes` entries name only the objective, the builder
   adds the `lesson` and `section` that teach it when the page goes live,
   and the build (`mise run site-build`, through `MarkdownContent.astro`)
   rejects a page that names a lesson without a page, so such a lesson
   can't be merged in this wave. Within an area it orders the rest with no
   planned `after` first, then earliest-in-course, takes them round-robin
   across the areas, and prints the wave as a table plus `--json` for the
   prompt. It also lists what it blocked and skipped and why, and which
   candidates wait for a later wave, so nothing drops silently. A content
   wave (`--kind content`) is the ready, unassigned `content` issues that no
   plan file claims, by ascending number, with no dependency logic, and an
   issue that has the `code` label too is marked so the lead adds a code
   review.
   The picker reads the tree of the checkout it runs in, so pull `main`
   first. The dispatcher then adds the nits row (below) when there is one.
2. **Spawn the wave lead** with the prompt below. The dispatcher then
   waits for the lead's notification. Schedule a long fallback wake-up (30
   minutes) in case it never arrives.
3. **Read the report.** On `merged`, play the chime and go to step 1. On
   `open`, the lead has hit the standing-approval exception (below). Report
   it to the maintainer and stop the loop. On `failed`, report to the
   maintainer and stop. A failed wave whose builders pushed branches is
   resumed rather than restarted: the next `/wave` keeps the wave number
   and spawns a fresh lead with the resuming line, and the lead follows
   "Resuming a half-done wave" in the template. It fetches, reads each
   issue's last review verdict, reuses the worktrees that exist, spawns
   only what is missing, and never redoes a branch with an approve
   verdict.
4. **File the follow-ups.** Every item on the report's maintainer line,
   every nit the lead left open on a merged branch, and every improvement
   deferred during the session becomes a GitHub issue before the next wave
   starts, filed and triaged as `triage.md` describes and linked from the
   session record. The wave lead files the ones it has the context for and
   lists their numbers on the report's `Filed` line. The dispatcher files
   the rest. Nits are batched: the lead files one nits issue per wave
   (`Cosmetic nits left open on wave <n> branches`, one line per nit) and
   never one per lesson. The dispatcher puts every open nits issue into the
   next wave as one extra row, the nits row, which one nits builder takes
   in one worktree and branch, reviewed with a diff read plus the fast
   checks and no content review. With `--no-filing` the lead files nothing
   and the report's `Follow-ups:` lines hold the list instead.
5. **Keep the record.** Append the report to the session record file for
   the day, `docs/agents/sessions/<date>-meta.md`, so the history is a file
   and never the dispatcher's context, and apply the report's
   `Add to collision notes` lines to the template. Both stay uncommitted in
   the main checkout while the loop runs and go to `main` in one
   `docs(agents): meta record <date>` commit at the end of the run. The
   wave lead never edits either file. `orchestration.md` keeps the records
   of waves 1 to 5 inline, and `docs/agents/sessions/` holds the rest.

The dispatcher edits no code and runs no check of its own. When the picker
returns an empty wave, or only blocked lessons, the loop ends and the
dispatcher reports which lessons were blocked and by what.

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

The lead starts with no context. Its prompt is the template at
`.claude/skills/wave/wave-lead-prompt.md`, which `/wave` fills with the
wave number, the branch, the date, the picker's table and the filing
paragraph. The template holds everything below.

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

- The collision notes, which every builder prompt repeats. The template's
  "Collision notes" section is the canonical list, and the dispatcher adds
  to it from each wave's `Add to collision notes` line. This document keeps
  no copy.

- The nits row rule and the "Resuming a half-done wave" section, so a lead
  that starts after a failed one knows what to reuse and what to spawn.

- The filing paragraph: file per `triage.md` with one nits issue per wave,
  or, under `--no-filing`, file nothing and list the follow-ups.

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
  Follow-ups: <none, or one line per nit or follow-up under --no-filing>
  Add to collision notes: <one line each, or none>
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
