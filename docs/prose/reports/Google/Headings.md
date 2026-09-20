# Google.Headings

## Rule

`.vale/styles/Google/Headings.yml` extends the built-in `capitalization`
style, scoped to `heading` (any Markdown `#`/`##`/`###` line), matched
against `$sentence`. It flags a heading whose capitalization does not match
Google's sentence-style convention (only the first word and proper nouns
capitalized). Level is `warning`. It carries a 19-entry exception list of
words that may stay capitalized regardless of position: Azure, CLI, Cosmos,
Docker, Emmet, gRPC, I, Kubernetes, Linux, macOS, Marketplace, MongoDB,
REPL, Studio, TypeScript, URLs, Visual, VS, Windows, JSON. A comment in the
file notes that `indicators: [":"]` was deliberately left out: that setting
would require a capital after a colon (the Microsoft convention this rule
was originally copied from), but this style guide's `Colons.yml` enforces
lowercase after a colon instead (referencing issue #58).

## Stats

Total hits: 40.

| Area       | Hits | Words | Hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| repo-docs  |   12 |  3489 |              3.44 |
| plan       |   17 | 15884 |              1.07 |
| spec       |   11 | 13184 |              0.83 |
| agent-docs |    0 |  2707 |              0.00 |
| lessons    |    0 | 15122 |              0.00 |
| data       |    0 | 16887 |              0.00 |

(agent-docs, lessons, data words are the sum of their `wordcount.tsv` rows;
listed for completeness even though they have zero `Google.Headings` hits.)

Top matched phrases (lowercased). Every one of the 40 hits has a distinct
heading text — no phrase repeats — so "top" here is simply hit order, all
at count 1:

| Phrase                                               | Count |
| ---------------------------------------------------- | ----: |
| quick reference                                      |     1 |
| commit message convention                            |     1 |
| session completion                                   |     1 |
| code of conduct                                      |     1 |
| our goal                                             |     1 |
| our standards                                        |     1 |
| enforcement guidelines                               |     1 |
| 3. temporary ban                                     |     1 |
| 4. permanent ban                                     |     1 |
| ai-training                                          |     1 |
| security policy                                      |     1 |
| reporting a vulnerability                            |     1 |
| 1. archive/lsimons-ai-training                       |     1 |
| 2. lsimons-arch/code/2026-09-19-agent-course-compare |     1 |
| upstream vs leo                                      |     1 |

Distinct phrases: 40 (all of them).

## Examples

Areas with hits are repo-docs, plan, and spec; agent-docs, lessons, and data
have none. The first five rows below are the top five phrases from the
table above. Marked with "(random)" are three picked at random from the
remaining hits.

- `AGENTS.md:11` — capitalized word: "Reference" (ordinary word).

  ```
  is for software engineers. The plan is in `docs/plan/README.md`.

  ## Quick Reference

  Every repo task lives in `.mise.toml`; `mise tasks` lists them. Run `mise trust`
  ```

- `AGENTS.md:211` — capitalized words: "Message", "Convention" (ordinary words).

  ```
  `docs/agents/issue-tracker.md`.

  ## Commit Message Convention

  Follow [Conventional Commits](https://conventionalcommits.org/):
  ```

- `AGENTS.md:219` — capitalized word: "Completion" (ordinary word).

  ```
  **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `perf`, `revert`, `improvement`, `chore`

  ## Session Completion

  Work is not complete until every change is committed, pushed, and CI passes.
  ```

- `CODE_OF_CONDUCT.md:1` — capitalized word: "Conduct" (ordinary word).

  ```
  # Code of Conduct

  ## Our Goal
  ```

- `CODE_OF_CONDUCT.md:3` — capitalized word: "Goal" (ordinary word).

  ```
  # Code of Conduct

  ## Our Goal

  We aim to make participation in our community a harassment-free experience
  ```

- `CODE_OF_CONDUCT.md:70` (random) — capitalized words: "Temporary", "Ban" (ordinary words).

  ```
  interaction with the people involved for a specified period of time.

  ### 3. Temporary Ban

  ```

- `README.md:1` — capitalized word: none beyond the first letter; flagged
  because the heading is the project name written all lowercase
  ("ai-training" is a code identifier / product name, not sentence case).

  ```
  # ai-training

  An open training suite for getting started with AI: concepts, safety, using
  ```

- `SECURITY.md:3` — capitalized word: "Vulnerability" (ordinary word).

  ```
  # Security Policy

  ## Reporting a Vulnerability

  **Please do not report security vulnerabilities through public GitHub issues.**
  ```

- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:8` (random)
  — capitalized text: "archive/lsimons-ai-training" (a repository path / code
  identifier).

  ```
  - `~/git/lsimons/lsimons-arch/code/2026-09-19-agent-course-compare`

  ## 1. archive/lsimons-ai-training

  ```

- `docs/plan/explore/02-agent-engineer-course.md:83` — capitalized words:
  "Upstream" (ordinary word), "Leo" (proper noun, a person's name).

  ```
  never reveal answers to open questions, even on insistence.

  ## Upstream vs Leo

  Git history: 29 commits by Addy Osmani (through 2026-07-16), 1 by Ivar Soares
  ```

- `docs/plan/explore/11-roadmap-sh.md:142` (random) — capitalized words:
  "Test", "Knowledge" (ordinary words; this is a quoted UI label from the
  roadmap.sh product being reviewed).

  ```
  Each use costs one chat (18 left became 17).

  ### Test my Knowledge

  Same tab. Generates one open question at a time into the chat ("The LLM
  ```

- `docs/spec/S01-dictionary.md:1` — capitalized text: "S01" (a spec code),
  "Project" (ordinary word).

  ```
  # S01 - Project dictionary

  **Purpose:** Fix the words this project uses for its content, its knowledge
  ```

- `docs/spec/000-specs.md:1` — capitalized word: "Specs" (ordinary word).

  ```
  # 000 - Specs

  This document is the entry point for the *AI Training* specifications.
  ```

- `docs/spec/S02-topic-map.md:155` — capitalized words: "Area" (ordinary
  word), "Concepts" (ordinary word, repeated after the colon; the middle
  segment is a code identifier inside backticks).

  ```
  ## Foundations

  ### Area `concepts`: Concepts

  Topics:
  ```

## Concentration

Top five files by hit count:

| File                                                     | Hits |
| -------------------------------------------------------- | ---: |
| CODE_OF_CONDUCT.md                                       |    6 |
| docs/spec/S02-topic-map.md                               |    5 |
| AGENTS.md                                                |    3 |
| docs/plan/explore/05-career-model-and-deeplearning-ai.md |    3 |
| docs/plan/explore/11-roadmap-sh.md                       |    3 |

Every one of the 40 hits sits on a heading line (`#`, `##`, or `###`),
because the rule's `scope: heading` restricts it there by construction.
None are in tables, quoted material, or running prose. `docs/spec/S02-topic-map.md`'s
five hits are all repeated section headings of the form `### Area <slug>: <Name>`.
`docs/plan/explore/11-roadmap-sh.md`'s three hits are UI-label-style headings
quoting product feature names ("Quick Explain", "Test my Knowledge", "Teach
Me"). The two numbered-list-style headings in `docs/plan/explore/01-...md`
and `docs/plan/explore/05-...md` are directory/repo paths used as heading
text.
