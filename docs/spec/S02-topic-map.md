# S02 - Topic map and competencies

**Purpose:** Name what the site teaches (topics and their concepts, per area,
with prerequisite links), name what a learner should be able to do afterwards
(competencies, their learning objectives and behaviours), say how the map
differentiates between learners, and pick the release-1 thin slice.

**Status:** Draft

## Introduction

Vocabulary is per the [project dictionary](S01-dictionary.md). In short:
**topics** and **concepts** are what is taught and form the map; **competencies**,
**learning objectives** and **behaviours** are what a learner can do afterwards
and point into the map; **lessons** cover topics and serve objectives.

The shape borrows from four places:

| Source                                 | What this spec takes                                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A competency-map project of the author | "Cheap tree, rich leaves": a folder tree for structure and one data file per leaf; typed links `prerequisite`, `related`, `specialization`; three levels as structured criteria, not prose.  |
| Brilliant's coding skills map          | Four levels of noun-phrase big idea, verb-phrase objective and one-sentence claim with why and example; an alignment layer to external frameworks; differentiation by position in one graph. |
| Execute Program                        | The course page as a graph of lessons drawn in levels with dotted prerequisite edges, with a completion ring and an About panel beside it.                                                   |
| roadmap.sh                             | Node status written back onto the map as styling; a milestone bar above the map; one deep-linkable page per node that opens in a drawer without leaving the map.                             |

Deliberately not taken: Brilliant's short codes (slugs stay the only
identifiers), Execute Program's locked levels (paths are advisory) and
roadmap.sh's drawing-as-map with no prerequisite semantics (edges here are
data).

## Shape

### What is taught and what is learned

| Tier                   | Register     | Owns                             | Carries                                                                             |
| ---------------------- | ------------ | -------------------------------- | ----------------------------------------------------------------------------------- |
| **Topic**              | noun         | two to six concepts              | The graph edges: `prerequisite` (the arrow in the map), `related`, `specialization` |
| **Concept**            | noun         | one paragraph definition         | Inherits its topic's edges; has a glossary anchor                                   |
| **Competency**         | verb phrase  | three to six learning objectives | The topics it draws on, possibly across areas; its alignment rows                   |
| **Learning objective** | verb phrase  | two to six behaviours; one level | What lessons serve and assume, what checkpoints prove                               |
| **Behaviour**          | claim triple | -                                | What one checkpoint question or tutor question tests                                |

### Lesson frontmatter

A lesson names, by id, the topics it **covers**, the objectives it
**serves**, the objectives it **assumes** (each pointing at the lesson
section that teaches it) and the lessons, topics or shorts it **extends
to**. Paths are lists of lesson ids; goals are competency levels. Lesson
lists per topic and per objective are derived from frontmatter at build
time, never stored twice.

### Storage

One YAML file per topic and one per area's competencies. The map page, one
reference page per topic, one per competency and the glossary all render
from these files.

| File                                       | Contents                                                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/src/data/topics/<area>/<topic>.yaml` | `name`, `definition`, `concepts[] {id, name, definition}`, `links {prerequisites[], related[], specializations[]}`, `sources[]`                                        |
| `docs/src/data/competencies/<area>.yaml`   | `competencies[] {id, statement, topics[], objectives[] {id, statement, level, behaviours[] {claim, why, example}}, alignment[] {framework, code, asks, objectives[]}}` |

### Stable URLs

| Page       | URL                                  | Notes                                                                           |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Topic      | `/topics/<area>/<topic>/`            | The map opens it in a side drawer and updates the URL, so the view is shareable |
| Competency | `/competencies/<area>/<competency>/` | Lists objectives, behaviours, alignment and the lessons that serve it           |
| Glossary   | `/glossary/#<concept>`               | Generated from every topic's concept definitions                                |

Tutor mode cites these URLs when it points a learner somewhere.

### Rendering rules

- Concept definitions follow the dictionary: one plain paragraph of about
  80 words, no lists or links, readable both in the glossary and as hover
  text on the map.
- No short codes. A reference from one behaviour to another uses the
  objective slug.
- The topic map colours each topic by the state of the lessons that cover
  it, using the same three states as the lesson graph below.

## Course page as lesson graph

Each course renders as a graph, not a list.

| Element         | Rendering                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lessons         | Boxes placed in **levels**: rows of lessons that share a depth in the prerequisite order                                                           |
| Edges           | Dotted lines from the lessons that teach an assumed objective to the lessons that assume it; derived from `assumes` at build time                  |
| Milestone bar   | Percent of lessons finished with four labelled stops: getting started, halfway, almost there, complete. Skipped lessons count toward neither side. |
| Completion ring | Lessons and checkpoints done                                                                                                                       |
| Review due card | "Review due: N items" when review items are due, leading to the course's review page                                                               |
| About panel     | Goals, counts, prerequisites                                                                                                                       |

Node styling shows the learner's state from the progress record:

| State       | Meaning                             | Styling                                  |
| ----------- | ----------------------------------- | ---------------------------------------- |
| finished    | Recap reached, checkpoints resolved | Filled                                   |
| in progress | Read, not finished                  | Outlined with a partial ring             |
| skipped     | Learner marked "I know this"        | Struck through and grey                  |
| untouched   | -                                   | Plain                                    |
| dimmed      | Assumed objectives not yet passed   | Dimmed, never locked; paths are advisory |

## Source material

The topic tables below name the material each topic can start from. Keys:

