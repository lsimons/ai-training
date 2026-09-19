# 002 - Topic map and competencies

**Purpose:** Name what the site teaches (topics and their concepts, per
area, with prerequisite links), name what a learner should be able to do
afterwards (competencies with levelled behaviours), and pick the release-1
thin slice. First pass of plan step 2, drawn from the lesson inventories in
[explore/06](../plan/explore/06-lesson-inventory.md) and the coverage gaps
noted there. Vocabulary per [spec 001](./001-dictionary.md).

**Status:** Draft, 2026-09-19. Revised the same day: the first draft
labelled subject clusters as competencies. They are now **topics**, and
competencies are a separate, smaller set of ability statements. Concept
definitions and full behaviour lists are still to write.

## Two tiers, kept apart

- **Topics** are what is taught: a noun, a cluster of two to six concepts
  inside an area, the unit a lesson covers. Topics carry the graph edges:
  `prerequisite` (learning order, the arrow in the map), `related`,
  `specialization`. Concepts inherit their topic's edges.
- **Competencies** are what the learner can do afterwards: a verb phrase
  with `base / expert / lead` behaviours. Each draws on one or more topics,
  possibly across areas. Learning objectives map to a competency at a level;
  checkpoints prove objectives. Foundations competencies are written to
  `base` only.
- A lesson's frontmatter names the topics it covers and the competency each
  objective serves. Paths are lists of lessons; goals are competency levels.
- Storage, "cheap tree, rich leaves" as in career-model: one YAML per topic
  under `docs/src/data/topics/<area>/<topic>.yaml` with `name`, `definition`,
  `concepts[] {id, name, definition}`, `links {prerequisites[], related[], specializations[]}`, `lessons[]`, `sources[]`; and one file per area under
  `docs/src/data/competencies/<area>.yaml` listing `{id, statement, topics[], behaviours {base[], expert[], lead[]}}`. The map page, one reference page
  per topic and one per competency render from these files; concept
  definitions render as a generated glossary.

## Foundations

### Area `concepts`: Concepts

Topics:

| Topic id                    | Name                     | Concepts                                                                                      | Prerequisites     | Existing material                           |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `concepts/how-models-work`  | How language models work | token, context window, training vs inference, model family and size, sampling and temperature | -                 | AEC 02 first half; DL.AI 2, 6 (inspiration) |
| `concepts/prompting`        | Prompting                | instruction, example (few-shot), role and system prompt, iteration, structured output         | how-models-work   | DL.AI 1, 3 (inspiration)                    |
| `concepts/limits`           | Capabilities and limits  | hallucination, knowledge cutoff, non-determinism, sycophancy, cost and latency                | how-models-work   | DL.AI 3 (sycophancy); new                   |
| `concepts/what-is-an-agent` | What an agent is         | model vs agent, tool, agent loop, degree of autonomy, harness                                 | prompting, limits | AEC 01 (KW-ready), DL.AI 11 M1              |
| `concepts/grounding`        | Grounding and memory     | retrieval (RAG), grounding, short- and long-term memory, context rot                          | what-is-an-agent  | AEC 05 (KW parts), AEC 08 intro             |

Competencies:

| Competency id                | Statement                                                      | Draws on topics                    | Base behaviour (draft)                                                                   |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `concepts/explains-models`   | Explains how a language model produces text and where it fails | how-models-work, limits, grounding | Explains tokens, context and sampling to a colleague; names three ways output goes wrong |
| `concepts/prompts-reliably`  | Writes prompts that get reliable results                       | prompting, how-models-work         | Turns a vague request into a prompt with instruction, context, example and format        |
| `concepts/recognises-agents` | Recognises an agent, its tools and its degree of autonomy      | what-is-an-agent, limits           | Tells a chat assistant from an agent; places a product on the autonomy scale             |

### Area `safety`: Safety

Topics:

