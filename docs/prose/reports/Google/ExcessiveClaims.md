# Google.ExcessiveClaims

## Rule

`.vale/styles/Google/ExcessiveClaims.yml` extends `existence` at
`level: suggestion`, `ignorecase: true`. It has 4 tokens: `best(?! practices?)` (a negative lookahead so "best practices" is exempt, per a
comment calling that a fixed term rather than a superlative), `simplest`,
`fastest`, and `guarantees?`. A comment explains that the Google guide also
names `never`, `always`, and `ensure`, but those were excluded because in
technical writing they are usually legitimate instructions ("never commit
secrets") rather than product claims — they accounted for 125 of 142 hits on
a 950-file corpus.

## Stats

Total hits: 8.

| area      | hits | words | hits per 1,000 words |
| --------- | ---- | ----- | -------------------- |
| plan      | 5    | 15884 | 0.315                |
| repo-docs | 1    | 3489  | 0.287                |
| spec      | 1    | 13184 | 0.076                |
| lessons   | 1    | 12227 | 0.082                |

Top matched phrases (lowercase), 1 distinct phrase:

| phrase | count |
| ------ | ----- |
| best   | 8     |

## Examples

All 8 hits:

- CODE_OF_CONDUCT.md:21

  ```
    and learning from the experience
  - Focusing on what is best not just for us as individuals, but for the
    overall community
  ```

- docs/plan/README.md:42

  ```
  | ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `agent-engineer-course` (fork) | Apache-2.0                                      | Integrate the best content, with attribution to Addy Osmani, Ivar Soares Urdalen and Leo Simons in `NOTICE.md`.                                                                                                                                  |
  | `ai-cs50` (CS50 AI, workshops) | CC BY-NC-SA 4.0                                 | Ideas, structure and vocabulary with citation. Text may not be adapted into this BY-SA work; a page may be included verbatim, marked with its own license. Workshop talk transcripts are YouTube captions and not licensed; do not redistribute. |
  ```

- docs/plan/explore/03-cs50-pedagogy.md:14

  ```
  | --- | --------------------------------------------------------------------- | -------------------- |
  | 0   | Search: DFS, BFS, greedy best-first, A\*, minimax, alpha-beta         | Degrees, Tic-Tac-Toe |
  | 1   | Knowledge: propositional logic, inference, first-order logic          | Knights, Minesweeper |
  ```

- docs/plan/explore/04-anthropic-academy.md:93

  ```

  ## 3. Best course per topic

  ```

- docs/plan/explore/06-lesson-inventory.md:31

  ```
  | 09  | `09-evaluating-and-testing-agents.md` | Four quality pillars, metrics, trajectories, LLM-as-judge, eval harness               | 6.5k, 35 m | 1, 2, 6     | Engineer           | `eval-dashboard` (largest widget); ELI5; **eval-suite exercise** (3-5 h)                   |
  | 10  | `10-guardrails-and-safety.md`         | Why agent safety differs, defense layers, prompt injection, human-in-the-loop         | 6.4k, 35 m | **2**, 1, 6 | Both               | `pillars-viz` + `guardrails-viz`; safety checklist. Best KW safety material in either repo |

  ```

- docs/plan/explore/06-lesson-inventory.md:46

  ```
  | --- | ----------------------------- | ------------------------------------------------------------------------------ | ---------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
  | 15  | `15-agents-md.md`             | AGENTS.md contents, monorepo hierarchies, comparison, full example             | 2.6k, 15 m | 5, 4     | Engineer | `agents-md-builder` (genuine authoring tool, best widget to carry over); **try-it exercise** |
  | 16  | `16-mcp-deep-dive.md`         | MCP architecture, MCP vs CLI, security failure modes, server decisions         | 3.2k, 20 m | 5, 6, 2  | Engineer | `mcp-deep-viz` with token/cost comparator; decision tree                                     |
  ```

- docs/spec/S02-topic-map.md:201

  ```
  | `safety/verification`    | Verifying outputs        | checking habits, source checking, endorsed answers, "trust but verify" for agents                | failure-modes                           | new; `CS50` endorsed answers as an idea                       |
  | `safety/agent-risk`      | Agent risk               | blast radius, permissions and least privilege, human in the loop, prompt injection, exfiltration | concepts/what-is-an-agent, verification | `AEC-10`, the best knowledge-worker safety material available |
  | `safety/governance`      | Governance and oversight | policy, logging and audit, model change risk, escalation                                         | agent-risk                              | `AEC-10` defense layers; `AEC-11` engineer parts              |
  ```

- site/src/content/docs/concepts/how-models-work.mdx:126

  ```
  month. The model answers with a specific date, stated confidently, and it
  is wrong. Which failure mode is the best name for this?

  ```

## Concentration

- Top files by hits: `docs/plan/explore/06-lesson-inventory.md` (2); all
  others (`CODE_OF_CONDUCT.md`, `docs/plan/README.md`,
  `docs/plan/explore/03-cs50-pedagogy.md`,
  `docs/plan/explore/04-anthropic-academy.md`, `docs/spec/S02-topic-map.md`,
  `site/src/content/docs/concepts/how-models-work.mdx`) have 1 each.
- All 8 hits are "best". 5 sit in table cells (plan comparison table, CS50
  pedagogy table — as the compound term "greedy best-first", a
  search-algorithm name — lesson-inventory table twice, and topic-map
  table), 2 are in running prose (CODE_OF_CONDUCT.md, how-models-work.mdx),
  and 1 is in a heading ("Best course per topic").