| Key               | Source                                                                                                                                         | License                   | Use here                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `AEC-NN`          | Lesson NN of *agent-engineer-course*, a fork of Addy Osmani's course maintained by the author                                                  | Apache-2.0                | May be adapted, with attribution in `NOTICE.md`                               |
| `DLAI-N`          | DeepLearning.AI course N in the reading order below; `M1`..`M5` are modules of a course                                                        | Proprietary               | Topic coverage and sequencing as inspiration only; nothing copied or embedded |
| `Brilliant XXX`   | A big idea (three-letter code) in Brilliant's *Coding with AI* skills map; see "Alignment"                                                     | Proprietary               | Ideas and codes as facts; no text                                             |
| `Ng`              | Andrew Ng's AI engineering skills map: build and deploy AI applications, software engineering fundamentals, use coding agents, shape the build | Public newsletter         | Ordering and area split                                                       |
| `CS50`            | Harvard CS50 and its AI tutor                                                                                                                  | CC BY-NC-SA 4.0           | Ideas and vocabulary, cited; no text adapted                                  |
| `Learn Prompting` | The community prompt engineering guide                                                                                                         | CC BY-NC-SA 4.0 (current) | Vocabulary only; prompting concepts are written from the original papers      |
| new               | No usable source; written from scratch                                                                                                         | -                         | -                                                                             |

| Key      | agent-engineer-course lesson                                                                  |
| -------- | --------------------------------------------------------------------------------------------- |
| `AEC-01` | What are AI agents: model versus agent, autonomy levels, when a prompt suffices               |
| `AEC-02` | How agents think: tokens and context, reasoning strategies, model choice, system prompts      |
| `AEC-03` | Tools, giving agents hands: function calling, schema design, the N x M problem                |
| `AEC-04` | Agentic design patterns: ReAct, reflection, tool use, planning                                |
| `AEC-05` | Memory and context: context engineering, memory kinds, memory versus RAG, context rot         |
| `AEC-06` | Planning and reasoning: the loop, plan-then-execute, hierarchy                                |
| `AEC-07` | Multi-agent systems: architectures, roles, the orchestration tax                              |
| `AEC-08` | Agentic RAG: the retrieve, evaluate, refine loop; when basic RAG is enough                    |
| `AEC-09` | Evaluating and testing agents: quality pillars, metrics, trajectories, LLM as judge           |
| `AEC-10` | Guardrails and safety: why agent safety differs, defence layers, injection, human in the loop |
| `AEC-11` | From prototype to production: eval-gated deploys, rollout, cost                               |
| `AEC-12` | Getting started with Claude Code; written around an internal proxy, needs a public rewrite    |
| `AEC-13` | Building your first agent: the loop from scratch, then with an SDK                            |
| `AEC-14` | Agent protocols, MCP and A2A                                                                  |
| `AEC-15` | AGENTS.md: contents, monorepo hierarchies, with a builder widget                              |
| `AEC-16` | MCP deep dive: MCP versus CLI, security failure modes, token cost                             |
| `AEC-17` | Agent skills: skills versus tools, the spec, progressive disclosure                           |
| `AEC-18` | Orchestrators: code- versus model-driven, patterns, anti-patterns                             |

| Key       | DeepLearning.AI course                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `DLAI-1`  | ChatGPT Prompt Engineering for Developers                                                               |
| `DLAI-2`  | Generative AI for Everyone                                                                              |
| `DLAI-3`  | AI Prompting for Everyone                                                                               |
| `DLAI-5`  | Claude Code: A Highly Agentic Coding Assistant                                                          |
| `DLAI-6`  | Intro to Generative AI for Software Development                                                         |
| `DLAI-7`  | Team Software Engineering with AI                                                                       |
| `DLAI-9`  | MCP: Build Rich-Context AI Apps with Anthropic                                                          |
| `DLAI-10` | Agent Skills with Anthropic                                                                             |
| `DLAI-11` | Agentic AI: M1 workflows and autonomy, M2 reflection, M4 evals and error analysis, M5 autonomous agents |

## Foundations

### Area `concepts`: Concepts

Topics:

| Topic id                    | Name                     | Concepts                                                                                      | Prerequisites     | Source material                                                               |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `concepts/how-models-work`  | How language models work | token, context window, training vs inference, model family and size, sampling and temperature | -                 | `AEC-02` first half; `DLAI-2`, `DLAI-6`                                       |
| `concepts/prompting`        | Prompting                | instruction, example (few-shot), role and system prompt, iteration, structured output         | how-models-work   | `DLAI-1`, `DLAI-3`; definitions from the papers, `Learn Prompting` vocabulary |
| `concepts/limits`           | Capabilities and limits  | hallucination, knowledge cutoff, non-determinism, sycophancy, cost and latency                | how-models-work   | `DLAI-3` (sycophancy); otherwise new                                          |
| `concepts/what-is-an-agent` | What an agent is         | model vs agent, tool, agent loop, degree of autonomy, harness                                 | prompting, limits | `AEC-01`, usable for knowledge workers as is; `DLAI-11` M1                    |
| `concepts/grounding`        | Grounding and memory     | retrieval (RAG), grounding, short- and long-term memory, context rot                          | what-is-an-agent  | `AEC-05` knowledge-worker parts; `AEC-08` introduction                        |

Competencies:

