# Google.WordList

## Rule

`.vale/styles/Google/WordList.yml` extends `substitution` at
`level: warning`, with `ignorecase: false` (a comment in the file explains
this: each key's own capitalization is what is being corrected, so
case-insensitive matching would make a key match its own replacement; the
rest of the Google word list's casing rules live in a separate
`WordListCase.yml`). Its `swap` map has 18 entries, each a preferred term or
terms for a disallowed one, e.g. `CLI: command-line tool`, `Cloud: Google Cloud Platform|GCP`, `url: URL`, `World Wide Web: web`.

## Stats

Total hits: 9.

| area       | hits | words | hits per 1,000 words |
| ---------- | ---- | ----- | -------------------- |
| plan       | 4    | 15884 | 0.252                |
| spec       | 3    | 13184 | 0.228                |
| repo-docs  | 1    | 3489  | 0.287                |
| agent-docs | 1    | 2707  | 0.369                |

Top matched phrases (lowercase), 2 distinct phrases:

| phrase | count |
| ------ | ----- |
| cli    | 7     |
| cloud  | 2     |

## Examples

All 9 hits:

- AGENTS.md:49

  ```
  daemon keeps serving old content and old config, which looks like an edit
  "not taking". Manage it with the CLI, from `site/`:

  ```

- docs/agents/issue-tracker.md:5

  ```

  Use the `gh` CLI to read and write issues:
  ```

- docs/plan/explore/01-prior-sbp-training-and-course-compare.md:68

  ```
  - Osmani is uniquely strong on orchestration frameworks beyond Anthropic's
    stack (L18), A2A (L14), quantified MCP-vs-CLI (L16), the tool-design checklist
    (L3), an attack catalog with runnable guardrails (L10), and interactive
  ```

- docs/plan/explore/04-anthropic-academy.md:45 (two hits on this line, one
  for each occurrence of "Cloud")

  ```
  - Building with the Claude API (85 lessons). <https://academy.claude.com/courses/building-with-the-claude-api>
  - Cloud variants: Claude with Amazon Bedrock, Claude with Google Cloud's Vertex AI.
  - The AI-native SDLC playbook. <https://academy.claude.com/courses/ai-native-sdlc-playbook>
  ```

- docs/plan/explore/06-lesson-inventory.md:47

  ```
  | 15  | `15-agents-md.md`             | AGENTS.md contents, monorepo hierarchies, comparison, full example             | 2.6k, 15 m | 5, 4     | Engineer | `agents-md-builder` (genuine authoring tool, best widget to carry over); **try-it exercise** |
  | 16  | `16-mcp-deep-dive.md`         | MCP architecture, MCP vs CLI, security failure modes, server decisions         | 3.2k, 20 m | 5, 6, 2  | Engineer | `mcp-deep-viz` with token/cost comparator; decision tree                                     |
  | 17  | `17-agent-skills.md`          | Skills vs tools, spec, progressive disclosure, writing good skills             | 3.3k, 20 m | **5**, 6 | Engineer | `skill-loading-timeline`; embedded example skills                                            |
  ```

- docs/spec/S02-topic-map.md:137

  ```
  | `AEC-15` | AGENTS.md: contents, monorepo hierarchies, with a builder widget                              |
  | `AEC-16` | MCP deep dive: MCP versus CLI, security failure modes, token cost                             |
  | `AEC-17` | Agent skills: skills versus tools, the spec, progressive disclosure                           |
  ```

- docs/spec/S02-topic-map.md:319

  ```
  | `customizing-agents/skills`            | Agent skills                 | skill vs tool vs instruction, skill spec, progressive disclosure, writing a good skill                 | instructions                            | `AEC-17`; `DLAI-10`                           |
  | `customizing-agents/mcp`               | Connecting tools with MCP    | server, client, transport, MCP vs CLI, tool cost, MCP security                                         | instructions, concepts/what-is-an-agent | `AEC-14`, `AEC-16`; `DLAI-9`                  |
  | `customizing-agents/hooks-permissions` | Hooks, permissions, settings | permission modes, allowlists, hooks, subagents, settings layering                                      | instructions, safety/agent-risk         | new                                           |
  ```

- docs/spec/S02-topic-map.md:342

  ```
  | `writes-skill`          | `discloses-progressively`     | base   | Structures a skill so the agent loads only what it needs                  |
  | `connects-tools-safely` | `adds-a-tool`                 | base   | Adds a tool via MCP or CLI with least privilege                           |
  | `connects-tools-safely` | `weighs-tool-cost`            | base   | Explains the token and risk cost of a tool before adding it               |
  ```

## Concentration

- Top files by hits: `docs/spec/S02-topic-map.md` (3),
  `docs/plan/explore/04-anthropic-academy.md` (2), `AGENTS.md` (1),
  `docs/agents/issue-tracker.md` (1),
  `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` (1),
  `docs/plan/explore/06-lesson-inventory.md` (1).
- 7 of 9 hits are "CLI"; all but one of the CLI hits sit inside table cells
  (lesson-inventory and topic-map tables) or a heading-adjacent list line
  naming a technical term (MCP vs CLI, gh CLI); one is running prose (AGENTS.md).
  The 2 "Cloud" hits are both on a single running-prose line naming Google
  Cloud's Vertex AI as a product.
