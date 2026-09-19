# 002 - Topic map

**Purpose:** Name the competencies and concepts the site teaches, per area,
with prerequisite links, and pick the release-1 thin slice. This is the
first pass of plan step 2, drawn from the lesson inventories in
[explore/06](../plan/explore/06-lesson-inventory.md) and the coverage gaps
noted there. Vocabulary per [spec 001](./001-dictionary.md).

**Status:** Draft, 2026-09-19. Competency behaviours and per-concept
definitions are not written yet; this fixes the node set and the edges.

## Shape

- Six areas in two groups. Each area owns three to seven competencies. Each
  competency groups two to six concepts.
- Edges are between competencies: `prerequisite` (arrow in the map),
  `related`, `specialization`. Concepts inherit their competency's edges.
- Levels `base / expert / lead` are behaviours inside a competency, not
  nodes. Foundations competencies are written to `base` only.
- Storage: one YAML file per competency under `docs/src/data/topics/<area>/`,
  "cheap tree, rich leaves" as in career-model. Fields: `name`, `definition`,
  `concepts[] {id, name, definition}`, `behaviours {base[], expert[], lead[]}`,
  `links {prerequisites[], related[], specializations[]}`, `lessons[]`,
  `sources[]`. The map page and one reference page per competency render
  from these files, structured like the tree; concept definitions render as
  a generated glossary. Lessons reference competency ids in frontmatter.

## Foundations

### Area `concepts`: Concepts

| Competency id               | Name                     | Concepts                                                                                      | Prerequisites     | Existing material                           |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `concepts/how-models-work`  | How language models work | token, context window, training vs inference, model family and size, sampling and temperature | -                 | AEC 02 first half; DL.AI 2, 6 (inspiration) |
| `concepts/prompting`        | Prompting                | instruction, example (few-shot), role and system prompt, iteration, structured output         | how-models-work   | DL.AI 1, 3 (inspiration)                    |
| `concepts/limits`           | Capabilities and limits  | hallucination, knowledge cutoff, non-determinism, sycophancy, cost and latency                | how-models-work   | DL.AI 3 (sycophancy); new                   |
| `concepts/what-is-an-agent` | What an agent is         | model vs agent, tool, agent loop, degree of autonomy, harness                                 | prompting, limits | AEC 01 (KW-ready), DL.AI 11 M1              |
| `concepts/grounding`        | Grounding and memory     | retrieval (RAG), grounding, short- and long-term memory, context rot                          | what-is-an-agent  | AEC 05 (KW parts), AEC 08 intro             |

### Area `safety`: Safety

| Competency id            | Name                     | Concepts                                                                                         | Prerequisites                           | Existing material                      |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------- |
| `safety/responsible-use` | Responsible use          | data privacy, confidentiality, licensing and attribution, disclosure                             | concepts/limits                         | new; DL.AI 2 week 3 (inspiration)      |
| `safety/failure-modes`   | Recognising failure      | hallucination in practice, bias, overreliance, automation complacency                            | concepts/limits                         | new                                    |
| `safety/verification`    | Verifying outputs        | checking habits, source checking, endorsed answers, "trust but verify" for agents                | failure-modes                           | new; CS50 endorsed answers (idea)      |
| `safety/agent-risk`      | Agent risk               | blast radius, permissions and least privilege, human in the loop, prompt injection, exfiltration | concepts/what-is-an-agent, verification | AEC 10 (best KW safety material)       |
| `safety/governance`      | Governance and oversight | policy, logging and audit, model change risk, escalation                                         | agent-risk                              | AEC 10 layers, AEC 11 (engineer parts) |

### Area `using-agents`: Using agents

