# Exploration 11: roadmap.sh

Captured 2026-09-19/20 in a logged-in session (Leo's free account) with a
driven browser, plus the public map data and the content repository.
Sources: <https://roadmap.sh/ai-engineer>, <https://roadmap.sh/ai-agents>,
<https://roadmap.sh/ai>, the map JSON served at `https://roadmap.sh/<slug>.json`,
and <https://github.com/nilbuild/developer-roadmap> (the repository moved
from `kamranahmedse`).

**License, important:** the repository license is a custom personal-use
notice, not an open license. Everything including text and images is
copyrighted; use is allowed for personal purposes only; republishing
content or images anywhere is forbidden without consent. The site is
"community created" but the terms are not. This note records structure,
mechanics and topic titles as facts. No roadmap text may be reused.

## What it is

Role-based and skill-based developer roadmaps drawn as a vertical flowchart
of topics with per-topic resource links, plus progress tracking, projects,
and a paid AI layer ("AI Tutor") that generates explanations, quizzes,
courses, guides, roadmaps and learning plans on demand. Free tier: 20 AI
chats, 2 courses, 2 quizzes, 2 guides, 2 roadmaps, 2 plans. About 3.2
million registered users, 367k GitHub stars.

## The map

### Data model

Each roadmap is one JSON document (`nodes`, `edges`, `dimensions`,
`relatedRoadmaps`, `questions`, `aiCourses`, `type` = role or skill),
produced by their editor (draw.roadmap.sh) on a React Flow style canvas.
Node types and counts:

| Type                     | AI Engineer | AI Agents | Purpose                                                          |
| ------------------------ | ----------- | --------- | ---------------------------------------------------------------- |
| `title`                  | 1           | 1         | The roadmap name                                                 |
| `topic`                  | 22          | 34        | Yellow box on the spine, clickable, has content                  |
| `subtopic`               | 167         | 67        | Beige box hanging off a topic, clickable, has content            |
| `label`                  | 37          | 29        | Plain text used as a group heading, no content                   |
| `paragraph`              | 5           | 12        | Bordered text box, notes such as "Pre-requisites (one of these)" |
| `section`                | 17          | 15        | Invisible grouping rectangle                                     |
| `button`                 | 11          | 7         | Link to another roadmap                                          |
| `linksgroup`             | 1           | 1         | "Related Roadmaps" list                                          |
| `horizontal`, `vertical` | 18          | 23        | Dotted or solid connector lines drawn as nodes                   |
| edges                    | 41          | 25        | Real edges, `solid` or `dashed`, few; most structure is visual   |

So the map is a **drawing, not a graph**. Grouping is by position and by
connector lines; only 41 of 279 nodes in AI Engineer are joined by real
edges, and there is no prerequisite semantics. Topic and subtopic are the
only nodes that carry content, and the parent relation is stored on the
rendered SVG (`data-parent-id`) rather than in the JSON.

### Content per node

One Markdown file per topic or subtopic in the repository:
`roadmaps/<slug>/content/<topic-slug>@<node-id>.md`. The node id in the
file name is the only link between drawing and text. Contributing rules:
one paragraph of plain explanation, at most eight links, each typed
`@official@`, `@opensource@`, `@article@`, `@course@`, `@podcast@`,
`@video@`, `@book@`, rendered as badges and split into free and premium
(sponsored) resources. AI Engineer has 194 content files, AI Agents 101.

### Topics covered

AI Agents (skill roadmap, 3640 px tall): prerequisites (backend, git, REST),
LLM fundamentals (tokenization, context windows, pricing, generation
controls, open vs closed weights, streaming, reasoning models, fine-tuning
vs prompting, embeddings, RAG basics), AI Agents 101 (what agents are, what
tools are, the agent loop drawn as four numbered steps: perception, reason
and plan, acting, observation and reflection; example use cases), prompt
engineering (six "writing good prompts" rules, CoT, ToT), tools and actions
(tool definition: name, schema, error handling, examples; example tools;
MCP with hosts, clients, servers, local vs remote), agent memory (short and
long term, episodic vs semantic, RAG, summarisation, forgetting), agent
architectures (RAG agent, ReAct, planner-executor, DAG agents, multi-agent,
self-critique), building agents (from scratch: API calls, the loop, parsing,
error and rate-limit handling; native function calling per vendor;
frameworks), evaluation and testing (metrics, unit and integration tests,
human in the loop, LangSmith, Ragas, DeepEval), debugging and monitoring
(tracing, observability tools), security and ethics (prompt injection, tool
sandboxing and permissioning, PII, bias guardrails, red teaming).