| Competency id                | Statement                                                      | Draws on topics                    |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `concepts/explains-models`   | Explains how a language model produces text and where it fails | how-models-work, limits, grounding |
| `concepts/prompts-reliably`  | Writes prompts that get reliable results                       | prompting, how-models-work         |
| `concepts/recognises-agents` | Recognises an agent, its tools and its degree of autonomy      | what-is-an-agent, limits           |

Learning objectives:

| Competency          | Objective                    | Level | Statement                                                           |
| ------------------- | ---------------------------- | ----- | ------------------------------------------------------------------- |
| `explains-models`   | `explains-generation`        | base  | Explains tokens, context and sampling in plain words                |
| `explains-models`   | `names-failure-modes`        | base  | Names the common ways output goes wrong and why                     |
| `explains-models`   | `explains-grounding`         | base  | Explains what grounding and retrieval add and what they do not fix  |
| `prompts-reliably`  | `structures-a-prompt`        | base  | Turns a vague request into instruction, context, example and format |
| `prompts-reliably`  | `iterates-on-output`         | base  | Improves a result by changing the prompt, not by retrying           |
| `prompts-reliably`  | `asks-for-structure`         | base  | Asks for output in a shape the next step can use                    |
| `recognises-agents` | `tells-agent-from-assistant` | base  | Tells a chat assistant from an agent by what it can do unprompted   |
| `recognises-agents` | `places-on-autonomy-scale`   | base  | Places a product or workflow on the autonomy scale                  |
| `recognises-agents` | `names-the-loop`             | base  | Describes the observe, think, act loop and the tools in it          |

### Area `safety`: Safety

Safety is not a first-class track in any of the source courses; most of
this area is new material.

Topics:

| Topic id                 | Name                     | Concepts                                                                                         | Prerequisites                           | Source material                                               |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| `safety/responsible-use` | Responsible use          | data privacy, confidentiality, licensing and attribution, disclosure                             | concepts/limits                         | new; `DLAI-2` week 3                                          |
| `safety/failure-modes`   | Recognising failure      | hallucination in practice, bias, overreliance, automation complacency                            | concepts/limits                         | new                                                           |
| `safety/verification`    | Verifying outputs        | checking habits, source checking, endorsed answers, "trust but verify" for agents                | failure-modes                           | new; `CS50` endorsed answers as an idea                       |
| `safety/agent-risk`      | Agent risk               | blast radius, permissions and least privilege, human in the loop, prompt injection, exfiltration | concepts/what-is-an-agent, verification | `AEC-10`, the best knowledge-worker safety material available |
| `safety/governance`      | Governance and oversight | policy, logging and audit, model change risk, escalation                                         | agent-risk                              | `AEC-10` defence layers; `AEC-11` engineer parts              |

Competencies:

| Competency id                | Statement                                          | Draws on topics             |
| ---------------------------- | -------------------------------------------------- | --------------------------- |
| `safety/handles-data-safely` | Uses AI safely with confidential and personal data | responsible-use             |
| `safety/verifies-output`     | Verifies AI output before relying on it            | failure-modes, verification |
| `safety/judges-agent-risk`   | Judges the risk of letting an agent act            | agent-risk, governance      |

Learning objectives:

| Competency            | Objective               | Level  | Statement                                                         |
| --------------------- | ----------------------- | ------ | ----------------------------------------------------------------- |
| `handles-data-safely` | `decides-what-to-share` | base   | Decides what may go into a prompt and what may not                |
| `handles-data-safely` | `discloses-ai-use`      | base   | Discloses AI use where the audience expects it                    |
| `handles-data-safely` | `respects-licenses`     | base   | Respects licenses and attribution in AI-assisted output           |
| `verifies-output`     | `checks-claims`         | base   | Checks claims and sources on anything that leaves their desk      |
| `verifies-output`     | `spots-sycophancy`      | base   | Spots agreement that is not evidence                              |
| `verifies-output`     | `calibrates-trust`      | base   | Matches the depth of checking to the cost of being wrong          |
| `verifies-output`     | `keeps-a-check-habit`   | expert | Builds verification into a team's routine rather than their own   |
| `judges-agent-risk`   | `names-blast-radius`    | base   | Names what an agent action can reach and break                    |
| `judges-agent-risk`   | `chooses-human-in-loop` | base   | Chooses where a human must approve                                |
| `judges-agent-risk`   | `recognises-injection`  | base   | Recognises prompt injection and data exfiltration paths           |
| `judges-agent-risk`   | `sets-oversight`        | lead   | Sets policy, logging and escalation for agents in an organisation |

### Area `using-agents`: Using agents

Topics:

| Topic id                      | Name                      | Concepts                                                                                                 | Prerequisites                                  | Source material                                          |
| ----------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `using-agents/assistant-work` | Working with an assistant | finding information, thought partner, drafting, critique, working with files and images                  | concepts/prompting                             | `DLAI-3`                                                 |
| `using-agents/delegating`     | Delegating to an agent    | task brief, giving context, choosing a degree of autonomy, checking results                              | concepts/what-is-an-agent, safety/verification | new; `DLAI-11` M1; `Ng`                                  |
| `using-agents/decomposition`  | Decomposing work          | task decomposition, iteration, when to stop and do it yourself                                           | delegating                                     | `DLAI-11` M1                                             |
| `using-agents/choosing-tools` | Choosing models and tools | model fit, cost and speed, chat vs agent vs automation, what to keep human, reasoning across tool levels | delegating, concepts/limits                    | `AEC-12` chooser after a public rewrite; `Brilliant ABS` |

