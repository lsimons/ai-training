# Exploration: career-model competency catalog and DeepLearning.AI courses

Explored 2026-09-19 by a read-only agent.

## 1. `career-model` (`~/git/lsimons/archive/career-model`)

Vue 2 plus Vuetify plus D3 single-page app, monorepo, Apache-2.0, "interactive
career path planner", once live at career.model.tools.

### Data format: CSV skeleton plus YAML detail

Two layers, all static files under `packages/career-model-ui/public/`:

1. **Structure**: one CSV per category
   (`competency-list-{general,software-production,software-management,software-technology}.csv`).
   Header `Competency Area, Competency Group, Competency`; rows nest by prefix,
   so the tree is arbitrary depth.
2. **Detail**: one YAML per node in `public/competencies/<category>/<area>/<competency>.yaml`.
   44 files exist; most are stubs (`definition: todo`); `construction/coding.yaml`
   is fully fleshed out.

### Schema

Category YAML: `definition`, `areas: {<Area>: {definition}}`.

Competency YAML (all optional except `definition`): `definition`,
`books[] {title, isbn, href}`, `courses[] {title, href, free, duration}`,
`references[] {title, href, description}`,
`behaviors: {base[], expert[], lead[]}`,
`links: {prerequisites[], related[], specializations[]}` (each link is a
display-name path `Category > Area > Competency`), plus HTML text blocks
`learningPath` and `evaluation`.

Sample (`software-production/architecture/c4.yaml`):

```yaml
definition: The C4 Model is a visual model for software architecture based on a hierarchy of context, containers, components, and code.
references:
  - title:       The C4 model for visualizing software architecture
    href:        https://c4model.com/
    description: Official C4 website with written documentation, video training, and other resources.
```

### Grouping

Categories (4): General, Software Production, Software Management, Software
Technology. Areas per category; Software Production has Requirements,
Interaction Design, Architecture, Construction, Test, Maintenance. Competencies
and sub-competencies below each area. **Levels are behaviors within a
competency** (`base / expert / lead`), not separate nodes; there is no role or
seniority ladder.

### Visual map

`src/components/CompetencyGraph.vue`: a D3 v5 force simulation drawing circles
into an inline SVG, pastel color per area, props for width, height, max level
and category. Used on the home page (four small maps, one per category) and on
category, area, and competency views. Loading in `src/store/competencies.js`
(papaparse plus the `yaml` package). Design sketches in
`docs/design/competencies.drawio`.

### Reuse for a learning-path / topic map

Good fit with modest changes. Already present: a hierarchical topic tree
decoupled from detail files; a typed link graph (prerequisites, related,
specializations), which is the edge set a topic map needs; curated resources
(books, courses with free/duration, references); a `learningPath` narrative; an
`evaluation` field that maps onto assessment; three proficiency tiers. Gaps: no
explicit goals or outcomes, no learner state, no sequencing beyond
prerequisites, no stable IDs (display-name paths are brittle), levels are prose
not structured criteria, and most detail files are unwritten. Keep the
"cheap tree, rich leaves" idea; the tree can just be folder structure. The D3
force graph is inspiration only; Vue 2 and D3 v5 are end of life.

## 2. `ai-deep-learning` (`~/git/lsimons/ai-deep-learning`)

Personal fetcher turning DeepLearning.AI courses into local Markdown. Also
`the-batch/ai-engineering-skills-map.md` with Andrew Ng's AI Engineering Skills
Map series, relevant for sequencing.

**Copyright: the material under `courses/` is DeepLearning.AI's and must not be
redistributed or reused. Topic coverage and sequencing inspiration only.**

Reading order from `COURSES.md` with topic coverage (AIC = AI concepts, SAFE =
AI safety, USE = using agents, SWE = AI-assisted software engineering, CUST =
customizing agents, BUILD = building agents):

| #   | Course                                          | One line                                                                   | Topics           |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------- | ---------------- |
| 1   | ChatGPT Prompt Engineering                      | Two prompting principles, then summarize/infer/transform/expand, a chatbot | AIC              |
| 2   | Generative AI for Everyone                      | What genAI can and can't do, how projects get built, societal impact       | AIC, SAFE        |
| 3   | AI Prompting for Everyone                       | Power user: search and research, AI as thought partner, sycophancy         | AIC, USE, SAFE   |
| 4   | AI Python for Beginners                         | Python from zero with an LLM as coding assistant                           | SWE (entry)      |
| 5   | Claude Code: A Highly Agentic Coding Assistant  | Codebase comprehension, features, tests, refactoring, GitHub, hooks        | USE, SWE, CUST   |
| 6   | Intro to Generative AI for Software Development | How LLMs work, pair coding, LLM-driven code analysis                       | AIC, SWE         |
| 7   | Team Software Engineering with AI               | Testing, debugging, documentation, dependency management                   | SWE              |
| 8   | AI-Powered Software and System Design           | Config-driven development, schema design, design patterns                  | SWE              |
| 9   | MCP: Build Rich-Context AI Apps with Anthropic  | MCP servers and clients exposing tools, data, and prompts                  | CUST, BUILD      |
| 10  | Agent Skills with Anthropic                     | Packaging expertise as skills; skills vs tools, MCP, and subagents         | CUST, BUILD      |
| 11  | Agentic AI                                      | Task decomposition, evals, reflection and tool-use patterns, autonomy      | BUILD, USE, SAFE |

Sequencing shape: foundations without code, then programming with AI, then AI
in the software engineering lifecycle, then extending agents (MCP, skills),
then designing agents. Notable gap: **AI safety is nowhere a first-class
track**; it is diffused into the "for everyone" and evals material.
