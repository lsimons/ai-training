# Exploration 06: lesson inventory of the source courses

Captured 2026-09-19. Adds per-lesson detail to
[explore/02](./02-agent-engineer-course.md) and
[explore/05](./05-career-model-and-deeplearning-ai.md). Areas are numbered as in
the plan: **1** concepts, **2** safety, **3** using agents, **4** AI-assisted
software engineering, **5** customizing agents, **6** building agents.

## `agent-engineer-course` (Apache-2.0, may be integrated)

Content root: `docs/src/content/docs/`. Sidebar hardcoded in
`docs/astro.config.mjs`: Part 1 (01-10), Part 2 (11-14), Part 3 (15-19).

No duration metadata exists. Estimates below are prose word counts at about
180 wpm. Total prose is about 82k words, roughly 7.5 h of reading; with the
exercises and build lessons 12-16 h.

### Part 1: fundamentals

| #   | File                                  | Summary                                                                               | Length     | Areas       | Audience           | Interactive / exercise                                                                     |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------- | ---------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------ |
| 01  | `01-what-are-ai-agents.md`            | LLM vs agent, brain/hands/loop model, autonomy-level taxonomy, when a prompt suffices | 3.3k, 20 m | 1, 3        | KW + engineer      | `agent-levels-explorer` widget; ELI5                                                       |
| 02  | `02-how-agents-think.md`              | Tokens and context, reasoning strategies, model choice, system prompts, sampling      | 4.6k, 25 m | 1           | Both, 2nd half eng | `context-window-explorer`; ELI5                                                            |
| 03  | `03-tools-giving-agents-hands.md`     | Tool types, function calling, schema design, N x M problem, checklist                 | 4.6k, 25 m | 1, 6        | Engineer           | `tool-call-flow`; ELI5; design checklist                                                   |
| 04  | `04-agentic-design-patterns.md`       | ReAct, Reflection, Tool Use, Planning; trade-offs and combinations                    | 3.4k, 20 m | 1, 6        | Engineer           | Has objectives + prerequisites; `pattern-visualizer`; ELI5                                 |
| 05  | `05-memory-and-context.md`            | Context engineering, memory kinds, sessions, memory vs RAG, context rot, storage      | 4.2k, 25 m | 1, 5, 6     | Engineer           | Objectives + prerequisites; `memory-explorer` (3 views); ELI5                              |
| 06  | `06-planning-and-reasoning.md`        | Mission/scan/think/act/observe loop, plan-then-execute, hierarchy, CoT/ToT            | 4.6k, 25 m | 1, 6        | Engineer           | Objectives + prerequisites; `planning-sim`; ELI5                                           |
| 07  | `07-multi-agent-systems.md`           | Architectures, communication, roles, refund walkthrough, orchestration tax            | 4.7k, 25 m | 1, 6        | Engineer           | `multi-agent-viz`; **design exercise** (3 scenarios), convertible to a scenario checkpoint |
| 08  | `08-agentic-rag.md`                   | Basic RAG limits, retrieve/evaluate/refine loop, when basic RAG is enough             | 3.6k, 20 m | 1, 6        | Engineer           | `rag-viz`; ELI5; **build exercise** (2-4 h)                                                |
| 09  | `09-evaluating-and-testing-agents.md` | Four quality pillars, metrics, trajectories, LLM-as-judge, eval harness               | 6.5k, 35 m | 1, 2, 6     | Engineer           | `eval-dashboard` (largest widget); ELI5; **eval-suite exercise** (3-5 h)                   |
| 10  | `10-guardrails-and-safety.md`         | Why agent safety differs, defence layers, prompt injection, human-in-the-loop         | 6.4k, 35 m | **2**, 1, 6 | Both               | `pillars-viz` + `guardrails-viz`; safety checklist. Best KW safety material in either repo |

### Part 2: building and shipping