Competencies:

| Competency id                            | Statement                                           | Draws on topics                           |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| `using-agents/delegates-and-checks`      | Delegates a task to an agent and checks the result  | delegating, decomposition, assistant-work |
| `using-agents/chooses-tool-and-autonomy` | Chooses the right tool and autonomy level for a job | choosing-tools, delegating                |

Learning objectives:

| Competency                  | Objective                        | Level  | Statement                                                   |
| --------------------------- | -------------------------------- | ------ | ----------------------------------------------------------- |
| `delegates-and-checks`      | `writes-a-brief`                 | base   | Writes a brief with goal, context, limits and done-criteria |
| `delegates-and-checks`      | `chooses-autonomy`               | base   | Chooses how much the agent may do before checking in        |
| `delegates-and-checks`      | `reviews-against-brief`          | base   | Reviews the result against the brief, not against a feeling |
| `delegates-and-checks`      | `adjusts-mid-task`               | base   | Adjusts the brief when the work reveals new information     |
| `chooses-tool-and-autonomy` | `picks-chat-agent-or-automation` | base   | Picks chat, agent or automation for a task and says why     |
| `chooses-tool-and-autonomy` | `keeps-the-human-steps`          | base   | Names the steps that stay human and why                     |
| `chooses-tool-and-autonomy` | `reasons-across-levels`          | expert | Re-applies judgement when the tool level rises              |

## Engineering

### Area `coding-with-agents`: Coding with agents

Two topics exist because Brilliant's map shows where human skill
concentrates once an agent does the implementing: **specification** (taste,
success criteria, decomposition, designing the verification) and
**verification** as its own topic rather than a corner of quality.
Reversibility joins workflow for the same reason.

Topics:

| Topic id                           | Name                         | Concepts                                                                                                                                          | Prerequisites                             | Source material                           |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `coding-with-agents/first-session` | Running a coding agent       | install and setup, codebase understanding, first change, permissions, session and context                                                         | using-agents/delegating                   | `AEC-12` after a public rewrite; `DLAI-5` |
| `coding-with-agents/specification` | Deciding and specifying      | what is worth building, success criteria, decomposition into components, dependencies, designing the verification                                 | first-session, using-agents/decomposition | new; `Brilliant TAS`, `Brilliant SPC`     |
| `coding-with-agents/workflow`      | Plan, implement, verify      | plan mode, spec-driven change, test-driven change, working increments, sequencing for early feedback, reversibility, commits and PRs              | first-session, specification              | new; `DLAI-5`, `DLAI-6`; `Brilliant INC`  |
| `coding-with-agents/context`       | Context engineering for code | project instructions, scoping a task, referencing files, avoiding context rot                                                                     | workflow, concepts/grounding              | `AEC-15`, shared with customizing-agents  |
| `coding-with-agents/verification`  | Verifying agent work         | reviewing code you did not write, verifying against the specification, observing a running system, isolating a fault, bounded self-checking loops | workflow, safety/verification             | new; `Brilliant VER`                      |
| `coding-with-agents/quality`       | Quality with agents          | testing, documentation, dependency hygiene, security review of agent output, supply-chain risk                                                    | verification, safety/agent-risk           | `DLAI-7`; `Brilliant SEC`                 |
| `coding-with-agents/team`          | Agents in a team             | parallel sessions, worktrees, CI integration, hooks, review norms, attribution                                                                    | quality                                   | `DLAI-5`; this repo's own practice        |

Competencies:

| Competency id                            | Statement                                                                     | Draws on topics                           |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| `coding-with-agents/specifies-work`      | Specifies work well enough for an agent to implement and for anyone to verify | specification, using-agents/decomposition |
| `coding-with-agents/ships-with-agent`    | Ships a change with a coding agent through plan, implement and verify         | first-session, workflow, context          |
| `coding-with-agents/verifies-agent-work` | Verifies agent-written code before trusting it                                | verification, quality, safety/agent-risk  |
| `coding-with-agents/works-in-team`       | Works with agents alongside a team                                            | team, workflow                            |

Learning objectives:

| Competency            | Objective                    | Level  | Statement                                                                  |
| --------------------- | ---------------------------- | ------ | -------------------------------------------------------------------------- |
| `specifies-work`      | `judges-worth-building`      | base   | Judges whether something is worth building before building it              |
| `specifies-work`      | `defines-success`            | base   | Defines what a successful outcome requires                                 |
| `specifies-work`      | `decomposes-into-components` | base   | Decomposes a problem into components with clear dependencies               |
| `specifies-work`      | `designs-the-check`          | base   | Designs how the work will be verified before it is built                   |
| `ships-with-agent`    | `runs-a-session`             | base   | Runs a session from setup to a reviewed diff                               |
| `ships-with-agent`    | `works-in-increments`        | base   | Works in small increments, sequenced for early feedback                    |
| `ships-with-agent`    | `keeps-change-reversible`    | base   | Keeps every change reversible                                              |
| `ships-with-agent`    | `gives-the-right-context`    | base   | Gives the agent the files, constraints and limits the task needs           |
| `ships-with-agent`    | `keeps-understanding`        | expert | Keeps their own understanding of the code as the agent produces more of it |
| `verifies-agent-work` | `reviews-others-code`        | base   | Reviews code they did not write, against the specification                 |
| `verifies-agent-work` | `observes-and-debugs`        | base   | Observes the running system and isolates a fault systematically            |
| `verifies-agent-work` | `automates-the-check`        | base   | Turns a check into a bounded, self-checking loop                           |
| `verifies-agent-work` | `screens-for-security`       | base   | Screens agent output for security and supply-chain problems                |
| `works-in-team`       | `attributes-honestly`        | base   | Attributes agent work honestly in commits and reviews                      |
| `works-in-team`       | `follows-team-norms`         | base   | Follows the team's review and CI norms for agent changes                   |
| `works-in-team`       | `runs-parallel-work`         | expert | Runs several agent sessions without losing coherence                       |
| `works-in-team`       | `sets-team-practice`         | lead   | Sets the team's practice for agent use                                     |