AI Engineer (role roadmap, 5794 px tall): introduction (what an AI engineer
is versus an ML engineer, impact on product), working with LLMs and common
terminology, pre-trained models by vendor, how LLMs work, prompt engineering
and prompt anatomy, context engineering (a whole column: context layer,
sources, security, evaluation, memory systems, long context, multi-agent
context sharing, failure modes, context warehouses), AI safety and ethics
(injection, bias, privacy, adversarial testing, moderation APIs, end-user
ids, constraining inputs and outputs), open versus closed models and
platforms (LM Studio, Hugging Face, Ollama, vendor APIs, OpenRouter),
embeddings and vector databases, RAG, agents and MCP, multimodal AI,
development tools, LLM observability and evaluations (deterministic,
model-based, human; tools), AI-assisted coding tools (Claude Code, Codex,
Cursor, Devin, Replit, Gemini).

Overlap with our map ([spec 002](../../spec/002-topic-map.md)): most of
our `concepts` topics, all of `building-agents`, `customizing-agents/mcp`,
and the security half of `safety`. Not present anywhere on roadmap.sh: our
knowledge-worker material (responsible use, verifying output, delegating,
choosing tools) and most of `coding-with-agents` except as a list of tool
names. Their unit is a technology or term; ours is a competency.

## Interaction on the roadmap page

- **Header**: bookmark, "prefer roadmap.sh on Google", subscribe, download
  the map as an image, share. Tabs: Roadmap, Projects, AI Tutor;
  Personalize.
- **Progress bar** across the top with milestone labels: Getting Started,
  Halfway, Almost There, Complete, plus a percentage. Marking one of 189
  nodes done showed 1%.
- **Click a topic**: a right-hand drawer opens with tabs **Resources** and
  **AI Tutor**, status buttons **Learning / Done / Skip**, the title, the
  one-paragraph content, a **Learn with AI** box with **Quick Explain**,
  **Teach Me**, **Quiz me**, then Premium Resources (sponsored) and Free
  Resources as typed badges. Done strikes the node through on the map and
  fills it grey; Skip and Learning have their own styles. Toggling Done
  again clears it.
- Each topic also has a standalone page at `/<roadmap>/<slug>@<id>` with
  the same content and links, for search engines and sharing.
- A floating **AI Tutor: "Have a question? Type here"** bar sits over the
  map on every roadmap page, opening a roadmap-scoped chat ("Roadmap Chat",
  20 free messages).

## The AI layer

Everything is generated on demand, streamed, and counted against a quota.
Every AI surface carries "AI can make mistakes, verify important
information".

### Quick Explain

Switches the drawer to the AI Tutor tab and streams a structured
explanation of the topic: **What it is**, **How it works**, **Why this
matters**, **Common misunderstandings**, **Concrete example** (with code),
in about ten seconds. The Explain button is a menu: Explain the topic,
List the key points, Summarize the topic, Explain like I am five, Why is
it important. A chat box below takes free questions "about the lesson".
Each use costs one chat (18 left became 17).

### Test my Knowledge