| Topic id                 | Name                     | Concepts                                                                                         | Prerequisites                           | Existing material                      |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------- |
| `safety/responsible-use` | Responsible use          | data privacy, confidentiality, licensing and attribution, disclosure                             | concepts/limits                         | new; DL.AI 2 week 3 (inspiration)      |
| `safety/failure-modes`   | Recognising failure      | hallucination in practice, bias, overreliance, automation complacency                            | concepts/limits                         | new                                    |
| `safety/verification`    | Verifying outputs        | checking habits, source checking, endorsed answers, "trust but verify" for agents                | failure-modes                           | new; CS50 endorsed answers (idea)      |
| `safety/agent-risk`      | Agent risk               | blast radius, permissions and least privilege, human in the loop, prompt injection, exfiltration | concepts/what-is-an-agent, verification | AEC 10 (best KW safety material)       |
| `safety/governance`      | Governance and oversight | policy, logging and audit, model change risk, escalation                                         | agent-risk                              | AEC 10 layers, AEC 11 (engineer parts) |

Competencies:

| Competency id                | Statement                                          | Draws on topics             | Base behaviour (draft)                                                                 |
| ---------------------------- | -------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| `safety/handles-data-safely` | Uses AI safely with confidential and personal data | responsible-use             | Decides what may go into a prompt and what may not; discloses AI use where expected    |
| `safety/verifies-output`     | Verifies AI output before relying on it            | failure-modes, verification | Checks claims and sources on anything that leaves their desk; spots sycophancy         |
| `safety/judges-agent-risk`   | Judges the risk of letting an agent act            | agent-risk, governance      | Names the blast radius of an agent action and chooses when a human must be in the loop |

### Area `using-agents`: Using agents

Topics:

| Topic id                      | Name                      | Concepts                                                                                | Prerequisites                                  | Existing material               |
| ----------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `using-agents/assistant-work` | Working with an assistant | finding information, thought partner, drafting, critique, working with files and images | concepts/prompting                             | DL.AI 3 (inspiration)           |
| `using-agents/delegating`     | Delegating to an agent    | task brief, giving context, choosing a degree of autonomy, checking results             | concepts/what-is-an-agent, safety/verification | new; DL.AI 11 M1, Ng skills map |
| `using-agents/decomposition`  | Decomposing work          | task decomposition, iteration, when to stop and do it yourself                          | delegating                                     | DL.AI 11 M1 (inspiration)       |
| `using-agents/choosing-tools` | Choosing models and tools | model fit, cost and speed, chat vs agent vs automation, what to keep human              | delegating, concepts/limits                    | AEC 12 chooser (public rewrite) |

Competencies:

| Competency id                            | Statement                                           | Draws on topics                           | Base behaviour (draft)                                                               |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `using-agents/delegates-and-checks`      | Delegates a task to an agent and checks the result  | delegating, decomposition, assistant-work | Writes a brief with goal, context and done-criteria; reviews the result against them |
| `using-agents/chooses-tool-and-autonomy` | Chooses the right tool and autonomy level for a job | choosing-tools, delegating                | Picks chat, agent or automation for a given task and says why; keeps the human steps |

## Engineering

### Area `coding-with-agents`: Coding with agents

Topics:

| Topic id                           | Name                         | Concepts                                                                                  | Prerequisites                | Existing material                               |
| ---------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- |
| `coding-with-agents/first-session` | Running a coding agent       | install and setup, codebase understanding, first change, permissions, session and context | using-agents/delegating      | AEC 12 (rewrite), DL.AI 5 (inspiration)         |
| `coding-with-agents/workflow`      | Plan, implement, verify      | plan mode, spec-driven change, test-driven change, reviewing the diff, commits and PRs    | first-session                | new; DL.AI 5, 6 (inspiration)                   |
| `coding-with-agents/context`       | Context engineering for code | project instructions, scoping a task, referencing files, avoiding context rot             | workflow, concepts/grounding | AEC 15 (crosses to customizing)                 |
| `coding-with-agents/quality`       | Quality with agents          | testing, debugging, documentation, dependency hygiene, security review of agent output    | workflow, safety/agent-risk  | DL.AI 7 (inspiration); new                      |
| `coding-with-agents/team`          | Agents in a team             | parallel sessions, worktrees, CI integration, hooks, review norms, attribution            | quality                      | DL.AI 5 (inspiration); this repo's own practice |

Competencies:

| Competency id                          | Statement                                                             | Draws on topics                  | Base behaviour (draft)                                                                    |
| -------------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `coding-with-agents/ships-with-agent`  | Ships a change with a coding agent through plan, implement and verify | first-session, workflow, context | Lands a small change end to end with an agent, reviewing the diff before commit           |
| `coding-with-agents/keeps-quality-bar` | Keeps agent-written code to the team's quality bar                    | quality, safety/agent-risk       | Runs tests and review on agent output as on their own; rejects what does not meet the bar |
| `coding-with-agents/works-in-team`     | Works with agents alongside a team                                    | team, workflow                   | Attributes agent work honestly; follows the team's review and CI norms for agent changes  |

### Area `customizing-agents`: Customizing agents

Topics:

| Topic id                               | Name                         | Concepts                                                                               | Prerequisites                           | Existing material                 |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| `customizing-agents/instructions`      | Project instructions         | AGENTS.md / CLAUDE.md, sections, monorepo hierarchy, when instructions are not enough  | coding-with-agents/context              | AEC 15 (builder widget, exercise) |
| `customizing-agents/skills`            | Agent skills                 | skill vs tool vs instruction, skill spec, progressive disclosure, writing a good skill | instructions                            | AEC 17; DL.AI 10 (inspiration)    |
| `customizing-agents/mcp`               | Connecting tools with MCP    | server, client, transport, MCP vs CLI, tool cost, MCP security                         | instructions, concepts/what-is-an-agent | AEC 14, 16; DL.AI 9 (inspiration) |
| `customizing-agents/hooks-permissions` | Hooks, permissions, settings | permission modes, allowlists, hooks, subagents, settings layering                      | instructions, safety/agent-risk         | new                               |
| `customizing-agents/memory`            | Memory and session context   | auto-memory, context files, compaction, session handoff                                | skills, concepts/grounding              | AEC 05 (engineer parts)           |

Competencies:

| Competency id                              | Statement                                  | Draws on topics                           | Base behaviour (draft)                                                                   |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `customizing-agents/configures-agent`      | Configures an agent for a project          | instructions, hooks-permissions, memory   | Writes project instructions that remove a recurring agent mistake; sets sane permissions |
| `customizing-agents/writes-skill`          | Writes a reusable agent skill              | skills, instructions                      | Packages a repeatable procedure as a skill that another person's agent can use           |
| `customizing-agents/connects-tools-safely` | Connects an agent to tools and data safely | mcp, hooks-permissions, safety/agent-risk | Adds a tool via MCP or CLI with least privilege and explains the cost and risk trade-off |

### Area `building-agents`: Building agents

Topics:

| Topic id                           | Name                          | Concepts                                                                                          | Prerequisites                                         | Existing material             |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `building-agents/tool-use`         | Tool use                      | function calling, tool schema design, N x M integration problem, error handling, parallel calls   | concepts/what-is-an-agent                             | AEC 03                        |
| `building-agents/agent-loop`       | The agent loop and harness    | loop from scratch, Agent SDK, stop conditions, unbounded-loop pitfalls                            | tool-use                                              | AEC 13 (most exercise-shaped) |
| `building-agents/patterns`         | Design patterns               | ReAct, reflection, planning, plan-then-execute vs reactive, hierarchical planning                 | agent-loop                                            | AEC 04, 06; DL.AI 11 M2, M5   |
| `building-agents/orchestration`    | Orchestration and multi-agent | code- vs model-driven orchestration, sequential / hierarchical / collaborative, orchestration tax | patterns                                              | AEC 07, 18                    |
| `building-agents/retrieval-memory` | Agentic retrieval and memory  | agentic RAG loop, memory storage choices, when basic RAG suffices                                 | agent-loop, concepts/grounding                        | AEC 05, 08                    |
| `building-agents/evaluation`       | Evaluation and testing        | quality pillars, trajectory evaluation, LLM as judge, golden sets, error analysis, observability  | agent-loop                                            | AEC 09; DL.AI 11 M4           |
| `building-agents/production`       | Guardrails and production     | defence layers, eval-gated deploys, rollout strategies, cost, protocols (MCP, A2A)                | evaluation, safety/governance, customizing-agents/mcp | AEC 10, 11, 14                |

Competencies:

