---
name: wave
description: Run the meta-orchestration dispatcher loop. Picks the next wave of ready issues, spawns one wave lead per wave, reads its report, keeps the record, and repeats until a stop condition.
argument-hint: "[size] [kind lessons|content] [only N,N,...] [no-filing]"
---

You are the DISPATCHER of `docs/agents/meta-orchestration.md`. You run in
the main checkout, `/Users/lsimons/git/lsimons/ai-training`, on `main`. You
don't edit code or run the site's checks, and you hold one short report per
wave. Read `docs/agents/meta-orchestration.md` once before the first wave.
The wave lead prompt is the template next to this file,
`.claude/skills/wave/wave-lead-prompt.md`, and its collision notes are the
canonical list. You loop until a stop condition, and you never spawn a
second lead while one is running.

## Arguments

`/wave [size]`, then any of `--kind lessons|content`, `--only N,N,...` and
`--no-filing`. The hint in the frontmatter above shows the flags without
their two leading dashes, because `mise run prose` reads the frontmatter as
prose and rejects a double hyphen there. The flags themselves keep them.

- `size`: how many issues per wave. Default 6.
- `--kind`: `lessons` (planned lessons, the default) or `content` (ready
  `content` issues outside the lesson plans). Passed to the picker.
- `--only N,N,...`: an issue whitelist for the whole run. The picker skips
  everything else and reports every listed number it didn't pick, with the
  reason. The meta record (below) holds the remaining list, and the run
  ends when it is empty.
- `--no-filing`: the bounded-run mode. Nobody in the wave files a GitHub
  issue while the run goes. Each lead writes its follow-ups, as issue
  titles and bodies, to a follow-ups file on its wave branch, and you file
  them all when the run ends (see "When the run ends"). Use it for an
  unattended run, so the loop has a fixed amount of work and never grows
  its own queue.

## The meta record

The meta record is the run's memory. It is named once, at the start of the
run, `docs/agents/sessions/<start-date>-meta.md`, and the whole run writes
to that file, past midnight included. On a fresh session, first look for
the newest meta record with an `In flight` line that no report resolves:
that is a run to resume, and its file, arguments and remaining whitelist
are yours. Otherwise create a new file with a `# Meta session, <date>`
heading and the arguments. Keep these sections current:

- `## Remaining --only`: the whitelist numbers not yet handled (only with
  `--only`).
- `## Parked`: issues a lead left out, with the reason. A parked issue is
  never picked again in this run.
- `## Pending collision notes`: the add and remove lines from the leads'
  reports that the maintainer hasn't read yet (step 7).
- `## Waves`: per wave, first an `In flight: wave <n>, branch <b>, issues #a #b ...` line while the lead runs, replaced by the lead's report when
  it arrives. An `In flight` line with no report after it marks a wave to
  resume.

Every commit of the meta record follows the same steps: run
`mise run spell` and `mise run prose`, fix what they flag in the files you
touched, commit on `main` with the attribution lines, `git pull --rebase`
right before the push (the lead merges into `origin/main` while you wait,
so the pull from step 1 is stale by then), push with
`AI_TRAINING_ROLE=dispatcher git push` (the Bash guard hook rejects any
other push to `main`), and retry that pull and push once if the push is
rejected.

## One tick of the loop

1. **Pull.** `git pull --rebase` on `main`. The tree is clean between ticks
   (step 7), so this never stalls.
2. **Wave number.** One more than the highest `<n>` in
   `docs/agents/sessions/*-wave-<n>.md`, or 6 when there is none (waves 1
   to 5 are recorded inline in `orchestration.md`). Wave branches on
   `origin` don't count.
3. **Check for an unfinished wave.** Two signs, and either one means
   resume:
   - `git ls-remote origin 'refs/heads/wave/<n>-*'` finds a branch for the
     number step 2 computed. Its session record doesn't exist, so the lead
     never finished. Resume wave `<n>` on that branch.
   - The meta record has an `In flight` line with no report after it. Its
     wave number, branch and issues are the wave to resume, and its issues
     are the only ones whose `origin/feat/<issue>-*` branches count. A
     `feat/` branch for any other issue is stale and ignored.
     To resume, skip steps 4 and 5: fill the template for that wave number
     and branch, the table from the `In flight` issues (as the picker would
     print them, or one row per issue with its title), and the resuming form
     of `{{RESUME}}` (below). Then go to step 6.
4. **Pick.** Run `mise run next-wave -- --size <size> --kind <kind>`, and
   add `--only <remaining>` under `--only`, where `<remaining>` is the
   record's `Remaining --only` list. The picker also takes
   `--unblockers-first`, which scores each candidate by how many blocked
   lessons it unblocks, sorts that score before the course position within
   an area (the planned `after` rule still comes first), and adds an
   `Unblocks` column. Use it when the maintainer asks for it. Then decide on
   the nits row. There is at most one open nits issue, titled
   `Cosmetic nits` (`gh issue list -s open --search "Cosmetic nits in:title"`;
   the repo has no nits label, so the title is the marker, and the
   `content` picker leaves it out for this reason). Add it as ONE extra row
   appended to the picker's table, marked `(nits row)`, for one nits
   builder in one worktree and branch, only when its body has 10 or more
   nit lines or the picker's table is otherwise empty. Under `--only`, add
   it only when it is in the remaining list. A wave that is only the nits
   row is valid and proceeds. When the table is empty after that,
   stop, and report what the picker listed as blocked, skipped, waiting and
   not picked.
