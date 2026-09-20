# write-good.Weasel

## Rule

`.vale/styles/write-good/Weasel.yml` extends Vale's built-in `existence`
check against a fixed word list (23 tokens: `clearly`, `completely`,
`exceedingly`, `excellent`, `extremely`, `fairly`, `huge`,
`interestingly`, `is a number`, `largely`, `mostly`, `obviously`,
`quite`, `relatively`, `remarkably`, `several`, `significantly`,
`substantially`, `surprisingly`, `tiny`, `usually`, `various`, `vast`,
`very`), matched case-insensitively (`ignorecase: true`). It is shipped
at `level: warning` (advisory; does not fail `mise run prose` on its own,
since only `error`-level rules gate the build per the project's Vale
config). Each hit's message is `'<word>' is a weasel word!`.

## Stats

Total hits: **20**.

| area       | hits | words  | hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| plan       | 9    | 15,885 | 0.567             |
| lessons    | 8    | 12,232 | 0.654             |
| spec       | 3    | 13,187 | 0.228             |
| agent-docs | 0    | 1,627  | 0.000             |
| repo-docs  | 0    | 4,900  | 0.000             |
| data       | 0    | 18,534 | 0.000             |

Top matched phrases (lowercased), 6 distinct phrases total, all shown:

| phrase     | count |
| ---------- | ----- |
| several    | 7     |
| usually    | 5     |
| mostly     | 3     |
| very       | 2     |
| completely | 2     |
| largely    | 1     |

## Examples

All 20 hits, in file order. Every area with hits (plan, lessons, spec) is
represented; the top five phrases (`several`, `usually`, `mostly`, `very`,
`completely`) each appear at least once. Three picked at random from the
rest of the set (chosen by shuffling the remaining 15 and taking the
first three): `docs/plan/explore/11-roadmap-sh.md:165`,
`site/src/content/docs/concepts/how-models-work.mdx:144`, and
`docs/spec/S02-topic-map.md:502`.

- `docs/plan/explore/02-agent-engineer-course.md:93` — "...Lesson prose
  structure and the widgets are largely upstream Addy content, edited
  throughout by Leo. Attribution is in `README.md` ("Origins"),
  `AGENTS.md`, and `index.mdx` ("About this course")."
- `docs/plan/explore/03-cs50-pedagogy.md:82` — "Research findings: 300k+
  students, about 21k prompts/day (2025). Survey: about 47% "very
  helpful", 26% "helpful". Questions asked of TFs fell from..."
- `docs/plan/explore/06-lesson-inventory.md:116` — table row: "| 9 | MCP:
  Build Rich-Context AI Apps | intermediate, 2h | Why MCP through remote
  deployment; very hands-on | 5, 6 | Engineer |"
- `docs/plan/explore/06-lesson-inventory.md:130` — "...front end. 2. Every
  DL.AI module ends in a quiz and usually a lab. This is the biggest gap
  against the plan's checkpoint/quiz model."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:55` — table
  row: "| Quiz | 9 | End-of-module MCQ set (associate track mostly) |"
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:90` — "...
  `[{label, correct, rationale}]`; rationale per option. 02. **Radio MCQ
  groups** (2 pkgs) for several questions on one screen. 03. **End-of-
  module quiz** (10 pkgs), all questions at once, pass = all correct."
- `docs/plan/explore/11-roadmap-sh.md:165` — "...prompt). Free tier then
  allows five lesson bodies. Lesson pages are generated on open in about
  40 seconds and are substantial: several H2 sections, code blocks, a
  comparison table, a **Remember** callout, a..."
- `docs/plan/explore/12-learn-prompting.md:33` — "...courses, HackAPrompt
  and the Prompt Report survey; the README on `main` is mostly
  marketing."
- `docs/plan/explore/12-learn-prompting.md:39` — "...Prompting (5
  community walkthroughs), Advanced Applications (MRKL, PAL, ReAct),
  Reliability (5), Prompt Hacking (4), Images (7), Tooling (22, mostly
  one-paragraph reviews of 2022 prompt IDEs), Trainable (2),
  Miscellaneous..."
- `docs/spec/000-specs.md:7` — "...teaches, how lessons are written, how
  learning is recorded and reviewed, and what ships. Each spec reads
  completely on its own."
- `docs/spec/S02-topic-map.md:308` — table row: "| `works-in-team` |
  `runs-parallel-work` | expert | Runs several agent sessions without
  losing coherence |"
- `docs/spec/S02-topic-map.md:502` — "Several competencies draw on topics
  from two areas. That is expected; competencies are not confined to
  their area's topics."
- `site/src/content/docs/coding-with-agents/first-session.mdx:34` —
  "...tools a programmer has: it reads files, edits them, and runs
  commands. Claude Code is one example; there are several others, and
  this lesson uses none of their specific features. Wherever it says
  "your coding agent", use the one..."
- `site/src/content/docs/coding-with-agents/first-session.mdx:138` —
  "...commands, the limits are which files it may touch, and the done-
  criterion is usually a test."
- `site/src/content/docs/concepts/how-models-work.mdx:30` — "A model
  never sees letters or words. Its input is cut into **tokens**, short
  chunks of text that are usually a word, part of a word or a
  punctuation mark. "Unbelievable" might be three tokens; "the" is
  one. Each token has a..."
- `site/src/content/docs/concepts/how-models-work.mdx:144` — "1. Input is
  tokens, not words; that alone explains several odd weaknesses. 2.
  Output is one token at a time, sampled from a distribution the
  model..."
- `site/src/content/docs/customizing-agents/instructions.mdx:184` — "A
  repository with several projects in it needs more than one file, and
  the tools handle this the same way: the agent always reads the file
  at the..."
- `site/src/content/docs/customizing-agents/instructions.mdx:210` — "An
  instruction is a request. The agent reads it, usually follows it, and
  sometimes does not, particularly late in a long session when the file
  has..."
- `site/src/content/docs/safety/agent-risk.mdx:130` — "**Can it be
  undone?** Drafting is reversible; sending is not. Renaming a file is
  reversible; deleting it is usually not. Reading is reversible;
  posting is not. Approve before the irreversible step, not before
  the..."
- `site/src/content/docs/safety/agent-risk.mdx:219` — "...are not three
  separate lessons; they are one habit, and prompt injection is the
  reason you need it even when you trust the agent completely. You may
  trust the agent. You cannot trust everything the agent will read."

## Concentration

Ten files carry hits; eight of them tie for the most, at 2 hits each
(no single file dominates). Top five by count (ties broken by file path
order):

| file                                                       | hits |
| ---------------------------------------------------------- | ---- |
| docs/plan/explore/06-lesson-inventory.md                   | 2    |
| docs/plan/explore/07-scorm-interactions-and-duck-tutor.md  | 2    |
| docs/plan/explore/12-learn-prompting.md                    | 2    |
| docs/spec/S02-topic-map.md                                 | 2    |
| site/src/content/docs/coding-with-agents/first-session.mdx | 2    |

(Also tied at 2: `site/src/content/docs/concepts/how-models-work.mdx`,
`site/src/content/docs/customizing-agents/instructions.mdx`,
`site/src/content/docs/safety/agent-risk.mdx`. The remaining four files
each carry 1 hit.)

Of the 20 hits, 3 fall inside Markdown table cells
(`docs/plan/explore/06-lesson-inventory.md:116`,
`docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:55`,
`docs/spec/S02-topic-map.md:308`). The other 17 sit in running prose
(paragraph or numbered-list text); none fall in headings, quoted
material, or code-adjacent text.
