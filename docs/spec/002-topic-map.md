# 002 - Topic map and competencies

**Purpose:** Name what the site teaches (topics and their concepts, per
area, with prerequisite links), name what a learner should be able to do
afterwards (competencies, their learning objectives, and behaviours), say
how the map differentiates between learners, and pick the release-1 thin
slice. Plan step 2, drawn from the lesson inventories in
[explore/06](../plan/explore/06-lesson-inventory.md), the Diátaxis note
[explore/08](../plan/explore/08-diataxis.md) and Brilliant's skills map
[explore/09](../plan/explore/09-brilliant-skills-map.md). Vocabulary per
[spec 001](./001-dictionary.md).

**Status:** Draft, 2026-09-19, third revision. The first draft labelled
subject clusters as competencies; the second separated topics from
competencies; this one adds learning objectives under each competency,
the behaviour triple, an alignment layer, five topics for gaps Brilliant
exposed, and differentiation by routing. Behaviours are written for one
competency as a worked example; the rest are to write.

## Shape

Three tiers of what is taught and three of what the learner can do, kept
apart and linked.

- **Topics** are what is taught: a noun, a cluster of two to six concepts
  inside an area, the unit a lesson covers. Topics carry the graph edges:
  `prerequisite` (learning order, the arrow in the map), `related`,
  `specialization`. Concepts inherit their topic's edges.
- **Competencies** are what the learner can do afterwards: a verb phrase.
  Each owns three to six **learning objectives**, verb phrases tagged with a
  level (`base / expert / lead`). Each objective owns two to six
  **behaviours**, written as a triple: claim, why, example. Objectives are
  what lessons and checkpoints point at; behaviours are what a single
  checkpoint question or tutor question tests.
- A lesson's frontmatter names the topics it covers, the objectives it
  serves, the objectives it assumes, and the lessons or shorts it extends
  to. Paths are lists of lessons; goals are competency levels.
- Storage, "cheap tree, rich leaves": one YAML per topic under
  `docs/src/data/topics/<area>/<topic>.yaml` with `name`, `definition`,
  `concepts[] {id, name, definition}`,
  `links {prerequisites[], related[], specializations[]}`, `sources[]`; one
  file per area under `docs/src/data/competencies/<area>.yaml` listing
  competencies with `{id, statement, topics[], objectives[] {id, statement, level, behaviours[] {claim, why, example}}, alignment[] {framework, code, asks, objectives[]}}`. The map page, one reference page per topic and one
  per competency render from these files; concept definitions render as a
  generated glossary. Lesson lists per topic and objective are derived from
  lesson frontmatter, not stored twice.
- No short codes. Slugs are the identifiers; a reference from one behaviour
  to another uses the objective slug.

## Course page as lesson graph

Each course renders as a graph, not a list: lessons are boxes placed in
**levels** (rows of lessons that share a depth in the prerequisite order),
joined by dotted edges from the lessons they assume to the lessons that
assume them. Finished lessons are filled, available lessons are outlined,
lessons whose assumed objectives are not yet passed are dimmed but never
locked; paths are advisory. Beside the graph: a completion ring (lessons and
checkpoints done), a "review due" card when spec 003 has items due, and the
About panel (goals, counts, prerequisites). The graph is derived from lesson
frontmatter (`assumes`) at build time; nothing is stored twice.

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

Competencies and objectives (all `base` unless marked):

- `concepts/explains-models`: **Explains how a language model produces text
  and where it fails.** Topics: how-models-work, limits, grounding.
  - `explains-generation`: Explains tokens, context and sampling in plain
    words
  - `names-failure-modes`: Names the common ways output goes wrong and why
  - `explains-grounding`: Explains what grounding and retrieval add and
    what they do not fix
- `concepts/prompts-reliably`: **Writes prompts that get reliable results.**
  Topics: prompting, how-models-work.
  - `structures-a-prompt`: Turns a vague request into instruction, context,
    example and format
  - `iterates-on-output`: Improves a result by changing the prompt, not by
    retrying
  - `asks-for-structure`: Asks for output in a shape the next step can use