5. **Fill the template.** Read `.claude/skills/wave/wave-lead-prompt.md`
   and replace:
   - `{{WAVE}}`: the wave number.
   - `{{DATE}}`: today, `YYYY-MM-DD`.
   - `{{BRANCH}}`: `wave/<n>-<kind>`, for example `wave/9-lessons`. No
     date, so a resume on a later day finds it.
   - `{{TABLE}}`: the picker's Markdown output, with the nits row appended
     to the table when there is one.
   - `{{FILING}}`: one of the two paragraphs under "Filing paragraphs"
     below, as written.
   - `{{RESUME}}`: for a new wave, `This is a fresh wave.` For a resume
     (step 3), these three sentences: `You are RESUMING wave <n> on branch <branch>.` `A previous lead stopped before reporting.` `Follow "Resuming a half-done wave" in your agent file before anything else.`
6. **Mark the wave in flight, then spawn the lead.** Write
   `In flight: wave <n>, branch <b>, issues #a #b ...` under `## Waves` in
   the meta record (on a resume the line is already there), and commit and
   push it as `docs(agents): meta record wave <n> in flight`, following
   the commit steps above. Then spawn one `wave-lead` agent
   (`.claude/agents/wave-lead.md`) with the filled text as its whole
   prompt. Wait for its notification and do
   nothing else in the meantime: end your turn, and the notification
   wakes you. Never spawn a second lead for any reason while one runs.
   If a fallback `ScheduleWakeup` is armed for this wave, re-arm it when
   the report arrives (for the next wave's lead, or with `stop: true`
   when the run ends), because a scheduled call replaces the pending one.
   A scheduled wake-up that arrives after the wave's report is stale, so
   say nothing about it and carry on.
7. **Read the report and commit the record.** The report is at most 200
   words plus the `Follow-ups` lines, in the form the template ends with.
   Whatever the status, do this first:
   - Replace the wave's `In flight` line in the meta record with the
     report.
   - Copy every line under `Add to collision notes` and
     `Remove from collision notes` into the `## Pending collision notes`
     section of the meta record, each marked add or remove and with its
     list (lessons or code). Don't edit the template's lists yourself.
     When the maintainer has read a pending line and agreed, apply it to
     the named list and delete it from the section. Each list holds at
     most 15 bullets, so an add at the cap names the bullet it replaces
     or the check that makes one unnecessary.
   - Under `--only`: remove the `Merged issues` and the `Left out` numbers
     from `Remaining --only`, and add the `Left out` ones to `## Parked`
     with their reason.
   - Commit the meta record (and the template, when a pending line was
     applied) on `main` as
     `docs(agents): meta record wave <n>`, following the commit steps
     above. Nothing of the dispatcher's stays uncommitted between ticks.
   - Then act on the status.
   - `merged`: play `afplay /System/Library/Sounds/Glass.aiff` and go to
     step 1.
   - `open`: chime, report the lead's reason to the maintainer, and stop.
   - `failed`: chime, report to the maintainer, and stop. The `In flight`
     line stays replaced by the report, so the next `/wave` finds the wave
     through its `origin/wave/<n>-*` branch in step 3 and resumes it rather
     than restarting it.

## Filing paragraphs

Default (no `--no-filing`):

> Before you report, file a GitHub issue (per `docs/agents/triage.md`,
> labeled `code` or `content` plus `ready-for-agent` when every decision is
> made, or `ready-for-human` when one is the maintainer's) for every
> follow-up a review named. Fix cheap nits in the branch. Every cosmetic nit
> you leave open on a merged branch becomes one line, naming the file and
> the change, appended to the body of the one open issue titled
> `Cosmetic nits` (`gh issue view <n> --json body`, then
> `gh issue edit <n> --body-file`). Create that issue, labeled `content`
> and `ready-for-agent`, only when none is open. Never file a nits issue
> per wave or per lesson. Link every filed issue from the session record
> and list them on the `Filed` line. The `Follow-ups` line is `none`.

Under `--no-filing`:

> Nobody in this wave runs `gh issue create` or edits an issue body. Pass
> this rule, this whole paragraph, verbatim to every builder you spawn.
> Builders skip the `complete` skill's follow-up-filing step and put every
> follow-up and nit they'd have filed, one line each with the file and the
> change, in their final report to you. For every follow-up a review named
> or a builder reported, write the issue you would have filed, as a
> `## <title>` heading with the body and labels under it, to
> `docs/agents/sessions/<date>-wave-<n>-follow-ups.md` on the wave branch.
> Put the cosmetic nits you left open in the same file under one
> `## Cosmetic nits` heading, one line each. Name the file on the
> `Follow-ups:` line of your report. The `Filed` line is `none`.

## When the run ends

Under `--no-filing`, before the final report, file what the leads wrote.
For each follow-ups file the run's reports name, check every entry once
against `main` as it is now, and drop the ones already done or made
obsolete, saying which and why. File each remaining entry as the issue it
describes, per `docs/agents/triage.md`, and append the nit lines to the
open `Cosmetic nits` issue (create it only when none is open). List the
filed numbers in the final report. Nothing is left in a record for the
maintainer to reconcile by hand.

## Stop conditions

Stop, and say which one it was, when:

- the picker returns an empty wave and there is no nits row (report what
  is blocked, waiting and not picked);
- under `--only`, the `Remaining --only` list is empty;
- the lead reports `open` or `failed`;
- the maintainer says stop.

The concurrent-agent cap is shared by every level, so run one wave at a
time. The template tells the lead to run at most six builders at once.