### Area `customizing-agents`: Customizing agents

Topics:

| Topic id                               | Name                         | Concepts                                                                                               | Prerequisites                           | Source material                               |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------- |
| `customizing-agents/instructions`      | Project instructions         | AGENTS.md / CLAUDE.md, sections, monorepo hierarchy, when instructions are not enough                  | coding-with-agents/context              | `AEC-15` with its builder widget and exercise |
| `customizing-agents/skills`            | Agent skills                 | skill vs tool vs instruction, skill spec, progressive disclosure, writing a good skill                 | instructions                            | `AEC-17`; `DLAI-10`                           |
| `customizing-agents/mcp`               | Connecting tools with MCP    | server, client, transport, MCP vs CLI, tool cost, MCP security                                         | instructions, concepts/what-is-an-agent | `AEC-14`, `AEC-16`; `DLAI-9`                  |
| `customizing-agents/hooks-permissions` | Hooks, permissions, settings | permission modes, allowlists, hooks, subagents, settings layering                                      | instructions, safety/agent-risk         | new                                           |
| `customizing-agents/memory`            | Memory and session context   | auto-memory, context files, compaction, session handoff, turning repeated work into reusable knowledge | skills, concepts/grounding              | `AEC-05` engineer parts; `Brilliant MEM`      |

Competencies:

| Competency id                              | Statement                                  | Draws on topics                           |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- |
| `customizing-agents/configures-agent`      | Configures an agent for a project          | instructions, hooks-permissions, memory   |
| `customizing-agents/writes-skill`          | Writes a reusable agent skill              | skills, instructions                      |
| `customizing-agents/connects-tools-safely` | Connects an agent to tools and data safely | mcp, hooks-permissions, safety/agent-risk |

Learning objectives:

| Competency              | Objective                     | Level  | Statement                                                                 |
| ----------------------- | ----------------------------- | ------ | ------------------------------------------------------------------------- |
| `configures-agent`      | `writes-project-instructions` | base   | Writes instructions that remove a recurring agent mistake                 |
| `configures-agent`      | `sets-permissions`            | base   | Sets permissions to the least the work needs                              |
| `configures-agent`      | `adds-a-hook`                 | base   | Adds a hook that enforces a rule the instructions cannot                  |
| `configures-agent`      | `manages-memory`              | expert | Manages what the agent carries between sessions                           |
| `writes-skill`          | `chooses-skill-over-tool`     | base   | Chooses between a skill, a tool and an instruction for a need             |
| `writes-skill`          | `packages-a-procedure`        | base   | Packages a repeatable procedure as a skill another person's agent can use |
| `writes-skill`          | `discloses-progressively`     | base   | Structures a skill so the agent loads only what it needs                  |
| `connects-tools-safely` | `adds-a-tool`                 | base   | Adds a tool via MCP or CLI with least privilege                           |
| `connects-tools-safely` | `weighs-tool-cost`            | base   | Explains the token and risk cost of a tool before adding it               |
| `connects-tools-safely` | `hardens-a-connection`        | expert | Hardens a tool connection against injection and exfiltration              |

### Area `building-agents`: Building agents

Topics:

| Topic id                           | Name                          | Concepts                                                                                                                                | Prerequisites                                         | Source material                                  |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `building-agents/tool-use`         | Tool use                      | function calling, tool schema design, N x M integration problem, error handling, parallel calls                                         | concepts/what-is-an-agent                             | `AEC-03`                                         |
| `building-agents/agent-loop`       | The agent loop and harness    | loop from scratch, Agent SDK, stop conditions, unbounded-loop pitfalls                                                                  | tool-use                                              | `AEC-13`, the most exercise-shaped source lesson |
| `building-agents/patterns`         | Design patterns               | ReAct, reflection, planning, plan-then-execute vs reactive, hierarchical planning                                                       | agent-loop                                            | `AEC-04`, `AEC-06`; `DLAI-11` M2, M5             |
| `building-agents/orchestration`    | Orchestration and multi-agent | code- vs model-driven orchestration, sequential / hierarchical / collaborative, orchestration tax                                       | patterns                                              | `AEC-07`, `AEC-18`                               |
| `building-agents/retrieval-memory` | Agentic retrieval and memory  | agentic RAG loop, memory storage choices, when basic RAG suffices                                                                       | agent-loop, concepts/grounding                        | `AEC-05`, `AEC-08`                               |
| `building-agents/evaluation`       | Evaluation and testing        | quality pillars, rubrics, metrics that cannot be gamed, trajectory evaluation, LLM as judge, golden sets, error analysis, observability | agent-loop, coding-with-agents/verification           | `AEC-09`; `DLAI-11` M4; `Brilliant VER`          |
| `building-agents/production`       | Guardrails and production     | defence layers, eval-gated deploys, rollout strategies, cost, agent-specific security risks, protocols (MCP, A2A)                       | evaluation, safety/governance, customizing-agents/mcp | `AEC-10`, `AEC-11`, `AEC-14`; `Brilliant SEC`    |