- `concepts/recognises-agents`: **Recognises an agent, its tools and its
  degree of autonomy.** Topics: what-is-an-agent, limits.
  - `tells-agent-from-assistant`: Tells a chat assistant from an agent by
    what it can do unprompted
  - `places-on-autonomy-scale`: Places a product or workflow on the autonomy
    scale
  - `names-the-loop`: Describes the observe, think, act loop and the tools
    in it

### Area `safety`: Safety

Topics:

| Topic id                 | Name                     | Concepts                                                                                         | Prerequisites                           | Existing material                      |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------- |
| `safety/responsible-use` | Responsible use          | data privacy, confidentiality, licensing and attribution, disclosure                             | concepts/limits                         | new; DL.AI 2 week 3 (inspiration)      |
| `safety/failure-modes`   | Recognising failure      | hallucination in practice, bias, overreliance, automation complacency                            | concepts/limits                         | new                                    |
| `safety/verification`    | Verifying outputs        | checking habits, source checking, endorsed answers, "trust but verify" for agents                | failure-modes                           | new; CS50 endorsed answers (idea)      |
| `safety/agent-risk`      | Agent risk               | blast radius, permissions and least privilege, human in the loop, prompt injection, exfiltration | concepts/what-is-an-agent, verification | AEC 10 (best KW safety material)       |
| `safety/governance`      | Governance and oversight | policy, logging and audit, model change risk, escalation                                         | agent-risk                              | AEC 10 layers, AEC 11 (engineer parts) |

Competencies and objectives:

- `safety/handles-data-safely`: **Uses AI safely with confidential and
  personal data.** Topics: responsible-use.
  - `decides-what-to-share`: Decides what may go into a prompt and what may
    not
  - `discloses-ai-use`: Discloses AI use where the audience expects it
  - `respects-licenses`: Respects licenses and attribution in AI-assisted
    output
- `safety/verifies-output`: **Verifies AI output before relying on it.**
  Topics: failure-modes, verification.
  - `checks-claims`: Checks claims and sources on anything that leaves their
    desk
  - `spots-sycophancy`: Spots agreement that is not evidence
  - `calibrates-trust`: Matches the depth of checking to the cost of being
    wrong
  - `keeps-a-check-habit` (`expert`): Builds verification into a team's
    routine rather than their own
- `safety/judges-agent-risk`: **Judges the risk of letting an agent act.**
  Topics: agent-risk, governance.
  - `names-blast-radius`: Names what an agent action can reach and break
  - `chooses-human-in-loop`: Chooses where a human must approve
  - `recognises-injection`: Recognises prompt injection and data exfiltration
    paths
  - `sets-oversight` (`lead`): Sets policy, logging and escalation for
    agents in an organisation

### Area `using-agents`: Using agents

Topics:

| Topic id                      | Name                      | Concepts                                                                                                 | Prerequisites                                  | Existing material                                     |
| ----------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `using-agents/assistant-work` | Working with an assistant | finding information, thought partner, drafting, critique, working with files and images                  | concepts/prompting                             | DL.AI 3 (inspiration)                                 |
| `using-agents/delegating`     | Delegating to an agent    | task brief, giving context, choosing a degree of autonomy, checking results                              | concepts/what-is-an-agent, safety/verification | new; DL.AI 11 M1, Ng skills map                       |
| `using-agents/decomposition`  | Decomposing work          | task decomposition, iteration, when to stop and do it yourself                                           | delegating                                     | DL.AI 11 M1 (inspiration)                             |
| `using-agents/choosing-tools` | Choosing models and tools | model fit, cost and speed, chat vs agent vs automation, what to keep human, reasoning across tool levels | delegating, concepts/limits                    | AEC 12 chooser (public rewrite); Brilliant ABS (idea) |

