# ai-tells.ColonUsage

## Rule

`.vale/styles/ai-tells/ColonUsage.yml` extends the `existence` rule with
`nonword: true`, `level: error`, `scope: ~heading` (every scope except
headings), and a single token, `(?<!:[^ ]+?):\s(?!I\b)[A-Z][a-z]*\b`: a
colon, whitespace, then a word that starts with a capital and continues
in lowercase only. The lookahead skips the pronoun "I"; the
`[A-Z][a-z]*\b` shape skips all-caps acronyms and mixed-case names such
as "ReAct". The lookbehind skips a colon that follows another
colon-joined run, so "10:30: Meeting" stays clean. The message is "AI
punctuation: '%s'. Lowercase the word after the colon unless it is a
proper noun." The YAML comment states the rationale: the rule "Replaces
Google.Colons, which checks heading text too and flags the title half of
'Appendix A: Glossary'"; headings are exempt here, and "everywhere else a
capitalized word after a colon is the 'Label: Sentence' construction."
It names a known limitation: Vale strips markup before matching, so a
run-in bold label (`**Note:** Like this.`) flags too, and says to
"Disable the rule where that convention is established." The `Match` is
the colon plus the word, so it varies per hit.

## Stats

Total hits: 52.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |   32 | 15852 |              2.02 |
| spec       |   19 | 13147 |              1.45 |
| agent-docs |    1 |  3200 |              0.31 |
| lessons    |    0 | 12134 |              0.00 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   52 | 66006 |              0.79 |

Top matched phrases:

| phrase          | count |
| --------------- | ----: |
| `: draft`       |     6 |
| `: foundations` |     4 |
| `: claude`      |     3 |
| `: a`           |     3 |
| `: build`       |     3 |
| `: define`      |     3 |
| `: fix`         |     2 |
| `: n`           |     2 |
| `: quarto`      |     1 |
| `: apache`      |     1 |
| `: when`        |     1 |
| `: framework`   |     1 |
| `: advanced`    |     1 |
| `: teaching`    |     1 |
| `: skilljar`    |     1 |

