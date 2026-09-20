# proselint: whole-package report

Gathering only, per `docs/prose/report-template.md`. Covers all 34 rule
files under `.vale/styles/proselint/` (`meta.json` and `README.md` are not
rules) because the package produced only 19 hits in total.

## Package

`.vale/styles/proselint/meta.json` describes the package as "A
Vale-compatible implementation of the proselint linter." (author `jdkato`,
source `github.com/amperser/proselint`, license BSD-3-Clause).
`.vale/styles/proselint/README.md` itself contains only the BSD-3-Clause
license text copied from upstream proselint, not a description; the
description above comes from `meta.json`.

Shipped levels, counted from `level:` in the 34 rule YAML files: 27 rules
ship `error`, 1 rule (`P-Value`) ships `suggestion`, and 6 rules
(`Currency`, `DenizenLabels`, `GroupTerms`, `LGBTOffensive`, `LGBTTerms`,
`Needless`) have no `level:` key at all — Vale's documented default is
`warning`, so these run as `warning`. No rule ships `warning` explicitly.

## Rules

Sorted by hits descending, then name. "What it checks" is the rule's
`message` template plus the kind and size of its match list, both read
from the YAML.

| Rule           | Shipped level     | What it checks                                                                                     | Hits                                                          |
| -------------- | ----------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Typography     | error             | "Consider using the '%s' symbol instead of '%s'." — 6 swap pairs                                   | 17                                                            |
| Cliches        | error             | "'%s' is a cliche." — 777 tokens                                                                   | 1                                                             |
| Very           | error             | "Remove '%s'." — 1 token                                                                           | 1                                                             |
| Airlinese      | error             | "'%s' is airlinese." — 3 tokens                                                                    | 0                                                             |
| AnimalLabels   | error             | "Consider using '%s' instead of '%s'." — 42 swap pairs                                             | 0                                                             |
| Annotations    | error             | "'%s' left in text." — 4 tokens                                                                    | 0                                                             |
| Apologizing    | error             | "Excessive apologizing: '%s'" — 1 token                                                            | 0                                                             |
| Archaisms      | error             | "'%s' is archaic." — 47 tokens                                                                     | 0                                                             |
| But            | error             | "Do not start a paragraph with a 'but'." — 1 token                                                 | 0                                                             |
| CorporateSpeak | error             | "'%s' is corporate speak." — 25 tokens                                                             | 0                                                             |
| Currency       | warning (default) | "Incorrect use of symbols in '%s'." — 1 raw pattern                                                | 0                                                             |
| Cursing        | error             | "Consider replacing '%s'." — 10 tokens                                                             | 0                                                             |
| DateCase       | error             | "With lowercase letters, the periods are standard." — 1 token                                      | 0                                                             |
| DateMidnight   | error             | "Use 'midnight' or 'noon'." — 1 token                                                              | 0                                                             |
| DateRedundancy | error             | "'a.m.' is always morning; 'p.m.' is always night." — 4 tokens                                     | 0                                                             |
| DateSpacing    | error             | "It's standard to put a space before '%s'" — 1 token                                               | 0                                                             |
| DenizenLabels  | warning (default) | "Did you mean '%s'?" — 46 swap pairs                                                               | 0                                                             |
| Diacritical    | error             | "Consider using '%s' instead of '%s'." — 78 swap pairs                                             | 0                                                             |
| GenderBias     | error             | "Consider using '%s' instead of '%s'." — 38 swap pairs                                             | 0                                                             |
| GroupTerms     | warning (default) | "Consider using '%s' instead of '%s'." — 33 swap pairs                                             | 0                                                             |
| Hedging        | error             | "'%s' is hedging." — 3 tokens                                                                      | 0                                                             |
| Hyperbole      | error             | "'%s' is hyperbolic." — 1 token (regex for repeated `!`/`?`)                                       | 0                                                             |
| Jargon         | error             | "'%s' is jargon." — 6 tokens                                                                       | 0                                                             |
| LGBTOffensive  | warning (default) | "'%s' is offensive. Remove it or consider the context." — 9 tokens                                 | 0                                                             |
| LGBTTerms      | warning (default) | "Consider using '%s' instead of '%s'." — 9 swap pairs                                              | 0                                                             |
| Malapropisms   | error             | "'%s' is a malapropism." — 3 tokens                                                                | 0                                                             |
| Needless       | warning (default) | "Prefer '%s' over '%s'" — 352 swap pairs                                                           | 0                                                             |
| Nonwords       | error             | "Consider using '%s' instead of '%s'." — 31 swap pairs                                             | 0                                                             |
| Oxymorons      | error             | "'%s' is an oxymoron." — 17 tokens                                                                 | 0                                                             |
| P-Value        | suggestion        | "You should use more decimal places, unless '%s' is really true." — 1 token (regex for `p = 0.0…`) | 0                                                             |
| RASSyndrome    | error             | "'%s' is redundant." — 20 tokens                                                                   | 0                                                             |
| Skunked        | error             | "'%s' is a bit of a skunked term — impossible to use without issue." — 8 tokens                    | 0                                                             |
| Spelling       | error             | "Inconsistent spelling of '%s'." — 12 either-pairs (consistency check)                             | 0                                                             |
| Uncomparables  | error             | "'%s' is not comparable" — 37 tokens + 1 raw pattern                                               | not run — crashes Vale 3.20.0 when a match spans a line break |