Competencies and objectives:

- `using-agents/delegates-and-checks`: **Delegates a task to an agent and
  checks the result.** Topics: delegating, decomposition, assistant-work.
  - `writes-a-brief`: Writes a brief with goal, context, limits and
    done-criteria
  - `chooses-autonomy`: Chooses how much the agent may do before checking
    in
  - `reviews-against-brief`: Reviews the result against the brief, not
    against a feeling
  - `adjusts-mid-task`: Adjusts the brief when the work reveals new
    information
- `using-agents/chooses-tool-and-autonomy`: **Chooses the right tool and
  autonomy level for a job.** Topics: choosing-tools, delegating.
  - `picks-chat-agent-or-automation`: Picks chat, agent or automation for a
    task and says why
  - `keeps-the-human-steps`: Names the steps that stay human and why
  - `reasons-across-levels` (`expert`): Re-applies judgement when the tool
    level rises

## Engineering

### Area `coding-with-agents`: Coding with agents

Topics. Two are new from Brilliant's gaps: specification (taste, success
criteria, decomposition, designing verification) and verification as its
own topic instead of a corner of quality. Reversibility joins workflow.

| Topic id                           | Name                         | Concepts                                                                                                                                          | Prerequisites                             | Existing material                                    |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `coding-with-agents/first-session` | Running a coding agent       | install and setup, codebase understanding, first change, permissions, session and context                                                         | using-agents/delegating                   | AEC 12 (rewrite), DL.AI 5 (inspiration)              |
| `coding-with-agents/specification` | Deciding and specifying      | what is worth building, success criteria, decomposition into components, dependencies, designing the verification                                 | first-session, using-agents/decomposition | new; Brilliant TAS, SPC (ideas)                      |
| `coding-with-agents/workflow`      | Plan, implement, verify      | plan mode, spec-driven change, test-driven change, working increments, sequencing for early feedback, reversibility, commits and PRs              | first-session, specification              | new; DL.AI 5, 6 (inspiration); Brilliant INC (ideas) |
| `coding-with-agents/context`       | Context engineering for code | project instructions, scoping a task, referencing files, avoiding context rot                                                                     | workflow, concepts/grounding              | AEC 15 (crosses to customizing)                      |
| `coding-with-agents/verification`  | Verifying agent work         | reviewing code you did not write, verifying against the specification, observing a running system, isolating a fault, bounded self-checking loops | workflow, safety/verification             | new; Brilliant VER (ideas)                           |
| `coding-with-agents/quality`       | Quality with agents          | testing, documentation, dependency hygiene, security review of agent output, supply-chain risk                                                    | verification, safety/agent-risk           | DL.AI 7 (inspiration); Brilliant SEC (ideas)         |
| `coding-with-agents/team`          | Agents in a team             | parallel sessions, worktrees, CI integration, hooks, review norms, attribution                                                                    | quality                                   | DL.AI 5 (inspiration); this repo's own practice      |

Competencies and objectives:

- `coding-with-agents/specifies-work`: **Specifies work well enough for an
  agent to implement and for anyone to verify.** Topics: specification,
  using-agents/decomposition.
  - `judges-worth-building`: Judges whether something is worth building
    before building it
  - `defines-success`: Defines what a successful outcome requires
  - `decomposes-into-components`: Decomposes a problem into components with
    clear dependencies
  - `designs-the-check`: Designs how the work will be verified before it is
    built
- `coding-with-agents/ships-with-agent`: **Ships a change with a coding
  agent through plan, implement and verify.** Topics: first-session,
  workflow, context.
  - `runs-a-session`: Runs a session from setup to a reviewed diff
  - `works-in-increments`: Works in small increments, sequenced for early
    feedback
  - `keeps-change-reversible`: Keeps every change reversible
  - `gives-the-right-context`: Gives the agent the files, constraints and
    limits the task needs
  - `keeps-understanding` (`expert`): Keeps their own understanding of the
    code as the agent produces more of it
