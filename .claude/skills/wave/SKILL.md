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
  issue. The lead lists every nit and follow-up in its report and session
  record instead, for the maintainer to file later. Use it for an
  unattended run, so the loop has a fixed amount of work and never grows
  its own queue.

## The meta record

`docs/agents/sessions/<date>-meta.md` is the run's memory. Create it on the
first tick with a `# Meta session, <date>` heading and the arguments, then
keep these sections current:

- `## Remaining --only`: the whitelist numbers not yet handled (only with
  `--only`).
- `## Parked`: issues a lead left out, with the reason. A parked issue is
  never picked again in this run.
- `## Waves`: one appended report per wave, plus the wave's branch name.

## One tick of the loop

1. **Pull.** `git pull --rebase` on `main`. The tree is clean between ticks
   (step 7), so this never stalls.
2. **Wave number.** Take the highest `<n>` from
   `docs/agents/sessions/*-wave-<n>.md` and from
   `git ls-remote origin 'refs/heads/wave/*'` (branch names
   `wave/<n>-...`), and add one. Use 6 when neither has any (waves 1 to 5
   are recorded inline in `orchestration.md`).
3. **Check for a failed wave first.** A wave failed when the lead never
   reported `merged`. Its signs: an `origin/wave/<n>-*` branch whose `<n>`
   is the number step 2 computed (its session record doesn't exist, so the
   number wasn't advanced), or, under `--only`, an `origin/feat/<issue>-*`
   branch for a remaining whitelist issue with no merged pull request
   (`gh pr list --state merged --search "<issue>"` is empty). If either is
   found, skip steps 4 and 5: fill the template for that wave number, the
   existing branch (`wave/<n>-<kind>`, or the one the meta record names),
   the wave's table from the meta record or, when there is none, a table of
   the issues the `feat/` branches name, and the resuming form of
   `{{RESUME}}` (below). Then go to step 6.
4. **Pick.** Run `mise run next-wave -- --size <size> --kind <kind>`, and
   add `--only <remaining>` under `--only`, where `<remaining>` is the
   record's `Remaining --only` list. Then build the nits row: the open
   `ready-for-agent` issues whose title starts with `Nits` or
   `Cosmetic nits` (`gh issue list -l ready-for-agent --search "nits in:title"`;
   the repo has no nits label, so the title is the marker, and the
   `content` picker leaves them out for this reason). Under `--only`, take
   only the nits issues in the remaining list. Every nits issue found goes
   into ONE extra row appended to the picker's table, marked `(nits row)`,
   for one nits builder in one worktree and branch. A wave that is only the
   nits row is valid and proceeds. When the table is empty after that,
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
     (step 3), these three sentences: `You are RESUMING wave <n> on branch <branch>.` `A previous lead stopped before reporting.` `Follow "Resuming a half-done wave" before anything else.`
   - Before spawning, write the branch name into the meta record's
     `## Waves` section. A later resume reads it from there.
6. **Spawn the lead.** One `general-purpose` agent, with the filled text as
   its whole prompt. Wait for its notification and do nothing else in the
   meantime. Never spawn a second lead for any reason while one runs.
7. **Read the report and commit the record.** The report is at most 200
   words plus the `Follow-ups` lines, in the form the template ends with.
   Whatever the status, do this first:
   - Append the report to the meta record under `## Waves`.
   - Apply every line under `Add to collision notes` to the template's
     collision list, as a new bullet each, and drop a note the report says
     is wrong.
   - Under `--only`: remove the `Merged issues` and the `Left out` numbers
     from `Remaining --only`, and add the `Left out` ones to `## Parked`
     with their reason.
   - Run `mise run spell` and `mise run prose`. Fix what they flag in the
     two files. Commit both files on `main` as
     `docs(agents): meta record wave <n>` with the attribution lines, and
     push. Nothing of the dispatcher's stays uncommitted between ticks.
   - Then act on the status.
   - `merged`: play `afplay /System/Library/Sounds/Glass.aiff` and go to
     step 1.
   - `open`: chime, report the lead's reason to the maintainer, and stop.
   - `failed`: chime, report to the maintainer, and stop. The next `/wave`
     finds the wave in step 3 and resumes it rather than restarting it.

## Filing paragraphs

Default (no `--no-filing`):

> Before you report, file a GitHub issue (per `docs/agents/triage.md`,
> labeled `code` or `content` plus `ready-for-agent` when every decision is
> made, or `ready-for-human` when one is the maintainer's) for every
> follow-up a review named. Collect every cosmetic nit you left open on a
> merged branch into ONE issue for this wave, titled
> `Cosmetic nits left open on wave <n> branches`, with one line per nit
> naming the file and the change. Never file one nits issue per lesson.
> Link every filed issue from the session record and list them on the
> `Filed` line. The `Follow-ups` line is `none`.

Under `--no-filing`:

> Nobody in this wave runs `gh issue create`. Pass this rule, this whole
> paragraph, verbatim to every builder and reviewer you spawn. Builders skip
> the `complete` skill's follow-up-filing step and put every follow-up and
> nit they'd have filed, one line each with the file and the change, in
> their final report to you. You collect them, plus every nit you left open
> on a merged branch and every follow-up a review named, under a
> `Follow-ups:` line in your report and in a `## Follow-ups` section of the
> session record, so the maintainer can file them. The `Filed` line is
> `none`.

## Stop conditions

Stop, and say which one it was, when:

- the picker returns an empty wave and there is no nits row (report what
  is blocked, waiting and not picked);
- under `--only`, the `Remaining --only` list is empty;
- the lead reports `open` or `failed`;
- the maintainer says stop.

The concurrent-agent cap is shared by every level, so run one wave at a
time. The template tells the lead to run at most six builders at once.