| #   | File                                     | Summary                                                                 | Length             | Areas   | Audience | Interactive / exercise                                                                                  |
| --- | ---------------------------------------- | ----------------------------------------------------------------------- | ------------------ | ------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 11  | `11-from-prototype-to-production.md`     | Production gap, eval-gated deploys, CI/CD, rollout strategies, cost     | 4.1k, 25 m         | 6, 4, 2 | Engineer | `pipeline-viz`; readiness checklist                                                                     |
| 12  | `12-getting-started-with-claude-code.md` | Claude Code + API via LiteLLM proxy + Agent SDK setup, which model when | 4.2k, 25 m + setup | 3, 4, 6 | Engineer | `claude-stack` chooser; setup walkthrough. **Written around an internal proxy; needs a public rewrite** |
| 13  | `13-building-your-first-agent.md`        | Agent loop from scratch in six steps, then with the Agent SDK           | 3.8k, 20 m + 2-3 h | 6, 4    | Engineer | Only lesson with no widget; most exercise-shaped                                                        |
| 14  | `14-agent-protocols-mcp-and-a2a.md`      | Why protocols, MCP and A2A, composition, security, ecosystem            | 4.4k, 25 m         | 5, 6, 2 | Engineer | `mcp-a2a-viz`; ELI5. Placeholder comment at line 187                                                    |

### Part 3: deep dives

| #   | File                          | Summary                                                                        | Length     | Areas    | Audience | Interactive / exercise                                                                       |
| --- | ----------------------------- | ------------------------------------------------------------------------------ | ---------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| 15  | `15-agents-md.md`             | AGENTS.md contents, monorepo hierarchies, comparison, full example             | 2.6k, 15 m | 5, 4     | Engineer | `agents-md-builder` (genuine authoring tool, best widget to carry over); **try-it exercise** |
| 16  | `16-mcp-deep-dive.md`         | MCP architecture, MCP vs CLI, security failure modes, server decisions         | 3.2k, 20 m | 5, 6, 2  | Engineer | `mcp-deep-viz` with token/cost comparator; decision tree                                     |
| 17  | `17-agent-skills.md`          | Skills vs tools, spec, progressive disclosure, writing good skills             | 3.3k, 20 m | **5**, 6 | Engineer | `skill-loading-timeline`; embedded example skills                                            |
| 18  | `18-orchestrators.md`         | Code- vs model-driven orchestration, patterns, SDK vs LangGraph, anti-patterns | 5.1k, 30 m | 6, 5     | Engineer | `orch-playground`; longest lesson                                                            |
| 19  | `19-where-to-go-from-here.md` | Recap, four learning paths, resources, project checklist                       | 4.0k, 20 m | 3, 6     | Both     | `learning-path` two-question quiz; the only quiz-like element in the site                    |

### Observations for integration

- Structure is consistent: intro (or objectives + prerequisites), body, optional
  `## ELI5`, worked example, `## Key takeaways`, further reading.
- Only 04, 05, 06 have explicit `## What you will learn`. The `/teach` skill
  quizzes off those bullets; adding objectives everywhere is cheap and valuable.
- ELI5 sections in 01-06, 08, 09, 13, 14, 19 are a ready "less comfortable"
  layer for the two-comfort-level Engineering lessons.
- Exercises are sparse and prose-only (07, 08, 09, 13, 15). No quizzes, no
  checkpoints, no progress state in the site.
- 18 of 19 lessons have one or two inline vanilla-JS widgets, no shared
  component library, no persistence. Rebuilding these as reusable components
  with local-storage state is the main engineering work.
- Coverage: areas 1, 5, 6 strong; area 2 is one lesson plus scattered sections;
  area 3 only via 01/12/19; area 4 thin (12, 13, 15, parts of 11).
- Knowledge-worker usable as-is: 01, 10, first half of 02.
- Public-repo blockers: lesson 12 and `index.mdx` internal proxy framing,
  lesson 14 placeholder.

### The `/teach` skill

Single file: `.claude/skills/teach/SKILL.md`. Invoked as
`/teach [lesson | resume | review | status]`. Key behaviours:

- Tutor, not lecturer: the learner reads in the browser; never paste lessons.
- Progress in a `teach-progress.md` in Claude's auto-memory directory: lesson
  table (read / quiz / score / weak spots), a spaced-recall review queue,
  learner notes. Written after every quiz.
- Lesson list discovered dynamically from frontmatter; never hardcoded.
- Boots the dev server if down, polls until 200, opens the lesson URL, leaves
  the server running.