| Competency id                 | Name                      | Concepts                                                                                | Prerequisites                                  | Existing material               |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `using-agents/assistant-work` | Working with an assistant | finding information, thought partner, drafting, critique, working with files and images | concepts/prompting                             | DL.AI 3 (inspiration)           |
| `using-agents/delegating`     | Delegating to an agent    | task brief, giving context, choosing a degree of autonomy, checking results             | concepts/what-is-an-agent, safety/verification | new; DL.AI 11 M1, Ng skills map |
| `using-agents/decomposition`  | Decomposing work          | task decomposition, iteration, when to stop and do it yourself                          | delegating                                     | DL.AI 11 M1 (inspiration)       |
| `using-agents/choosing-tools` | Choosing models and tools | model fit, cost and speed, chat vs agent vs automation, what to keep human              | delegating, concepts/limits                    | AEC 12 chooser (public rewrite) |

## Engineering

### Area `coding-with-agents`: Coding with agents

| Competency id                      | Name                         | Concepts                                                                                  | Prerequisites                | Existing material                               |
| ---------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- |
| `coding-with-agents/first-session` | Running a coding agent       | install and setup, codebase understanding, first change, permissions, session and context | using-agents/delegating      | AEC 12 (rewrite), DL.AI 5 (inspiration)         |
| `coding-with-agents/workflow`      | Plan, implement, verify      | plan mode, spec-driven change, test-driven change, reviewing the diff, commits and PRs    | first-session                | new; DL.AI 5, 6 (inspiration)                   |
| `coding-with-agents/context`       | Context engineering for code | project instructions, scoping a task, referencing files, avoiding context rot             | workflow, concepts/grounding | AEC 15 (crosses to customizing)                 |
| `coding-with-agents/quality`       | Quality with agents          | testing, debugging, documentation, dependency hygiene, security review of agent output    | workflow, safety/agent-risk  | DL.AI 7 (inspiration); new                      |
| `coding-with-agents/team`          | Agents in a team             | parallel sessions, worktrees, CI integration, hooks, review norms, attribution            | quality                      | DL.AI 5 (inspiration); this repo's own practice |

### Area `customizing-agents`: Customizing agents

| Competency id                          | Name                         | Concepts                                                                               | Prerequisites                           | Existing material                 |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| `customizing-agents/instructions`      | Project instructions         | AGENTS.md / CLAUDE.md, sections, monorepo hierarchy, when instructions are not enough  | coding-with-agents/context              | AEC 15 (builder widget, exercise) |
| `customizing-agents/skills`            | Agent skills                 | skill vs tool vs instruction, skill spec, progressive disclosure, writing a good skill | instructions                            | AEC 17; DL.AI 10 (inspiration)    |
| `customizing-agents/mcp`               | Connecting tools with MCP    | server, client, transport, MCP vs CLI, tool cost, MCP security                         | instructions, concepts/what-is-an-agent | AEC 14, 16; DL.AI 9 (inspiration) |
| `customizing-agents/hooks-permissions` | Hooks, permissions, settings | permission modes, allowlists, hooks, subagents, settings layering                      | instructions, safety/agent-risk         | new                               |
| `customizing-agents/memory`            | Memory and session context   | auto-memory, context files, compaction, session handoff                                | skills, concepts/grounding              | AEC 05 (engineer parts)           |

### Area `building-agents`: Building agents

