---
name: wave
description: Run the meta-orchestration dispatcher loop. Picks the next wave of ready issues, spawns one wave lead per wave, reads its report, keeps the record, and repeats until a stop condition.
argument-hint: "[size] [kind lessons|content] [only N,N,...] [no-filing]"
---

You are the DISPATCHER of `docs/agents/meta-orchestration.md`. You run in
the main checkout, `/Users/lsimons/git/lsimons/ai-training`, on `main`. You
don't edit code or run the site's checks, and you hold one short report per
wave.
Read `docs/agents/meta-orchestration.md` once before the first wave. The
wave lead prompt is the template next to this file,
`.claude/skills/wave/wave-lead-prompt.md`, and its collision notes are the
canonical list.

## Arguments

`/wave [size]`, then any of `--kind lessons|content`, `--only N,N,...` and
`--no-filing`. The hint in the frontmatter above shows the flags without
their two leading dashes, because `mise run prose` reads the frontmatter as
prose and rejects a double hyphen there. The flags themselves keep them.

- `size`: how many issues per wave. Default 6.
- `--kind`: `lessons` (planned lessons, the default) or `content` (ready
  `content` issues outside the lesson plans). Passed to the picker.
- `--only N,N,...`: an issue whitelist. Passed to the picker, which skips
  everything else. The loop ends when every listed issue is merged, left
  out, or skipped.
- `--no-filing`: the bounded-run mode. The lead files no GitHub issues and
  lists every nit and follow-up in its report and session record instead,
  for the maintainer to file later. Use it for an unattended run, so the
  loop has a fixed amount of work and never grows its own queue.

## One tick of the loop

1. **Wave number.** List `docs/agents/sessions/*-wave-<n>.md`. The wave is
   one more than the highest `<n>`, or 6 when there is none (waves 1 to 5
   are recorded inline in `orchestration.md`).
2. **Pull and pick.** `git pull --rebase` on `main`. Then run
   `mise run next-wave -- --size <size> --kind <kind>` and add
   `--only <list>` when given. The picker reads the tree of this checkout,
   so the pull comes first. When the wave table is empty, stop and report
   what the picker listed as blocked, skipped and waiting, and by what.
3. **The nits row.** List the open `ready-for-agent` issues whose title
   contains `nits` (`gh issue list -l ready-for-agent --search "nits in:title"`).
   The repo has no nits label, so the title is the marker. Each such issue
   holds the cosmetic nits of one earlier wave, and the wave takes every
   one of them as ONE extra row after the picker's table, marked
   `(nits row)`, for one nits builder in one worktree and branch. Under `--only`, add the row only when a nits issue is in the
   whitelist. Skip this step when there is none.
4. **Fill the template.** Read `.claude/skills/wave/wave-lead-prompt.md`
   and replace:
   - `{{WAVE}}`: the wave number.
   - `{{DATE}}`: today, `YYYY-MM-DD`.
   - `{{BRANCH}}`: `wave/<n>-<kind>-<date>`, for example
     `wave/9-lessons-2026-09-24`.
   - `{{TABLE}}`: the picker's Markdown output, with the nits row appended
     to the table when there is one.
   - `{{FILING}}`: one of the two paragraphs under "Filing paragraphs"
     below, as written.
     When resuming a wave (see below), add one line at the top of the filled
     text: `You are RESUMING wave <n>. Follow "Resuming a half-done wave".`
5. **Spawn the lead.** One `general-purpose` agent, with the filled text as
   its whole prompt. Wait for its notification and do nothing else in the
   meantime. If the maintainer wants a wake-up, they run `/loop /wave ...`
   themselves.
6. **Read the report.** It is at most 200 words plus the `Follow-ups`
   lines, in the form the template ends with.
   - `merged`: play `afplay /System/Library/Sounds/Glass.aiff`. Append the
     report to `docs/agents/sessions/<date>-meta.md` (create the file with
     a `# Meta session, <date>` heading when it is new). Apply every line
     under `Add to collision notes` to the template's collision list, as a
     new bullet each, and drop a note the report says is wrong. Then go to
     step 1.
   - `open`: chime, report the lead's reason to the maintainer, and stop.
   - `failed`: chime, report to the maintainer, and stop. When branches
     were pushed, the maintainer's next `/wave` resumes the wave rather than
     restarting it: the wave number stays the same (its session record does
     not exist yet), and the filled prompt gets the resuming line from step
     4 so the lead follows "Resuming a half-done wave" in the template.

## The record and the template edits

The dispatcher never commits on `main` during a run.
`docs/agents/sessions/<date>-meta.md` and the edits to
`.claude/skills/wave/wave-lead-prompt.md` stay uncommitted in the main
checkout while the loop runs. At the end of the run one commit,
`docs(agents): meta record <date>`, holds both and goes straight to `main`.
Both files are docs, read only by the prose and lint tasks, so run
`mise run prose` and `mise run lint` before that commit. The wave lead never
touches these files, and the template says so. A `git pull --rebase` in
step 2 works with the two files dirty because no other writer changes them
on `main`.

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

> File NO GitHub issues. Put every nit you left open on a merged branch and
> every follow-up a review named, one line each with the file and the
> change, under a `Follow-ups:` line in your report and in a `## Follow-ups`
> section of the session record, so the maintainer can file them. The
> `Filed` line is `none`.

## Stop conditions

Stop, and say which one it was, when:

- the picker returns an empty wave (report what is blocked and waiting);
- the lead reports `open` or `failed`;
- the maintainer says stop;
- under `--only`, every issue in the whitelist is merged, left out or
  skipped.

The concurrent-agent cap is shared by every level, so run one wave at a
time. The template tells the lead to run at most six builders at once.
Never spawn a second lead while one is running.