## Hits in context

All 19 hits, grouped by rule. `file:line`, matched text, then the sentence
quoted verbatim with one line before and after where it wraps.

### Typography (17)

- `docs/agents/writing-a-lesson.md:162`, match `...`:
  > `Recap` appends "You can now..." from the served objectives, the sources
  > from frontmatter, what comes next from `extends-to`, and the finish button.
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:71`, match `2x2`:
  > widgets.
  >
  > - DeepLearning.AI wins on eval-driven method (measured reflection, 2x2 eval
  >   taxonomy, error-analysis tallies, component evals) and live coding-agent
- `docs/plan/explore/10-execute-program.md:48`, two matches of `...` on one line:
  > element. The lesson closes with a **code problem**: a written task ("CREATE a
  > cats table with a TEXT name column, then INSERT..., then SELECT...") with a
  > multi-line editor, a GOAL value, a YOURS value that updates on run, and
- `docs/plan/explore/10-execute-program.md:62`, match `...`:
  > learn, counts, median time, prerequisites), a completion ring (lessons done,
  > examples done), a **Reset...** button, and the lesson graph.
- `docs/plan/explore/10-execute-program.md:69`, match `...`:
  > is a graph of lessons; you choose the path, starting at the top". Some
  > lessons are titled **Quiz: ...** (for example "Quiz: Two Foreign Keys" in
  > SQL), which are code problems without teaching.
- `docs/plan/explore/11-roadmap-sh.md:155`, match `...`:
  > Question\*\*; after checking, the correct option is marked and a one-sentence
  > rationale appears ("Option 3 is correct because..."); wrong options are
  > disabled; **Next Question**. Progress "Question 1 of 9, 11% complete".
- `docs/plan/explore/11-roadmap-sh.md:219`, match `...`:
  > through and the milestone bar are the cheap wins.
  > 3\. **Typed resource links** (`@official@`, `@article@`, `@video@`, ...)
  > rendered as badges, ordered by type, capped per node. Adopt the type set
- `docs/plan/explore/12-learn-prompting.md:161`, match `...`:
  > the top of each page are exactly what spec S01 forbids for learning
  > objectives; the lesson opener ("In this lesson we will...") and the recap
  > already carry that role. Noted only so it is not proposed again.
- `docs/prose/README.md:46`, match `...`:
  > | write-good | ThereIs | Every run | Rare; "There is no X" is fine and stays, the flabby opener is what it catches. Level lowered to warning |
  > | write-good | TooWordy | Every run | With nine domain terms exempted in `accept.txt` (objective, evaluate, ...) what remains is worth reading |
  > | write-good | So | Now and then | The lessons open a consequence with "So" on purpose; this catches a run of them |
- `docs/spec/S01-dictionary.md:88`, match `...`:
  > | `exercise` | The lesson's hands-on task, done outside the page. |
  > | `recap` | Numbered takeaways, "You can now..." objectives, sources, what comes next. |
- `docs/spec/S01-dictionary.md:107`, match `...`:
  > - The recap closes a lesson with numbered takeaways, the served objectives
  >   stated as "You can now...", the sources cited on the page, and what comes
  >   next.
- `docs/spec/S03-lesson-authoring.md:43`, two matches of `...` on one line:
  > | Length | 10 to 25 minutes. |
  > | Opener | Where we are going: "In this lesson we will...". Never "you will learn...". |
  > | Sections | H2s, each with a section kind. Body sections alternate teaching with pitfalls and checkpoints. |
- `docs/spec/S03-lesson-authoring.md:48`, match `...`:
  > | Exercise | Exactly one. |
  > | Recap | Numbered takeaways, the served objectives as "You can now...", the sources cited on the page, and what comes next. |
- `docs/spec/S03-lesson-authoring.md:106`, match `...`:
  > the block as illustrative, and the page must say so in prose next to it
  > ("the transcript is illustrative..."). A block that pretends to be a
  > recording is a defect.
- `site/src/content/docs/safety/agent-risk.mdx:278`, match `...`:
  > with an assistant that has no tools, write four short lines: the task in
  > one sentence; the blast radius in its uncomfortable form ("it can ... as
  > me"); the smallest set of access that still gets the task done; and the

### Cliches (1)

- `site/src/content/docs/concepts/how-models-work.mdx:35`, match `in a word`:
  > This has consequences you will notice. Models are bad at counting letters
  > in a word, because they never saw the letters. They are priced per token,
  > not per word. And rare names and non-English text often cost more tokens

### Very (1)

- `docs/plan/explore/03-cs50-pedagogy.md:82`, match `very`:
  > - Research findings: 300k+ students, about 21k prompts/day (2025). Survey:
  >   about 47% "very helpful", 26% "helpful". Questions asked of TFs fell from
  >   0.89 to 0.28 per student; office-hours attendance from 51% to 30%. Student

## Concentration

By file (all 19 hits, 11 files):

- `docs/spec/S03-lesson-authoring.md` — 4 (lines 43 ×2, 48, 106)
- `docs/plan/explore/10-execute-program.md` — 4 (lines 48 ×2, 62, 69)
- `docs/plan/explore/11-roadmap-sh.md` — 2 (lines 155, 219)
- `docs/spec/S01-dictionary.md` — 2 (lines 88, 107)
- `docs/agents/writing-a-lesson.md` — 1
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` — 1
- `docs/plan/explore/12-learn-prompting.md` — 1
- `docs/plan/explore/03-cs50-pedagogy.md` — 1
- `docs/prose/README.md` — 1
- `site/src/content/docs/concepts/how-models-work.mdx` — 1
- `site/src/content/docs/safety/agent-risk.mdx` — 1