- `coding-with-agents/verifies-agent-work`: **Verifies agent-written code
  before trusting it.** Topics: verification, quality, safety/agent-risk.
  - `reviews-others-code`: Reviews code they did not write, against the
    specification
  - `observes-and-debugs`: Observes the running system and isolates a fault
    systematically
  - `automates-the-check`: Turns a check into a bounded, self-checking loop
  - `screens-for-security`: Screens agent output for security and
    supply-chain problems
- `coding-with-agents/works-in-team`: **Works with agents alongside a
  team.** Topics: team, workflow.
  - `attributes-honestly`: Attributes agent work honestly in commits and
    reviews
  - `follows-team-norms`: Follows the team's review and CI norms for agent
    changes
  - `runs-parallel-work` (`expert`): Runs several agent sessions without
    losing coherence
  - `sets-team-practice` (`lead`): Sets the team's practice for agent use

### Area `customizing-agents`: Customizing agents

Topics:

| Topic id                               | Name                         | Concepts                                                                                               | Prerequisites                           | Existing material                              |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------- |
| `customizing-agents/instructions`      | Project instructions         | AGENTS.md / CLAUDE.md, sections, monorepo hierarchy, when instructions are not enough                  | coding-with-agents/context              | AEC 15 (builder widget, exercise)              |
| `customizing-agents/skills`            | Agent skills                 | skill vs tool vs instruction, skill spec, progressive disclosure, writing a good skill                 | instructions                            | AEC 17; DL.AI 10 (inspiration)                 |
| `customizing-agents/mcp`               | Connecting tools with MCP    | server, client, transport, MCP vs CLI, tool cost, MCP security                                         | instructions, concepts/what-is-an-agent | AEC 14, 16; DL.AI 9 (inspiration)              |
| `customizing-agents/hooks-permissions` | Hooks, permissions, settings | permission modes, allowlists, hooks, subagents, settings layering                                      | instructions, safety/agent-risk         | new                                            |
| `customizing-agents/memory`            | Memory and session context   | auto-memory, context files, compaction, session handoff, turning repeated work into reusable knowledge | skills, concepts/grounding              | AEC 05 (engineer parts); Brilliant MEM (ideas) |

Competencies and objectives:

- `customizing-agents/configures-agent`: **Configures an agent for a
  project.** Topics: instructions, hooks-permissions, memory.
  - `writes-project-instructions`: Writes instructions that remove a
    recurring agent mistake
  - `sets-permissions`: Sets permissions to the least the work needs
  - `adds-a-hook`: Adds a hook that enforces a rule the instructions cannot
  - `manages-memory` (`expert`): Manages what the agent carries between
    sessions
- `customizing-agents/writes-skill`: **Writes a reusable agent skill.**
  Topics: skills, instructions.
  - `chooses-skill-over-tool`: Chooses between a skill, a tool and an
    instruction for a need
  - `packages-a-procedure`: Packages a repeatable procedure as a skill
    another person's agent can use
  - `discloses-progressively`: Structures a skill so the agent loads only
    what it needs
- `customizing-agents/connects-tools-safely`: **Connects an agent to tools
  and data safely.** Topics: mcp, hooks-permissions, safety/agent-risk.
  - `adds-a-tool`: Adds a tool via MCP or CLI with least privilege
  - `weighs-tool-cost`: Explains the token and risk cost of a tool before
    adding it
  - `hardens-a-connection` (`expert`): Hardens a tool connection against
    injection and exfiltration

### Area `building-agents`: Building agents

Topics:

| Topic id                           | Name                          | Concepts                                                                                                                                | Prerequisites                                         | Existing material                            |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `building-agents/tool-use`         | Tool use                      | function calling, tool schema design, N x M integration problem, error handling, parallel calls                                         | concepts/what-is-an-agent                             | AEC 03                                       |
| `building-agents/agent-loop`       | The agent loop and harness    | loop from scratch, Agent SDK, stop conditions, unbounded-loop pitfalls                                                                  | tool-use                                              | AEC 13 (most exercise-shaped)                |
| `building-agents/patterns`         | Design patterns               | ReAct, reflection, planning, plan-then-execute vs reactive, hierarchical planning                                                       | agent-loop                                            | AEC 04, 06; DL.AI 11 M2, M5                  |
| `building-agents/orchestration`    | Orchestration and multi-agent | code- vs model-driven orchestration, sequential / hierarchical / collaborative, orchestration tax                                       | patterns                                              | AEC 07, 18                                   |
| `building-agents/retrieval-memory` | Agentic retrieval and memory  | agentic RAG loop, memory storage choices, when basic RAG suffices                                                                       | agent-loop, concepts/grounding                        | AEC 05, 08                                   |
| `building-agents/evaluation`       | Evaluation and testing        | quality pillars, rubrics, metrics that cannot be gamed, trajectory evaluation, LLM as judge, golden sets, error analysis, observability | agent-loop, coding-with-agents/verification           | AEC 09; DL.AI 11 M4; Brilliant VER-7 (ideas) |
| `building-agents/production`       | Guardrails and production     | defence layers, eval-gated deploys, rollout strategies, cost, agent-specific security risks, protocols (MCP, A2A)                       | evaluation, safety/governance, customizing-agents/mcp | AEC 10, 11, 14; Brilliant SEC-4 (ideas)      |

Competencies and objectives:

- `building-agents/builds-agent-loop`: **Builds a tool-using agent loop.**
  Topics: tool-use, agent-loop, retrieval-memory.
  - `defines-a-tool`: Defines a tool with a schema the model uses correctly
  - `implements-the-loop`: Implements the loop with error handling and a
    stop condition
  - `adds-retrieval`: Adds retrieval or memory and knows when basic RAG is
    enough
  - `uses-an-sdk` (`expert`): Rebuilds the loop on an agent SDK and explains
    what the SDK took over
- `building-agents/evaluates-agents`: **Evaluates an agent's quality
  systematically.** Topics: evaluation.
  - `writes-a-rubric`: Turns "good" into scorable criteria
  - `builds-a-golden-set`: Builds a representative input set with expected
    qualities
  - `grades-trajectories`: Grades the path the agent took, not only the
    final answer
  - `avoids-gamed-metrics` (`expert`): Chooses metrics that cannot improve
    without the real quality improving
- `building-agents/orchestrates-agents`: **Designs and orchestrates
  multi-agent systems.** Topics: patterns, orchestration.
  - `picks-a-pattern`: Picks a design pattern for a task and says why
  - `justifies-orchestration-cost`: Justifies the coordination cost of more
    than one agent
  - `composes-patterns` (`expert`): Composes patterns and names the failure
    modes of the composition
- `building-agents/runs-in-production`: **Runs an agent in production with
  guardrails.** Topics: production, safety/governance, customizing-agents/mcp.
  - `gates-on-evals`: Gates a deploy on evaluation results
  - `layers-defences`: Layers policy, filtering and monitoring around the
    agent
  - `mitigates-agent-risks`: Mitigates injection, exfiltration and
    over-permission in a running agent
  - `manages-cost-and-rollout` (`expert`): Manages cost and rolls out
    changes without breaking users

## Worked example: behaviours as triples

For `using-agents/delegates-and-checks/writes-a-brief` (`base`). This is the
format every objective's behaviours take: one-sentence claim, a why, one
example. Two to six per objective.

1. **Claim:** A brief states the goal, the context the work needs and the
   limits it must stay within. **Why:** an agent fills in whatever is left
   unsaid with plausible defaults, so what it must not touch matters as much
   as what it must do. **Example:** "Update the pricing table in
   `docs/pricing.md` from this spreadsheet; do not change any other file"
   stays on task, where "update the pricing" may rewrite the page.