| Competency id                         | Statement                                    | Draws on topics                                       | Base behaviour (draft)                                                                |
| ------------------------------------- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `building-agents/builds-agent-loop`   | Builds a tool-using agent loop               | tool-use, agent-loop, retrieval-memory                | Implements a loop with two tools, error handling and a stop condition from a bare SDK |
| `building-agents/evaluates-agents`    | Evaluates an agent's quality systematically  | evaluation                                            | Writes a small golden set and grades trajectories, not just final answers             |
| `building-agents/orchestrates-agents` | Designs and orchestrates multi-agent systems | patterns, orchestration                               | Chooses a pattern for a given task and justifies the orchestration cost               |
| `building-agents/runs-in-production`  | Runs an agent in production with guardrails  | production, safety/governance, customizing-agents/mcp | Gates a deploy on evals; layers policy, filtering and monitoring around the agent     |

## Cross-area edges worth drawing

- `safety/agent-risk` is a prerequisite topic for `coding-with-agents/quality`
  and `customizing-agents/hooks-permissions`; safety is not a track of its
  own after Foundations, it is a gate into Engineering.
- `concepts/what-is-an-agent` is the hub: five topics depend on it. It is
  the anchor for the map's first visual.
- `coding-with-agents/context` and `customizing-agents/instructions` are
  `related`, taught from the user side and the author side respectively.
- `building-agents/evaluation` should come before `patterns` and
  `orchestration` in any path (Ng's ordering), even though it is not a hard
  prerequisite.
- Several competencies draw on topics from two areas
  (`keeps-quality-bar`, `connects-tools-safely`, `runs-in-production`). That
  is expected; competencies are not confined to their area's topics.

## Paths (first cut)

| Path               | Audience                  | Lessons                                                                                             | Goal                                                 |
| ------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `knowledge-worker` | Everyone                  | all of Foundations, in area order                                                                   | all Foundations competencies at `base`               |
| `engineer`         | Software engineers        | Foundations, then coding-with-agents, then customizing-agents                                       | `ships-with-agent` and `configures-agent` at `base`  |
| `agent-builder`    | Engineers building agents | Foundations (agent and safety parts), building-agents/tool-use through evaluation, then customizing | `builds-agent-loop` and `evaluates-agents` at `base` |

## Release-1 thin slice

One lesson per area, chosen so the shape is visible end to end and each
lesson exercises a different interaction type.

| Area               | Lesson (working title)                 | Mode        | Covers topic                     | Serves competency                   | Basis                                     | Interaction to prove      |
| ------------------ | -------------------------------------- | ----------- | -------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------- |
| concepts           | How a language model works             | explanation | concepts/how-models-work         | concepts/explains-models            | new, AEC 02 first half                    | `choice`, widget          |
| safety             | Why agent safety is different          | explanation | safety/agent-risk                | safety/judges-agent-risk            | AEC 10 first half, rewritten for everyone | `scenario`, pitfall       |
| using-agents       | Delegating a task to an agent          | tutorial    | using-agents/delegating          | using-agents/delegates-and-checks   | new; a real delegation in a sandbox       | `sort` (autonomy levels)  |
| coding-with-agents | Your first session with a coding agent | tutorial    | coding-with-agents/first-session | coding-with-agents/ships-with-agent | AEC 12 public rewrite; fixture repository | `exercise` + `self-grade` |
| customizing-agents | Project instructions: AGENTS.md        | tutorial    | customizing-agents/instructions  | customizing-agents/configures-agent | AEC 15 with the builder widget            | `repair`, widget          |
| building-agents    | Building your first agent              | tutorial    | building-agents/agent-loop       | building-agents/builds-agent-loop   | AEC 13                                    | `order`, `exercise`       |

Each slice lesson gets learning objectives in frontmatter, one pitfall,
one checkpoint per objective and a recap. The four Engineering lessons get a
`less` and a `more` comfortable exercise. Tutorial-mode lessons run in a
resettable fixture. The sidebar shows only these six areas' real lessons; no
stub pages. Tutor mode is tested against these six.

## Open questions

- Whether `concepts/grounding` belongs in Foundations or moves to Engineering
  as a `building-agents` topic only. Leaning: keep a short version in
  Foundations because knowledge workers meet RAG-based products daily.
- Whether `safety/governance` is worth a Foundations lesson or only a
  `lead`-level behaviour of `judges-agent-risk`. Leaning: one short lesson.
- Naming of `hooks-permissions`; it is Claude Code specific where the rest
  is not. Decide when writing the lesson.
- Whether `expert` and `lead` behaviours are worth writing for Foundations
  competencies at all, or whether Foundations stops at `base` by design.
