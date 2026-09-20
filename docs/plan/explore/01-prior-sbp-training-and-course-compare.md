# Exploration: archived SBP AI-training repo + agent-course comparison

Explored 2026-09-19 by a read-only agent. Sources:

- `~/git/lsimons/archive/lsimons-ai-training`
- `~/git/lsimons/lsimons-arch/code/2026-09-19-agent-course-compare`

## 1. `archive/lsimons-ai-training`

**Status: scaffolding only. No training content was ever written.** The repo is
docs infrastructure (specs, plans, scripts) plus a placeholder Python package.
Plans P02 and P03 are still Draft.

**Tracks** (README.md, P01 "Goal"): three audience-specific tracks, modules of
30-90 minutes, standalone and combinable into workshops:

1. Knowledge workers, *Working with GenAI safely*: what GenAI is and isn't,
   prompting patterns, evaluating output, confidentiality, and data
   classification, approved tools.
2. Engineers, *Agentic Engineering safely*: agent loops, tool use, sandboxing
   and permission models, prompt and context engineering, testing AI-generated
   code, long-horizon autonomy failure modes.
3. Engineering leaders, *Implementing Agentic Engineering*: staffing models,
   review and quality gates, metrics, procurement and tooling, risk
   management, org evolution.

**Module list:** none exists. The unit of content is a "tutorial"
(`docs/tutorial/TNN-<slug>/`, a directory with `.qmd` plus rendered outputs);
only a placeholder `T01-ai-training-introduction` was planned. Tracks are
conceptual: a later `docs/tracks/` would stitch tutorials into curated audience
paths rather than store them (`docs/plan/P02-tutorial-scaffolding.md`).

**Authoring and tooling** (`docs/spec/S02-project-toolchain.md`): Quarto `.qmd`
rendered via `mdd` (editable path dependency on `../mdd`) to reveal.js HTML and
PPTX, PDF only when PowerPoint is present. mise pins Python 3.14 plus uv; ruff,
basedpyright (strict) and pytest as the CI gate. Shared design assets in
`docs/design/template/`. Known breakage: the editable `../mdd` path dependency
made GitHub Actions red.

**Pedagogy, progress, exercises, glossary:** essentially absent. Only traces:
S01 requires each spec to state audience, learning objectives, prerequisites
and delivery shape (slide deck, handout, exercise). No glossary, taxonomy,
assessments, or progress tracking anywhere.

**Worth reusing:** the three-track audience split and its topic lists; the
tutorial-as-directory layout with shared design assets; multi-format render with
graceful degradation; the numbered S/P/R/T document system
(`docs/spec/S01-spec-based-development.md`) and the "every plan ends in a spec"
rule; the scripts plus mise task ergonomics.

**Must drop for public open content:** the proprietary SBP license and
private/confidential banner; "tools approved for use inside SBP" and SBP data
classification framing; the SharePoint Stream video shortcode and Confluence
embed research; the private fork remotes; the `../mdd` and `../caseum` sibling
checkout assumptions.

## 2. `lsimons-arch/code/2026-09-19-agent-course-compare`

Files: `AGENTS.md`, `gen_course_comparison.py` (data-in-code generator, stdlib
only), `2026-09-19-agent-course-vs-dlai-comparison.html` (generated). A
three-way comparison: the Osmani-fork agent-engineer-course vs DeepLearning.AI
vs Anthropic Partner Academy, with CS50 AI as an optional foundation. Depth
labels: not-covered / mention / explained / hands-on.

**Conclusions:**

- Osmani is uniquely strong on orchestration frameworks beyond Anthropic's
  stack (L18), A2A (L14), quantified MCP-vs-CLI (L16), the tool-design checklist
  (L3), an attack catalog with runnable guardrails (L10), and interactive
  widgets.
- DeepLearning.AI wins on eval-driven method (measured reflection, 2x2 eval
  taxonomy, error-analysis tallies, component evals) and live coding-agent
  demos including Playwright and Figma MCP.
- Anthropic wins on everything operational about Claude Code (permission modes,
  hooks, subagent design and anti-patterns, headless, plugins, verifying
  unsupervised runs), production API mechanics (caching, failure handling,
  eval-gated routing), hands-on RAG, MCP transports/sampling/roots, and a
  "Watch Out" failure narrative per topic.
- **Structural finding:** Osmani is a reading course with widgets and few
  exercises; the others are lab and checkpoint driven. Skills-map cluster 3
  ("using coding agents") is where Osmani is thinnest and Anthropic most
  complete. Cluster 4 ("shaping the build") is covered by neither Osmani nor
  DLAI.

**Eleven prioritized recommendations** (SUGGESTIONS block in the generator):

01. A full "working with Claude Code" workflow lesson (explore, plan, code,
    commit; CLAUDE.md; plan mode; reviewer subagent; PR).
02. Hooks, subagent design, verification of unsupervised runs.
03. Error analysis, component evals, and a runnable eval pipeline.
04. State the workflow-first default and teach environment inspection.
05. Production API mechanics (prompt caching, retriable vs terminal errors,
    eval-gated model routing, pinned model IDs).
06. Extend the MCP deep dive to resources, prompts, client, transports,
    sampling, roots.
07. Skills authoring rules, comparison table, troubleshooting, plugins, SDK
    example.
08. Measured reflection, code execution, sandboxing.
09. One fictionalized failure narrative ("Watch Out" box) per building lesson.
10. CS50 AI weeks 0/2/4/6 as a named optional foundations track plus four
    folded-in explanations (week 6 caveat: encoder-decoder, not decoder-only).
11. Adopt CS50 pedagogy: the define-to-create ladder, the into/through/beyond
    lesson arc, two comfort levels per exercise, a three-axis self-check
    (correctness, style, design), and redesign the `/teach` skill on the CS50
    Duck pattern (instruction dilution measured at roughly 20-25% leaked code
    with 20+ rules; blind pairwise ELO evaluation).

**Caveats:** depth labels are judgment calls from reader subagents; hosted DLAI
labs and some Anthropic SCORM checkpoints didn't survive extraction; Osmani
word counts include widget JS.