2. **Claim:** Done-criteria are written before the work starts. **Why:**
   without them the result is judged by feel, and a plausible result is
   accepted as a correct one. **Example:** "Done when every row in the
   spreadsheet appears once in the table and the totals match" turns review
   into a check rather than a read.
3. **Claim:** The brief names the information the agent should use and
   where it is. **Why:** an agent that has to guess sources will pick the
   most available one, not the right one. **Example:** pointing at the
   approved spreadsheet, not "the latest numbers", prevents the agent from
   pulling last quarter's figures from an old email.

## Alignment

Kept per competency in the YAML; summarised here for the two external
frameworks we know. Codes are cited as facts; see
[explore/09](../plan/explore/09-brilliant-skills-map.md) for what they
mean.

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

Not covered by us: Brilliant SEC-1, SEC-2 (general secure coding), SPC-1,
SPC-2 (interaction and data-model design). Those are software engineering,
not AI-specific, and stay out of scope.

## Differentiation by routing

Differentiation happens through position in the graph, not through
variants of a page. Content is written once.

- **Lessons declare `assumes` and `extends-to`.** `assumes` lists the
  objectives a lesson relies on, each pointing at the lesson section that
  teaches it. `extends-to` lists the next lesson, a specialization topic or
  a short.
- **Checkpoints route.** A failed or skipped checkpoint shows a card naming
  the assumed objective and the section to revisit. Passing every checkpoint
  in a lesson at the first attempt shows the extensions. Both come from the
  map and the local progress record.
- **Comfort level is a routing default.** `less` inserts the assumed
  objectives' sections into the path before each lesson and keeps tutor mode
  hint-heavy. `more` offers a skills check at the start of a lesson (one
  checkpoint per served objective), skips what is passed, and surfaces
  extensions. Same pages either way.
- **One exercise per lesson,** written once, ending with an optional
  one-line stretch goal for the confident learner. No exercise variants.