Competencies:

| Competency id                         | Statement                                    | Draws on topics                                       |
| ------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `building-agents/builds-agent-loop`   | Builds a tool-using agent loop               | tool-use, agent-loop, retrieval-memory                |
| `building-agents/evaluates-agents`    | Evaluates an agent's quality systematically  | evaluation                                            |
| `building-agents/orchestrates-agents` | Designs and orchestrates multi-agent systems | patterns, orchestration                               |
| `building-agents/runs-in-production`  | Runs an agent in production with guardrails  | production, safety/governance, customizing-agents/mcp |

Learning objectives:

| Competency            | Objective                      | Level  | Statement                                                                |
| --------------------- | ------------------------------ | ------ | ------------------------------------------------------------------------ |
| `builds-agent-loop`   | `defines-a-tool`               | base   | Defines a tool with a schema the model uses correctly                    |
| `builds-agent-loop`   | `implements-the-loop`          | base   | Implements the loop with error handling and a stop condition             |
| `builds-agent-loop`   | `adds-retrieval`               | base   | Adds retrieval or memory and knows when basic RAG is enough              |
| `builds-agent-loop`   | `uses-an-sdk`                  | expert | Rebuilds the loop on an agent SDK and explains what the SDK took over    |
| `evaluates-agents`    | `writes-a-rubric`              | base   | Turns "good" into scorable criteria                                      |
| `evaluates-agents`    | `builds-a-golden-set`          | base   | Builds a representative input set with expected qualities                |
| `evaluates-agents`    | `grades-trajectories`          | base   | Grades the path the agent took, not only the final answer                |
| `evaluates-agents`    | `avoids-gamed-metrics`         | expert | Chooses metrics that cannot improve without the real quality improving   |
| `orchestrates-agents` | `picks-a-pattern`              | base   | Picks a design pattern for a task and says why                           |
| `orchestrates-agents` | `justifies-orchestration-cost` | base   | Justifies the coordination cost of more than one agent                   |
| `orchestrates-agents` | `composes-patterns`            | expert | Composes patterns and names the failure modes of the composition         |
| `runs-in-production`  | `gates-on-evals`               | base   | Gates a deploy on evaluation results                                     |
| `runs-in-production`  | `layers-defences`              | base   | Layers policy, filtering and monitoring around the agent                 |
| `runs-in-production`  | `mitigates-agent-risks`        | base   | Mitigates injection, exfiltration and over-permission in a running agent |
| `runs-in-production`  | `manages-cost-and-rollout`     | expert | Manages cost and rolls out changes without breaking users                |

## Behaviours: worked example

Behaviours are written for one objective so far; the rest are to write.
Every objective's behaviours take this form: one-sentence claim, a why, one
example; two to six per objective. For
`using-agents/delegates-and-checks/writes-a-brief` (`base`):

| #   | Claim                                                                                   | Why                                                                                                                              | Example                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A brief states the goal, the context the work needs and the limits it must stay within. | An agent fills in whatever is left unsaid with plausible defaults, so what it must not touch matters as much as what it must do. | "Update the pricing table in `docs/pricing.md` from this spreadsheet; do not change any other file" stays on task, where "update the pricing" may rewrite the page. |
| 2   | Done-criteria are written before the work starts.                                       | Without them the result is judged by feel, and a plausible result is accepted as a correct one.                                  | "Done when every row in the spreadsheet appears once in the table and the totals match" turns review into a check rather than a read.                               |
| 3   | The brief names the information the agent should use and where it is.                   | An agent that has to guess sources will pick the most available one, not the right one.                                          | Pointing at the approved spreadsheet, not "the latest numbers", prevents the agent from pulling last quarter's figures from an old email.                           |

## Alignment

An alignment row maps an external framework's item to the objectives here
that address it. Rows are kept per competency in the YAML and summarised
here for the two frameworks known so far.

### Frameworks

**Brilliant's *Coding with AI* skills map** organises AI-era programming
skill into seven "big ideas", each with a three-letter code and numbered
objectives underneath (`INC-2`, `VER-7`). Codes are cited here as facts;
the "asks" column paraphrases what each objective asks for.

| Code | Big idea                               | In short                                                                  |
| ---- | -------------------------------------- | ------------------------------------------------------------------------- |
| TAS  | Taste: what is worth building          | Judge ideas, define success, weigh value against cost                     |
| INC  | Developing incrementally               | Working increments, early feedback, understanding, reversibility          |
| SPC  | Specification and design               | Decompose, analyse dependencies, manage constraints, design the check     |
| MEM  | Memory (listed under SPC)              | Manage what is held in memory; turn repeated work into reusable knowledge |
| BLD  | Designing workflows                    | Direct an agent to a spec, adjust, divide and delegate, oversee           |
| VER  | Verification                           | Verify against spec, review, observe, debug, automate, measure            |
| SEC  | Security and adversarial thinking      | Misuse analysis, secure coding, AI code review, agent risk, supply chain  |
| ABS  | Reasoning across levels of abstraction | Reason at the right level; re-apply reasoning as tooling rises            |