- One recall question from the review queue before each new lesson.
- Reads the lesson markdown first; lessons over ~700 lines split at H2
  boundaries with a quiz per chunk. Widgets are part of the lesson: ask the
  learner what they observed.
- Quiz: 3-5 questions, one at a time, each mapped to an objective; recall,
  apply, contrast; no true/false; one question must reference a page artefact.
- Hard rule: never state the answer to an open question. Three hint tiers:
  reframe, locate, scaffold. Pass = all objectives touched, at most one miss;
  never blocks moving on.
- Terse tone, no praise inflation, fast-forward for experts, respect
  read-without-quiz.

Transfers directly to ai-training tutor mode: dynamic discovery, hint ladder,
never-reveal rule, artefact-referencing question, H2 splitting. Progress
coupling to auto-memory is orthogonal to the site's local-storage model and
could complement it.

## `ai-deep-learning` (DeepLearning.AI, inspiration only)

Reading order in `COURSES.md`; each course has a generated README with a
lesson table. Lesson types (`video`, `video_reading`, `video_notebook`,
`reading_material`, `quiz`, ungraded/graded lab) are a useful vocabulary.

| Seq | Course                                          | Level, length      | Coverage                                                                                          | Areas   | Audience  |
| --- | ----------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- | ------- | --------- |
| 1   | ChatGPT Prompt Engineering for Developers       | beginner, 1h40     | Two prompting principles; summarise / infer / transform / expand; chatbot                         | 1       | KW        |
| 2   | Generative AI for Everyone                      | beginner, 5h       | Intro; projects; business and society                                                             | 1, 2    | KW        |
| 3   | AI Prompting for Everyone                       | beginner, 7h       | Finding information; AI as thought partner (incl. sycophancy); multimedia and code                | 1, 3, 2 | KW        |
| 4   | AI Python for Beginners                         | beginner, 11h30    | Python basics through packages and APIs                                                           | 4 entry | KW to eng |
| 5   | Claude Code: A Highly Agentic Coding Assistant  | intermediate, 2h   | Setup, features, testing, parallel work, GitHub and hooks, notebook to dashboard, Figma           | 3, 4, 5 | Engineer  |
| 6   | Intro to Generative AI for Software Development | 6h26               | Intro; pair-coding; code analysis                                                                 | 1, 4    | Engineer  |
| 7   | Team Software Engineering with AI               | 12h24              | Testing and debugging; documentation; dependency management                                       | 4       | Engineer  |
| 8   | AI-Powered Software and System Design           | 12h41              | Config-driven development; databases; design patterns                                             | 4       | Engineer  |
| 9   | MCP: Build Rich-Context AI Apps                 | intermediate, 2h   | Why MCP through remote deployment; very hands-on                                                  | 5, 6    | Engineer  |
| 10  | Agent Skills with Anthropic                     | beginner, 2h19     | Why skills, vs tools/MCP/subagents, creating, API / Code / SDK                                    | 5, 6    | Engineer  |
| 11  | Agentic AI                                      | intermediate, 9h55 | Workflows and autonomy degrees; reflection; tool use; evals and error analysis; autonomous agents | 6, 3, 2 | Engineer  |

`the-batch/ai-engineering-skills-map.md` (own synthesis of Ng's Batch series)
names four skills: building/deploying AI apps, software engineering
fundamentals, using coding agents, shaping the build. Maps onto areas 6, 4, 3
and justifies the area split.

### Sequencing lessons

1. Three ramps: no-code foundations, programming with AI, AI in the SDLC,
   extending agents, designing agents. `agent-engineer-course` lacks the
   front end.
2. Every DL.AI module ends in a quiz and usually a lab. This is the biggest
   gap against the plan's checkpoint/quiz model.
3. "Degrees of autonomy" is an early anchor concept in both; good for the
   topic map.
4. Ng puts evals and error analysis early and repeatedly; `agent-engineer-course`
   defers them to lesson 09.
5. Safety is not a first-class track anywhere; area 2 needs original material.
6. Skills and MCP each carry a 2 h hands-on course; area 5 can go deeper.
7. DL.AI units are 3-25 min. Split the 950+ line lessons (09, 10, 18) into
   screen-sized units.
