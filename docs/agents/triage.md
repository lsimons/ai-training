# Triaging issues

How an agent walks the maintainer through the open issues and leaves every
one of them in a state where an agent can start, a human has one named
action, or the issue is closed with a reason. Labels and the `gh` commands
are in `issue-tracker.md`. Written after the session of 2026-09-20 that
took seven `ready-for-human` and nine `needs-triage` issues to zero of each.

Triage is a decision pass. It doesn't write code or specs, and it doesn't
leave an issue "for later" without saying what later means.

## The pass

1. **Fetch everything first.** List the issues in the label you are
   triaging, then read each body and every comment in one batch. Earlier
   triage comments are often already there and only the label was missed.
   Check the state of every issue a body or comment names as a blocker.
   When a `ready-for-agent` issue states a blocker or a start date in
   free text, add the dependency line for it (below).

2. **One issue at a time, with the maintainer.** For each issue, say in a
   few sentences what it is and where it came from, then give one
   recommended outcome with a reason and one or two alternatives. Ask,
   wait, then act before moving to the next. When the maintainer asks
   what the issue is, explain it in full before asking again. The general
   rules for a question to the maintainer, including which triage
   decisions you make yourself, are in `AGENTS.md`, "Asking the
   maintainer".

3. **Record the decision on the issue**, in a comment that starts with
   `Decision (YYYY-MM-DD):` or `Triage (YYYY-MM-DD):`, then change the
   label. The comment is the durable record, and the next agent reads it
   without this conversation.

4. **Check the queues** at the end. The label you triaged should be empty
   or hold only issues whose comment names the human action they wait for.

## The four outcomes

| Outcome                    | When                                                                | What the comment holds                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready-for-agent`          | Every decision the work needs is made, with the answer written down | The decisions, the files to touch, and a "done when" an agent can check                                                                        |
| `ready-for-agent`, blocked | Fully specified, waits on another issue or an open pull request     | `blocked by #N (PR #M)` and the instruction to confirm the merge before starting                                                               |
| `ready-for-human`          | The next step is something only the maintainer can do               | The one action, stated so the maintainer can do it without rereading the issue. A decision holds what "What a maintainer decision needs" lists |
| Closed                     | Not worth doing, superseded, or split into children                 | The reason, or the list of child issues and the entries that were dropped, each with why                                                       |

A "write the spec" issue is a valid `ready-for-agent` outcome when the
decisions are made and only the writing is left. Put the decisions in the
comment, so the spec author doesn't come back with the same questions.

Fully specified issues that wait on a merge get `ready-for-agent` with the
blocker named. Keeping them in `needs-triage` means a second triage pass for
no new information.

## Issues that hold a list

An issue that holds a list of deferred surfaces, proposals or ideas is not
a task. Walk its entries one by one. For each entry, recommend keep or drop
with a one-line reason. A kept entry becomes its own issue with concrete
build steps and file pointers. A dropped entry is named in the closing
comment with the reason, so the next agent doesn't re-propose it. Then
close the parent. No tracking issue, no tracking label, no parking lot.

The same applies to an umbrella issue whose work has already been split:
close it, list the children.

## What a ready-for-agent issue contains

The builder starts with no context and doesn't ask questions, so the issue
body and its decision comment together hold:

- What exists today, with the file paths, so the builder reads before it
  writes.
- Each decision the work needs, answered. Where two designs were possible,
  the one chosen and in one clause why.
- Which spec sections change, by name.
- Which tests or checks prove it: the e2e flow to extend, the build check
  to add, the `mise run ci` gate.
- What is out of scope, when a reader could reasonably assume otherwise.
- Its blocker, if any, as a dependency line (below), and the issue it
  was split from.

## Dependency lines

The wave picker (`mise run next-wave`, `scripts/next_wave.py`) reads two
line forms in an issue body, for every kind of wave:

```text
Blocked by #123
Not before 2026-10-01
```

- `Blocked by #N` blocks the issue while #N is open. One line names one
  issue, so an issue with two blockers has two lines. An open pull request
  blocks too.
- `Not before YYYY-MM-DD` blocks the issue until that date, read in UTC.
  On the date itself the issue is free. With two lines the later date
  counts. The picker reports a date it can't read, such as `2026-9-1` or
  a date with a trailing period, and blocks the issue until it's fixed.
- Each goes on its own line near the top of the body, before the prose,
  with the words and case as shown and nothing else on the line. A
  sentence such as "Blocked by #123, confirm it merged" doesn't count, and
  neither does a line inside a code fence or a quote (`>`), so an issue can
  show the forms, as this section does.
- For a lesson the lines come on top of its plan file's `assumes` entries.
- The picker looks up a blocker that isn't in its list with
  `gh issue view`, and a number that doesn't exist stops it, so a typo
  shows up at the next pick.
- When a blocker closes, the line can stay. Remove it when you edit the
  body anyway.

Stale paths in an old body (`docs/src/` where the code is under `site/src/`)
get corrected in the triage comment rather than left for the builder to
discover.

## What stays with the maintainer

Some steps need a machine, an account or a judgment an agent here doesn't
have: a network trace with a firewall and a proxy, a licensing release from
a source, a check of every article reference in a lesson about law. State
the step as the one action on the issue and label it `ready-for-human`.
An issue that asks the maintainer to decide holds what the next section
lists.
Don't turn it into an agent task by guessing around it, and don't raise it
again in later sessions unless asked. Some of these are "when I get to
it" items for the maintainer, and that is a fine state for an issue to be
in.

## What a maintainer decision needs

An agent that files an issue for a decision only the maintainer can make
(`ready-for-human`, or a question on a report's maintainer line) writes the
body so the maintainer can decide from it alone. The body holds:

- The problem, in plain words.
- What already exists that overlaps: tools, settings, other issues and
  their state, with links. Look these up before filing, so the maintainer
  doesn't have to.
- The options, each with its cost in time, money or upkeep.
- One recommendation, with its reason.

A body that holds only "the one action" is fine for a step such as a
network trace, where nothing is left to decide. In the review of
2026-09-25, a `ready-for-human` issue without this material (#278) cost the
maintainer a second session to find out what an existing tool already
covered, while a question that held the background, the options and a plan
took about a minute.

## Writing the comments

- Date every decision comment. Relative words ("today", "last week") go
  stale.
- Name issues and pull requests by number. GitHub links them.
- When a `gh issue create` call returns the new issue's URL into a shell
  variable, expand it in the closing comment with an unquoted heredoc, or
  write the numbers by hand after creation and read the comment back. A
  quoted heredoc leaves a literal `$A` in the comment.
- Every comment ends with the attribution lines from `AGENTS.md`.

## Session record, 2026-09-20

Sixteen issues in two rounds. Seven `ready-for-human`: four became
`ready-for-agent` with their decisions written down (two of them as
"write the spec" issues for S07 and S08), three were closed after their
entries were split into six new issues and nine entries were dropped with
reasons. Nine `needs-triage` that already carried a triage comment from an
earlier pass: seven relabeled `ready-for-agent` with their blocker named,
one `ready-for-agent` with a one-line spec addition folded in, one
`ready-for-human` for a trace only the maintainer can run.
