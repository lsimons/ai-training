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

## The loop

The dispatcher runs as a self-paced `/loop`. One tick:

1. **Pick the wave.** Run `mise run next-wave -- --size 6`. It lists the
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
   candidates wait for a later wave, so nothing drops silently. It reads
   the tree of the checkout it runs in, so pull `main` first.
2. **Spawn the wave lead** with the prompt below. The dispatcher then
   waits for the lead's notification. Schedule a long fallback wake-up (30
   minutes) in case it never arrives.
3. **Read the report.** On `merged`, play the chime and go to step 1. On
   `open`, the lead has hit the standing-approval exception (below). Report
   it to the maintainer and stop the loop. On `failed`, read the session
   record the lead wrote, decide whether the failure is the wave's or the
   loop's, and either spawn a new lead for the same wave or stop.
4. **Keep the record.** Append the report to the session record file for
   the day, `docs/agents/sessions/<date>-meta.md`, so the history is a file
   and never the dispatcher's context. The `docs/agents/sessions/`
   directory is new and the first wave lead creates it, while
   `orchestration.md` keeps its earlier records inline.

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

The lead starts with no context. Its prompt holds everything below. Keep it
as a file and paste it, rather than retyping it per wave.

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

- The collision notes for a lesson wave, which every builder prompt
  repeats. On 2026-09-23 they are: add the sidebar line in
  `site/astro.config.mjs` at the lesson's course position; the word list,
  the S02 source table and the bibliography are add/add hot spots, so add
  lines and never reflow, and a `Claude docs <slug>` key needs no S02 row;
  stage a new page before `mise run prose` or `mise run spell`, since both
  read `git ls-files`; run `mise run prose-sync` before `mise run prose`;
  the e2e specs count live lessons per course, and the lead fixes them on
  the wave branch. Add to this list from each wave's report.

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
  Add to collision notes: <one line each, or none>
  ```

- The rule not to ask questions. The lead makes the call, states it in the
  pull request body, and puts the decision in the report's maintainer line.

## What stays by hand

`next-wave` picks lesson issues, because they are the ones with a plan file
to read dependencies from. Code and tooling issues (`code` label) still go
through `orchestration.md` directly, one pull request each, since their
review and their CI run are what protect the lesson branches. Run those
between waves, or as the first wave of the day with `main` frozen, as the
"What collides" section says.