Distinct phrases: 34. The 6 `: draft` hits are the `**Status:** Draft`
line of every spec (S01 through S06); the 3 `: define` and 2 `: fix`
hits are the `**Purpose:** Define ...` / `**Purpose:** Fix ...` line of
the same six specs. Together those 12 hits are the run-in bold label
the YAML comment names as a known limitation. The 3 `: a` and 2 `: n`
hits are single capital letters inside a title or placeholder ("Claude
Code: A Highly Agentic Coding Assistant", "Review due: N items").

### Overlap with Google.Colons

The same JSON holds 66 `Google.Colons` alerts. Google's token is
`(?<=:\s)[A-Z]\w+` with lookbehinds for `Note:`, `Caution:`, `Warning:`
and `Success:`, `scope: sentence`, `level: warning`, and its `Match` is
the word alone, so no span is identical; comparing by file, line, and
Google's span falling inside the ai-tells span: 43 of the 52 ai-tells
hits have a matching Google.Colons alert. The 9 ai-tells hits with no
Google alert are `: Quarto`, `: Skilljar`, `: Vale`, `: Learn` (four
names in `.vale/styles/config/vocabularies/ai-training/accept.txt`,
which Google's rule honors because it has `nonword` off and the match
is the word itself) and `: A` (3) and `: N` (2), which are one letter
and fail Google's two-character `[A-Z]\w+`. 23 Google.Colons alerts
fall inside no ai-tells span: 18 are all-caps tokens (`LLM`, `CI`,
`MCP` twice, `DFS`, `CC` twice, `AI` three times, `MSO`, `MCQ`, `TF`,
`EP`, `M1`, `AGENTS`, `SECURITY`), 2 are mixed-case (`ReAct` twice), 2
are headings (`docs/plan/explore/09-brilliant-skills-map.md:1`,
`docs/spec/S02-topic-map.md:260`), and 1 is `Brilliant` at
`docs/plan/explore/09-brilliant-skills-map.md:207`, where the colon is
on the previous line and the word begins a continuation line. The
remaining one, `Run` at `docs/plan/explore/10-execute-program.md:88`,
follows a colon on the previous line as well.

## Examples

- `docs/spec/S01-dictionary.md:8` — "**Status:** Draft"
- `docs/spec/S04-progress-record.md:3` — "**Purpose:** Define the
  learner's progress record: what it stores, where it / lives, how it
  is versioned, and how it moves between browsers."
- `docs/spec/S01-dictionary.md:3` — "**Purpose:** Fix the words this
  project uses for its content, its knowledge / model, its interactions
  and its learners, so that pages, the sidebar, the"
- `docs/spec/S01-dictionary.md:13` — "It has two groups of material:
  **Foundations**, / written at one level for every knowledge worker,
  and **Engineering**, for"
- `docs/plan/explore/04-anthropic-academy.md:54` — "- Claude Partner
  Badge: Claude Code."
- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:94` (table
  cell) — "| 5 | Claude Code: A Highly Agentic Coding Assistant |
  Codebase comprehension, features, tests, refactoring, GitHub, hooks |
  USE, SWE, CUST |"
- `docs/spec/S02-topic-map.md:149` (table cell) — "| `DLAI-9` | MCP:
  Build Rich-Context AI Apps with Anthropic |"
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:33`
  (no Google.Colons alert; "Quarto" is in accept.txt) — "**Authoring and
  tooling** (`docs/spec/S02-project-toolchain.md`): Quarto `.qmd` /
  rendered via `mdd` (editable path dependency on `../mdd`) to reveal.js
  HTML and"
- `docs/plan/explore/03-cs50-pedagogy.md:26` — "Project specs have a
  fixed heading / shape: \*\*When to Do It / How to Get Help / Background
  / Getting Started / / Understanding / Specification / Hints / Testing
  / How to Submit /"
- `docs/plan/explore/04-anthropic-academy.md:69` — "Screen kinds:
  **Teaching**, **Checkpoint**, / **Watch Out**, **Exercise**,
  **Cumulative**, **Recap**, **Quiz**,"
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:41` — "4.
  Footer: Previous, "Screen 7 of 29", Contents, Next."
- `docs/prose/report-template.md:10` (the one agent-docs hit; no
  Google.Colons alert, "Vale" is in accept.txt) — "- The JSON: Vale's
  `--output=JSON`, a map of file path to a list of alerts."
- `docs/plan/explore/11-roadmap-sh.md:137` (picked at random) — "The
  Explain button is a menu: Explain the topic, / List the key points,
  Summarize the topic, Explain like I am five, Why is"
- `docs/spec/S05-spaced-review.md:69` (picked at random; table cell) —
  "| Course page | A "Review due: N items" card above the lesson graph
  when N > 0, leading to the review page for that course. Also a small
  count in the sidebar group header. |"
- `docs/plan/explore/10-execute-program.md:69` (picked at random) —
  "Some / lessons are titled **Quiz: ...** (for example "Quiz: Two
  Foreign Keys" in / SQL), which are code problems without teaching."

## Concentration

Top five files by hit count:

| file                                                       | hits |
| ---------------------------------------------------------- | ---: |
| `docs/plan/explore/04-anthropic-academy.md`                |    6 |
| `docs/plan/explore/11-roadmap-sh.md`                       |    5 |
| `docs/spec/S01-dictionary.md`                              |    5 |
| `docs/spec/S02-topic-map.md`                               |    5 |
| `docs/plan/explore/05-career-model-and-deeplearning-ai.md` |    3 |

Three more plan files (`06-lesson-inventory.md`,
`09-brilliant-skills-map.md`, `10-execute-program.md`) have 3 each. By
the line the hit sits on: 12 are the `**Purpose:**` / `**Status:**`
run-in bold labels at the top of the six specs, 10 are Markdown table
cells, 11 are list items, and 19 are running prose. No hits are in
headings (the scope excludes them) and none in lessons, `data`, or
repo-docs. The word after the colon is a product or course name in 14
hits (`Claude` three times, `Foundations` four, `Quarto`, `Skilljar`,
`Vale`, `Apache`, `Python`, `Roadmap`, `Learn`), the first word of a
capitalized UI label or screen kind in 13 (`Previous`, `Introduction`,
`Teaching`, `Getting`, `What`, `Explain`, `Multi`, `Basic`, `Course`,
`Digital`, `Part`, `Basics`, `General`), a capital letter inside a
quoted title or placeholder in 5 (`A`, `N`), and the first word of a
sentence or imperative after a label in the rest (`Draft`, `Define`,
`Fix`, `When`, `Framework`, `Advanced`, `Build`, `Two`, `Knowledge`,
`Name`).