- **Paths render three lanes:** behind (assumed objectives not yet passed),
  on target (the path's next lesson), ahead (extensions). "You are here"
  marks the learner.
- **Reviews feed routing.** A review item failed twice in a row marks its
  objective as "behind" in the path lanes and offers the section that
  teaches it, exactly like a failed checkpoint. See
  [spec 003](./003-spaced-review.md).
- **Tutor mode routes the same way:** on a wrong answer it asks a diagnostic
  question, and if the gap is upstream it points at the upstream section
  rather than re-explaining.

Worked example, the thin-slice lesson *Your first session with a coding
agent*: it serves `ships-with-agent/runs-a-session` and
`gives-the-right-context`; it assumes `delegates-and-checks/writes-a-brief`
(section "Writing the brief" in *Delegating a task to an agent*) and
`judges-agent-risk/names-blast-radius`; it extends to *Plan, implement,
verify* and a short on permission modes. Its first checkpoint asks the
learner to fix a weak brief; a fail routes to the Delegating section, a
clean run offers the extensions. Its one exercise is a scripted change in
the fixture repository, with the stretch goal "now ask the agent for a
refactor you choose, and review it the same way".

Routing needs the objective graph to be real and needs somewhere to route
to. With six lessons in release 1 there is little of either; the mechanism
is designed now so the data model and components allow for it, and it
becomes useful as the graph fills in.

## Cross-area edges worth drawing

- `safety/agent-risk` is a prerequisite topic for `coding-with-agents/quality`
  and `customizing-agents/hooks-permissions`; safety is a gate into
  Engineering, not a track of its own after Foundations.
- `concepts/what-is-an-agent` is the hub: five topics depend on it. It is
  the anchor for the map's first visual.
- `coding-with-agents/context` and `customizing-agents/instructions` are
  `related`, taught from the user side and the author side respectively.
- `coding-with-agents/verification` is a prerequisite of
  `building-agents/evaluation`: you verify one piece of work before you
  measure a system.
- `building-agents/evaluation` should come before `patterns` and
  `orchestration` in any path (Ng's ordering), even though it is not a hard
  prerequisite.
- Several competencies draw on topics from two areas. That is expected;
  competencies are not confined to their area's topics.

## Paths (first cut)

| Path               | Audience                  | Lessons                                                                                             | Goal                                                 |
| ------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `knowledge-worker` | Everyone                  | all of Foundations, in area order                                                                   | all Foundations competencies at `base`               |
| `engineer`         | Software engineers        | Foundations, then coding-with-agents, then customizing-agents                                       | `ships-with-agent` and `configures-agent` at `base`  |
| `agent-builder`    | Engineers building agents | Foundations (agent and safety parts), building-agents/tool-use through evaluation, then customizing | `builds-agent-loop` and `evaluates-agents` at `base` |

## Release-1 thin slice

One lesson per area, chosen so the shape is visible end to end and each
lesson exercises a different interaction type.

| Area               | Lesson (working title)                 | Mode        | Covers topic                     | Serves objectives                                                                  | Basis                                     | Interaction to prove     |
| ------------------ | -------------------------------------- | ----------- | -------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------ |
| concepts           | How a language model works             | explanation | concepts/how-models-work         | `explains-models/explains-generation`, `names-failure-modes`                       | new, AEC 02 first half                    | `choice`, widget         |
| safety             | Why agent safety is different          | explanation | safety/agent-risk                | `judges-agent-risk/names-blast-radius`, `chooses-human-in-loop`                    | AEC 10 first half, rewritten for everyone | `scenario`, pitfall      |
| using-agents       | Delegating a task to an agent          | tutorial    | using-agents/delegating          | `delegates-and-checks/writes-a-brief`, `chooses-autonomy`, `reviews-against-brief` | new; a real delegation in a sandbox       | `sort` (autonomy levels) |
| coding-with-agents | Your first session with a coding agent | tutorial    | coding-with-agents/first-session | `ships-with-agent/runs-a-session`, `gives-the-right-context`                       | AEC 12 public rewrite; fixture repository | `predict`, `exercise`    |
| customizing-agents | Project instructions: AGENTS.md        | tutorial    | customizing-agents/instructions  | `configures-agent/writes-project-instructions`                                     | AEC 15 with the builder widget            | `repair`, widget         |
| building-agents    | Building your first agent              | tutorial    | building-agents/agent-loop       | `builds-agent-loop/defines-a-tool`, `implements-the-loop`                          | AEC 13                                    | `predict`, `order`       |

Each slice lesson gets served, assumed and extends-to objectives in
frontmatter, one pitfall, one checkpoint per served objective, one exercise
with a stretch goal, and a recap. Tutorial-mode lessons follow the
paragraph-then-example rhythm and use `predict` for every example that
runs. Finishing any slice lesson schedules its checkpoints for review, so
spec 003 is exercised by release 1 too. Tutorial-mode lessons run in a resettable
fixture. The sidebar shows only these six areas' real lessons; no stub
pages. Tutor mode is tested against these six.

## Open questions

- Whether `concepts/grounding` belongs in Foundations or moves to Engineering
  as a `building-agents` topic only. Leaning: keep a short version in
  Foundations because knowledge workers meet RAG-based products daily.
- Whether `safety/governance` is worth a Foundations lesson or only the
  `lead` objective `sets-oversight`. Leaning: one short lesson.
- Naming of `hooks-permissions`; it is Claude Code specific where the rest
  is not. Decide when writing the lesson.
- Whether Foundations should carry any `expert` or `lead` objectives at all.
  Two are drafted above (`keeps-a-check-habit`, `sets-oversight`); drop them
  if Foundations stops at `base` by design.
- Whether `coding-with-agents/specification` deserves a competency of its
  own or folds into `ships-with-agent`. Kept separate for now because
  Brilliant's evidence is that specifying is where human skill concentrates.