Same tab. Generates one open question at a time into the chat ("The LLM
itself is stateless, yet an agent loop maintains context across multiple
steps. Where is this state stored?") and grades the free-text answer in the
next turn. Costs a chat per question.

### Quiz me

Opens the quiz generator at `/ai/quiz/search?term=<topic>&format=mixed`,
which produces a titled quiz of nine questions. Formats: Multi-Choice,
Open-Ended, Mixed. Per question: four options, **Check Answer**, **Skip
Question**; after checking, the correct option is marked and a one-sentence
rationale appears ("Option 3 is correct because..."); wrong options are
disabled; **Next Question**. Progress "Question 1 of 9, 11% complete".
Costs one of two free quizzes.

### Teach Me

Generates a full course at `/ai/course/<slug>` in about 30 seconds: title,
tagline, About, "What this course covers" bullets, six modules of five
lessons each (30 lessons), with a **Regenerate** menu (plain, or with a
prompt). Free tier then allows five lesson bodies. Lesson pages are
generated on open in about 40 seconds and are substantial: several H2
sections, code blocks, a comparison table, a **Remember** callout, a
generated diagram placeholder, an **interactive step-through widget**
("Interactive Runtime Explorer" with Next phase and Reset), an inline
**Check your understanding** multiple-choice question with rationale on
answer, a **Summary**, **Can you answer these?** with four recall questions
each having an "Ask AI" link, **Quiz me on this lesson**, and an "Up next"
card. A collapsible **AI Instructor** chat sits beside every lesson. The
quality for a mainstream topic was good: correct, current, opinionated in
the right places, and it matched the structure of a well-written lesson.

### Other generators

`/ai/course`, `/ai/roadmap` and `/ai/guide` share one prompt box ("The more
detail you share, the more personalized your course") with example chips.
`/ai/plan` is a five-question wizard (main goal: get a job, grow in role,
build projects, strengthen fundamentals, explore a new field) producing a
learning plan. **Lesson Packs** at `/packs` are hand-written short courses
by the roadmap.sh team (for example Git Fundamentals, 14 lessons, 2.3 hours
read) with projects and "an AI tutor on the side". Personalize on the
roadmap page did not open in the driven browser and was not examined.

## Projects

Each role roadmap has a Projects tab with Beginner, Intermediate and
Advanced project ideas. A project page has: tags (technologies, topic,
level), description, **Project Requirements** as a numbered list with code
snippets, **Technologies to Use**, **What You Will Learn**, an optional
"Want to see a solution?" link, **Start Working**, **Submit Solution**, a
Community Solutions tab with upvotes, and a "687 Started" counter. This is
a project specification in the CS50 sense
([explore/03](./03-cs50-pedagogy.md)), with peer review instead of grading.

## Vocabulary

roadmap (role or skill), topic, subtopic, label, section, resources (free,
premium), Learning / Done / Skip, Personalize, Projects, AI Tutor, Quick
Explain, Teach Me, Quiz me, Test my Knowledge, Roadmap Chat, course, module,
lesson, guide, plan, quiz (multi-choice, open-ended, mixed), Lesson Pack,
Community Solutions.

## What to take from it

1. **The drawer pattern for topic nodes.** Click a node, get content,
   status, and actions in a side panel without leaving the map. This is how
   our topic map should open a topic: definition, concepts, lessons that
   cover it, and the learner's status, with the map still visible.
2. **Per-node status with three states** (learning, done, skip) written
   back onto the map as node styling, and a coarse milestone bar above the
   map. Our progress model has the states already; the visible strike
   through and the milestone bar are the cheap wins.
3. **Typed resource links** (`@official@`, `@article@`, `@video@`, ...)
   rendered as badges, ordered by type, capped per node. Adopt the type set
   for our `source` records and the eight-link cap.
4. **One-paragraph node content, links for depth.** Their discipline of a
   single plain paragraph per node is exactly the register we want for
   concept definitions in the glossary.
5. **AI actions scoped to a node**: explain, key points, ELI5, why it
   matters, quiz me, test my knowledge in free text. These are the
   scoped interactions the CS50 Duck note recommended
   ([explore/07](./07-scorm-interactions-and-duck-tutor.md)). Tutor mode
   should expose the same verbs per topic and per lesson, driven by our
   concept definitions and behaviours rather than a general prompt.
6. **Generated lesson anatomy as a checklist.** Their generated lessons
   contain the same parts our spec 001 lesson has (sections, callouts, an
   inline check, a summary, recall questions, a next card) plus a
   step-through widget. Confirms the lesson shape; also a warning that a
   competent generated lesson is now cheap, so our value is in the
   competency structure, the verified examples, the exercises, review and
   tutor grounding, not in prose alone.
7. **Project pages as specifications** with requirements, technologies,
   what you will learn and community solutions. A good template for our
   `project` unit; peer solutions are out of scope without a backend.
8. **Deep-linkable topic pages** beside the map, one URL per node, good for
   search and for the tutor to cite.

Not adopted: the drawing-as-map model (no prerequisite semantics, layout by
hand), sponsored "premium resources", quotas and upsell, and any of their
text or images, which the license forbids.