**Andrew Ng's AI engineering skills map** names four skills: building and
deploying AI applications, software engineering fundamentals, using coding
agents, and shaping the build (deciding what goes in the spec).

### Rows

| Framework                     | Code / item                            | Asks                                                      | Our objectives                                                                                                                |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Brilliant Coding with AI      | TAS-1..4                               | Judge what is worth building, define success, weigh cost  | `coding-with-agents/specifies-work/judges-worth-building`, `defines-success`                                                  |
| Brilliant Coding with AI      | INC-1, INC-2, INC-5                    | Working increments, early feedback, reversibility         | `coding-with-agents/ships-with-agent/works-in-increments`, `keeps-change-reversible`                                          |
| Brilliant Coding with AI      | INC-3, INC-4                           | Maintain understanding and coherence                      | `coding-with-agents/ships-with-agent/keeps-understanding`                                                                     |
| Brilliant Coding with AI      | SPC-3, SPC-4, SPC-6                    | Decompose, analyse dependencies, design verification      | `coding-with-agents/specifies-work/decomposes-into-components`, `designs-the-check`                                           |
| Brilliant Coding with AI      | SPC-5, BLD-1                           | Manage constraints; direct an agent to a specification    | `using-agents/delegates-and-checks/writes-a-brief`, `coding-with-agents/ships-with-agent/gives-the-right-context`             |
| Brilliant Coding with AI      | BLD-2, BLD-3                           | Adjust on new information; divide and delegate            | `using-agents/delegates-and-checks/adjusts-mid-task`, `using-agents/chooses-tool-and-autonomy/picks-chat-agent-or-automation` |
| Brilliant Coding with AI      | BLD-4, BLD-5                           | Organise and oversee a workflow                           | `coding-with-agents/works-in-team/runs-parallel-work`, `building-agents/orchestrates-agents/picks-a-pattern`                  |
| Brilliant Coding with AI      | VER-2..6                               | Verify against spec, review, observe, debug, automate     | `coding-with-agents/verifies-agent-work/*`                                                                                    |
| Brilliant Coding with AI      | VER-7                                  | Measure quality and evaluate AI systems                   | `building-agents/evaluates-agents/*`                                                                                          |
| Brilliant Coding with AI      | MEM-1, MEM-2                           | Manage memory; turn repeated work into reusable knowledge | `customizing-agents/configures-agent/manages-memory`, `customizing-agents/writes-skill/packages-a-procedure`                  |
| Brilliant Coding with AI      | SEC-3, SEC-5                           | Evaluate AI code for vulnerabilities; supply-chain risk   | `coding-with-agents/verifies-agent-work/screens-for-security`                                                                 |
| Brilliant Coding with AI      | SEC-4                                  | Mitigate AI- and agent-specific risks                     | `building-agents/runs-in-production/mitigates-agent-risks`, `customizing-agents/connects-tools-safely/hardens-a-connection`   |
| Brilliant Coding with AI      | ABS-1..3                               | Reason across levels of abstraction and tooling           | `using-agents/chooses-tool-and-autonomy/reasons-across-levels`                                                                |
| Ng, AI engineering skills map | Using coding agents                    | Plan, execute, verify, monitor at calibrated autonomy     | `using-agents/delegates-and-checks`, `coding-with-agents/ships-with-agent`                                                    |
| Ng, AI engineering skills map | Shaping the build                      | Deciding what goes in the spec                            | `coding-with-agents/specifies-work`                                                                                           |
| Ng, AI engineering skills map | Building and deploying AI applications | Build, evaluate, ship                                     | `building-agents/*`                                                                                                           |

### Not covered

Brilliant SEC-1 and SEC-2 (general secure coding) and SPC-1 and SPC-2
(interaction and data-model design) are software engineering, not
AI-specific, and stay out of scope.

## Differentiation by routing

Differentiation happens through position in the graph, not through variants
of a page. Content is written once. This is the model Brilliant describes
for a classroom: three learners work in parallel on prerequisite review, the
current objective and an extension, all inside the same course graph.

### Mechanism