| Competency id                      | Name                          | Concepts                                                                                          | Prerequisites                                         | Existing material             |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `building-agents/tool-use`         | Tool use                      | function calling, tool schema design, N x M integration problem, error handling, parallel calls   | concepts/what-is-an-agent                             | AEC 03                        |
| `building-agents/agent-loop`       | The agent loop and harness    | loop from scratch, Agent SDK, stop conditions, unbounded-loop pitfalls                            | tool-use                                              | AEC 13 (most exercise-shaped) |
| `building-agents/patterns`         | Design patterns               | ReAct, reflection, planning, plan-then-execute vs reactive, hierarchical planning                 | agent-loop                                            | AEC 04, 06; DL.AI 11 M2, M5   |
| `building-agents/orchestration`    | Orchestration and multi-agent | code- vs model-driven orchestration, sequential / hierarchical / collaborative, orchestration tax | patterns                                              | AEC 07, 18                    |
| `building-agents/retrieval-memory` | Agentic retrieval and memory  | agentic RAG loop, memory storage choices, when basic RAG suffices                                 | agent-loop, concepts/grounding                        | AEC 05, 08                    |
| `building-agents/evaluation`       | Evaluation and testing        | quality pillars, trajectory evaluation, LLM as judge, golden sets, error analysis, observability  | agent-loop                                            | AEC 09; DL.AI 11 M4           |
| `building-agents/production`       | Guardrails and production     | defence layers, eval-gated deploys, rollout strategies, cost, protocols (MCP, A2A)                | evaluation, safety/governance, customizing-agents/mcp | AEC 10, 11, 14                |

## Cross-area edges worth drawing

- `safety/agent-risk` is a prerequisite for both `coding-with-agents/quality`
  and `customizing-agents/hooks-permissions`; safety is not a track of its
  own after Foundations, it is a gate into Engineering.
- `concepts/what-is-an-agent` is the hub: five competencies depend on it.
  It is the anchor concept for the map's first visual.
- `coding-with-agents/context` and `customizing-agents/instructions` are
  `related`, taught from the user side and the author side respectively.
- `building-agents/evaluation` should come before `patterns` and
  `orchestration` in any path (Ng's ordering), even though it is not a hard
  prerequisite.

## Paths (first cut)

| Path               | Audience                  | Lessons                                                                                             |
| ------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| `knowledge-worker` | Everyone                  | all of Foundations, in area order                                                                   |
| `engineer`         | Software engineers        | Foundations, then coding-with-agents, then customizing-agents                                       |
| `agent-builder`    | Engineers building agents | Foundations (agent and safety parts), building-agents/tool-use through evaluation, then customizing |

## Release-1 thin slice

One lesson per area, chosen so the shape is visible end to end and each
lesson exercises a different interaction type.

| Area               | Lesson (working title)                 | Mode        | Competency                       | Basis                                     | Interaction to prove      |
| ------------------ | -------------------------------------- | ----------- | -------------------------------- | ----------------------------------------- | ------------------------- |
| concepts           | How a language model works             | explanation | concepts/how-models-work         | new, AEC 02 first half                    | `choice`, widget          |
| safety             | Why agent safety is different          | explanation | safety/agent-risk                | AEC 10 first half, rewritten for everyone | `scenario`, watch-out     |
| using-agents       | Delegating a task to an agent          | tutorial    | using-agents/delegating          | new; a real delegation in a sandbox       | `sort` (autonomy levels)  |
| coding-with-agents | Your first session with a coding agent | tutorial    | coding-with-agents/first-session | AEC 12 public rewrite; fixture repository | `exercise` + `self-grade` |
| customizing-agents | Project instructions: AGENTS.md        | tutorial    | customizing-agents/instructions  | AEC 15 with the builder widget            | `repair`, widget          |
| building-agents    | Building your first agent              | tutorial    | building-agents/agent-loop       | AEC 13                                    | `order`, `exercise`       |

Each slice lesson gets learning objectives in frontmatter, one watch-out,
one checkpoint per objective and a recap. The four Engineering lessons get a
`less` and a `more` comfortable exercise. Tutorial-mode lessons run in a
resettable fixture. The sidebar shows only these six areas' real lessons; no
stub pages. Tutor mode is tested against these six.

## Open questions

- Whether `concepts/grounding` belongs in Foundations or moves to Engineering
  as a `building-agents` concept only. Leaning: keep a short version in
  Foundations because knowledge workers meet RAG-based products daily.
- Whether `safety/governance` is worth a Foundations lesson or only a
  `lead`-level behaviour. Leaning: one short lesson.
- Naming of `hooks-permissions`; it is Claude Code specific where the rest
  is not. Decide when writing the lesson.