By area (`wordcount.tsv`): `plan` 9 hits (5 files), `spec` 6 hits (2
files), `lessons` 2 hits (2 files: `how-models-work.mdx`,
`agent-risk.mdx`), `agent-docs` 2 hits (2 files: `writing-a-lesson.md`,
`docs/prose/README.md`). No hits in `repo-docs` or `data`.

Placement of the 19 hits:

- Markdown table cells: `docs/prose/README.md:46` (3 matches counted as 1
  hit line but only 1 alert on that line), `docs/spec/S01-dictionary.md:88`,
  `docs/spec/S03-lesson-authoring.md:43` (2 alerts), `:48` — 4 alerts total
  across table rows.
- Quoted example/UI strings inside running prose (parenthetical or quoted
  fragments like `"You can now..."`, `"In this lesson we will..."`, `"Quiz: ..."`, `"Reset..."`, `"it can ... as me"`): the remaining 13 Typography
  alerts.
- Running prose, no quoting: the single `Cliches` hit ("in a word") and the
  single `Very` hit ("very helpful", itself inside a quoted survey figure).
- None of the 19 hits sit in a heading. None sit in fenced code blocks;
  one (`11-roadmap-sh.md:219`) is adjacent to inline-code tokens
  (`` `@official@` ``) in the same list item. None are in block quotes.
- All 19 hits are in `docs/` and `site/src/content/docs/` prose files, none
  in YAML/data files, none in the two lesson pages' non-prose regions
  (frontmatter, code fences).