| Input                              | Routing                                                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lesson frontmatter                 | `assumes` lists the objectives a lesson relies on, each pointing at the section that teaches it. `extends-to` lists the next lesson, a specialization topic or a short. |
| Failed or skipped checkpoint       | Shows a card naming the assumed objective and the section to revisit.                                                                                                   |
| Every checkpoint passed first time | Shows the lesson's extensions.                                                                                                                                          |
| Comfort level `less`               | Inserts the assumed objectives' sections into the path before each lesson; keeps tutor mode hint-heavy.                                                                 |
| Comfort level `more`               | Offers a skills check at the start of a lesson (one checkpoint per served objective), skips what is passed, surfaces extensions.                                        |
| Exercise                           | One per lesson, written once, ending with an optional one-line stretch goal. No variants.                                                                               |
| Path                               | Renders three lanes: behind (assumed objectives not yet passed), on target (the path's next lesson), ahead (extensions). "You are here" marks the learner.              |
| Review item                        | A review item failed twice in a row marks its objective "behind" in the path lanes and offers the section that teaches it, exactly like a failed checkpoint.            |
| Tutor mode                         | On a wrong answer asks a diagnostic question; if the gap is upstream it points at the upstream section rather than re-explaining.                                       |

All routing reads the map and the local progress record; nothing else.

### Worked example

The thin-slice lesson *Your first session with a coding agent*:

| Field        | Value                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| serves       | `ships-with-agent/runs-a-session`, `ships-with-agent/gives-the-right-context`                                                                  |
| assumes      | `delegates-and-checks/writes-a-brief` (section "Writing the brief" in *Delegating a task to an agent*), `judges-agent-risk/names-blast-radius` |
| extends-to   | *Plan, implement, verify*; a short on permission modes                                                                                         |
| checkpoint 1 | Fix a weak brief. A fail routes to the Delegating section; a clean run offers the extensions.                                                  |
| exercise     | A scripted change in the fixture repository. Stretch goal: "now ask the agent for a refactor you choose, and review it the same way".          |

### Limits in release 1

Routing needs the objective graph to be real and needs somewhere to route
to. With six lessons there is little of either. The mechanism is designed
now so the data model and components allow for it; it becomes useful as the
graph fills in.

## Cross-area edges

| Edge                                                                                        | Type         | Why                                                                             |
| ------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `safety/agent-risk` -> `coding-with-agents/quality`, `customizing-agents/hooks-permissions` | prerequisite | Safety is a gate into Engineering, not a track of its own after Foundations     |
| `concepts/what-is-an-agent` -> five topics                                                  | prerequisite | The hub of the map and the anchor for its first visual                          |
| `coding-with-agents/context` and `customizing-agents/instructions`                          | related      | The same subject taught from the user side and the author side                  |
| `coding-with-agents/verification` -> `building-agents/evaluation`                           | prerequisite | You verify one piece of work before you measure a system                        |
| `building-agents/evaluation` before `patterns` and `orchestration`                          | path order   | Ng's ordering puts evaluation and error analysis early; not a hard prerequisite |

Several competencies draw on topics from two areas. That is expected;
competencies are not confined to their area's topics.

## Paths

| Path               | Audience                  | Lessons                                                                                             | Goal                                                 |
| ------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `knowledge-worker` | Everyone                  | All of Foundations, in area order                                                                   | All Foundations competencies at `base`               |
| `engineer`         | Software engineers        | Foundations, then coding-with-agents, then customizing-agents                                       | `ships-with-agent` and `configures-agent` at `base`  |
| `agent-builder`    | Engineers building agents | Foundations (agent and safety parts), building-agents/tool-use through evaluation, then customizing | `builds-agent-loop` and `evaluates-agents` at `base` |

## Release-1 thin slice

The first public release is one lesson per area, chosen so the shape is
visible end to end and each lesson exercises a different interaction type.

| Area               | Lesson (working title)                 | Mode        | Covers topic                     | Serves objectives                                                                  | Basis                                       | Interaction to prove     |
| ------------------ | -------------------------------------- | ----------- | -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| concepts           | How a language model works             | explanation | concepts/how-models-work         | `explains-models/explains-generation`, `names-failure-modes`                       | new; `AEC-02` first half                    | `choice`, widget         |
| safety             | Why agent safety is different          | explanation | safety/agent-risk                | `judges-agent-risk/names-blast-radius`, `chooses-human-in-loop`                    | `AEC-10` first half, rewritten for everyone | `scenario`, pitfall      |
| using-agents       | Delegating a task to an agent          | tutorial    | using-agents/delegating          | `delegates-and-checks/writes-a-brief`, `chooses-autonomy`, `reviews-against-brief` | new; a real delegation in a sandbox         | `sort` (autonomy levels) |
| coding-with-agents | Your first session with a coding agent | tutorial    | coding-with-agents/first-session | `ships-with-agent/runs-a-session`, `gives-the-right-context`                       | `AEC-12` public rewrite; fixture repository | `predict`, `exercise`    |
| customizing-agents | Project instructions: AGENTS.md        | tutorial    | customizing-agents/instructions  | `configures-agent/writes-project-instructions`                                     | `AEC-15` with the builder widget            | `repair`, widget         |
| building-agents    | Building your first agent              | tutorial    | building-agents/agent-loop       | `builds-agent-loop/defines-a-tool`, `implements-the-loop`                          | `AEC-13`                                    | `predict`, `order`       |

Every slice lesson has:

- served, assumed and extends-to objectives in frontmatter;
- one pitfall, one checkpoint per served objective, one exercise with a
  stretch goal, and a recap;
- in tutorial mode, the paragraph-then-example rhythm, `predict` for every
  example that runs, and a resettable fixture.

Finishing any slice lesson schedules its checkpoints for review, so the
review mechanism is exercised by release 1 too. The sidebar shows only these
six areas' real lessons; no stub pages. Tutor mode is tested against these
six.

## Related specs

- [S01 Project dictionary](S01-dictionary.md): every term used here.

## Open questions

1. Whether `concepts/grounding` belongs in Foundations or moves to
   Engineering as a `building-agents` topic only. Leaning: keep a short
   version in Foundations because knowledge workers meet RAG-based products
   daily.
2. Whether `safety/governance` is worth a Foundations lesson or only the
   `lead` objective `sets-oversight`. Leaning: one short lesson.
3. Naming of `hooks-permissions`; it is Claude Code specific where the rest
   is not. Decide when writing the lesson.
4. Whether Foundations should carry any `expert` or `lead` objectives at
   all. Two are drafted above (`keeps-a-check-habit`, `sets-oversight`);
   drop them if Foundations stops at `base` by design.
5. Whether `coding-with-agents/specification` deserves a competency of its
   own or folds into `ships-with-agent`. Kept separate for now because
   specifying is where human skill concentrates once an agent implements.
