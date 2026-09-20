# Ellipses (Google)

## Rule

`.vale/styles/Google/Ellipses.yml` extends `existence` with `nonword: true`
and a single token pattern `'\.\.\.'` (a literal three-dot ellipsis, not the
word "ellipsis"). It ships at `level: warning`, carries the message "In
general, don't use an ellipsis.", links to
`https://developers.google.com/style/ellipses`, and declares a `remove`
action. The token list has one entry.

## Stats

Total hits: 16.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| agent-docs |    2 |  2707 |              0.74 |
| plan       |    7 | 15884 |              0.44 |
| spec       |    6 | 13184 |              0.46 |
| lessons    |    1 | 12227 |              0.08 |

Areas with no hits (repo-docs, data) are omitted.

Top matched phrases (lowercase):

| phrase | count |
| ------ | ----: |
| ...    |    16 |

Distinct phrases: 1. Every hit is the same literal three-dot ellipsis; the
rule does not distinguish surrounding text.

## Examples

All 16 hits, in file order.

- `docs/agents/writing-a-lesson.md:162`

  > `Recap` appends "You can now..." from the served objectives, the sources
  > from frontmatter, what comes next from `extends-to`, and the finish button.

- `docs/plan/explore/10-execute-program.md:48` (first match, span 48-50)

  > element. The lesson closes with a **code problem**: a written task ("CREATE a
  > cats table with a TEXT name column, then INSERT..., then SELECT...") with a
  > multi-line editor, a GOAL value, a YOURS value that updates on run, and

- `docs/plan/explore/10-execute-program.md:48` (second match, span 64-66)

  > element. The lesson closes with a **code problem**: a written task ("CREATE a
  > cats table with a TEXT name column, then INSERT..., then SELECT...") with a
  > multi-line editor, a GOAL value, a YOURS value that updates on run, and

- `docs/plan/explore/10-execute-program.md:62`

  > learn, counts, median time, prerequisites), a completion ring (lessons done,
  > examples done), a **Reset...** button, and the lesson graph.

- `docs/plan/explore/10-execute-program.md:69`

  > is a graph of lessons; you choose the path, starting at the top". Some
  > lessons are titled **Quiz: ...** (for example "Quiz: Two Foreign Keys" in
  > SQL), which are code problems without teaching.

- `docs/plan/explore/11-roadmap-sh.md:155`

  > Question\*\*; after checking, the correct option is marked and a one-sentence
  > rationale appears ("Option 3 is correct because..."); wrong options are
  > disabled; **Next Question**. Progress "Question 1 of 9, 11% complete".

- `docs/plan/explore/11-roadmap-sh.md:219`

  > through and the milestone bar are the cheap wins.
  > 3\. **Typed resource links** (`@official@`, `@article@`, `@video@`, ...)
  > rendered as badges, ordered by type, capped per node. Adopt the type set

- `docs/plan/explore/12-learn-prompting.md:161`

  > the top of each page are exactly what spec S01 forbids for learning
  > objectives; the lesson opener ("In this lesson we will...") and the recap
  > already carry that role. Noted only so it is not proposed again.

- `docs/prose/README.md:54`

  > | write-good | ThereIs | Every run | Rare; "There is no X" is fine and stays, the flabby opener is what it catches. Level lowered to warning |
  > | write-good | TooWordy | Every run | With nine domain terms exempted in `accept.txt` (objective, evaluate, ...) what remains is worth reading |
  > | write-good | So | Now and then | The lessons open a consequence with "So" on purpose; this catches a run of them |

- `docs/spec/S01-dictionary.md:88`

  > | `exercise` | The lesson's hands-on task, done outside the page. |
  > | `recap` | Numbered takeaways, "You can now..." objectives, sources, what comes next. |

- `docs/spec/S01-dictionary.md:107`

  > - The recap closes a lesson with numbered takeaways, the served objectives
  >   stated as "You can now...", the sources cited on the page, and what comes
  >   next.

- `docs/spec/S03-lesson-authoring.md:43` (first match, span 60-62)

  > | Length | 10 to 25 minutes. |
  > | Opener | Where we are going: "In this lesson we will...". Never "you will learn...". |
  > | Sections | H2s, each with a section kind. Body sections alternate teaching with pitfalls and checkpoints. |

- `docs/spec/S03-lesson-authoring.md:43` (second match, span 87-89)

  > | Length | 10 to 25 minutes. |
  > | Opener | Where we are going: "In this lesson we will...". Never "you will learn...". |
  > | Sections | H2s, each with a section kind. Body sections alternate teaching with pitfalls and checkpoints. |

- `docs/spec/S03-lesson-authoring.md:48`

  > | Exercise | Exactly one. |
  > | Recap | Numbered takeaways, the served objectives as "You can now...", the sources cited on the page, and what comes next. |

- `docs/spec/S03-lesson-authoring.md:106`

  > the block as illustrative, and the page must say so in prose next to it
  > ("the transcript is illustrative..."). A block that pretends to be a
  > recording is a defect.

- `site/src/content/docs/safety/agent-risk.mdx:278`

  > with an assistant that has no tools, write four short lines: the task in
  > one sentence; the blast radius in its uncomfortable form ("it can ... as
  > me"); the smallest set of access that still gets the task done; and the

## Concentration

Top files by hit count:

| file                                                                                                                | hits |
| ------------------------------------------------------------------------------------------------------------------- | ---: |
| docs/spec/S03-lesson-authoring.md                                                                                   |    4 |
| docs/plan/explore/10-execute-program.md                                                                             |    4 |
| docs/plan/explore/11-roadmap-sh.md                                                                                  |    2 |
| docs/spec/S01-dictionary.md                                                                                         |    2 |
| (four files tied at 1 hit each: writing-a-lesson.md, 12-learn-prompting.md, prose/README.md, safety/agent-risk.mdx) |    1 |

By location: 10 of the 16 hits sit inside a double-quoted phrase that is
itself a piece of quoted UI or lesson text ("You can now...", "In this
lesson we will...", "you will learn...", "Option 3 is correct because...",
"the transcript is illustrative...", "it can ... as me"). Two hits are
inside a Markdown table cell (`docs/spec/S01-dictionary.md:88` and both
matches on `docs/spec/S03-lesson-authoring.md:43`, which is itself a table
row, so those two count toward both the quoted-phrase group and the table
group). One hit is a UI button label rendered in bold (`**Reset...**`),
one is a lesson-title placeholder in bold (`**Quiz: ...**`), one is inside
a parenthetical list of example values ("`@official@`, `@article@`,
`@video@`, ..."), and one is inside a code-adjacent written task
description quoting SQL-like fragments twice on the same line
(`INSERT...`, `SELECT...`). None of the 16 hits appear in a heading or in
running prose without an accompanying quotation mark or code span.
