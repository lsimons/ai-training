# Exploration: the two Anthropic academies (partner and public)

Explored 2026-09-19 by a read-only agent. Source:
`~/git/lsimons/ai-anthropic-partners`. Key index files: `COURSES.md`,
`docs/site-map.md`, `docs/site-map-public.md`, `docs/site-map-academy.md`,
`study/ccdv-f.md`, `study/ccar-p.md`, `docs/spec/001-lesson-page.md`.

Three sources: partner Skilljar, public Skilljar (being retired), and Claude
Academy (<https://academy.claude.com>), the public successor. 24 of Academy's
26 courses are the same lessons in the same order as the Skilljar copies, so
the public URLs below are reliable equivalents.

## 1. Catalog by level (public URL where one exists)

**Level 1: foundations, no code**

- Claude 101: everyday use of Claude (projects, artifacts, skills, connectors,
  research). <https://academy.claude.com/courses/claude-101>
- AI capabilities and limitations: mental model of LLM behavior.
  <https://academy.claude.com/courses/ai-capabilities-and-limitations>
- AI Fluency: Framework and foundations: the 4D framework (Delegation,
  Description, Discernment, Diligence).
  <https://academy.claude.com/courses/ai-fluency-framework-foundations>
- Audience variants: AI Fluency for builders / educators / students /
  nonprofits, Teaching AI Fluency (same slugs under `academy.claude.com/courses/`).
- Introduction to Claude Cowork.
  <https://academy.claude.com/courses/introduction-to-claude-cowork>

**Level 2: developer foundations**

- Claude Platform 101: first API call, model choice, agent loop, tool use,
  Skills, MCP, managed agents. <https://academy.claude.com/courses/claude-platform-101>
- Claude Code 101: install, explore/plan/code/commit, CLAUDE.md, subagents,
  Skills, MCP, hooks. <https://academy.claude.com/courses/claude-code-101>
- Introduction to agent skills. <https://academy.claude.com/courses/introduction-to-agent-skills>
- Introduction to subagents. <https://academy.claude.com/courses/introduction-to-subagents>

**Level 3: intermediate build**

- Claude Code in action: long unsupervised runs, permission modes, hooks,
  headless, GitHub Actions, plugins. <https://academy.claude.com/courses/claude-code-in-action>
- Introduction to MCP. <https://academy.claude.com/courses/introduction-to-model-context-protocol>
- MCP: Advanced topics. <https://academy.claude.com/courses/model-context-protocol-advanced-topics>
- Building with the Claude API (85 lessons). <https://academy.claude.com/courses/building-with-the-claude-api>
- Cloud variants: Claude with Amazon Bedrock, Claude with Google Cloud's Vertex AI.
- The AI-native SDLC playbook. <https://academy.claude.com/courses/ai-native-sdlc-playbook>
- Building effective human-agent teams (beta).
  <https://academy.claude.com/courses/building-effective-human-agent-teams>
- Deploying Claude Enterprise with confidence.
  <https://academy.claude.com/courses/deploying-claude-enterprise-with-confidence>

**Level 4: advanced, partner-only (no public URL; reference by name only)**

- Claude Partner Badge: Claude Code.
- CCDV-F prep path (5 SCORM modules): MSO foundations; production-grade
  prompting, agents and tool use; Claude Code and MCP integration; production
  engineering, evals and security; accelerators.
- CCAR-P prep path (5 SCORM modules): platform solution design; enterprise
  integration; responsible AI, safety and risk for architects; stakeholder
  engagement; developer productivity enablement.
- CCAO-F associate prep, Partner Basecamp, release briefings.

## 2. Interactive / SCORM structure

Documented in `docs/spec/001-lesson-page.md`, section "The second lesson kind:
SCORM". Each prep module is one SCORM 1.2 package, one long lesson.

Screen model: `<section class="screen">` with a title and a meta line giving
kind, section, minutes. Screen kinds: **Teaching**, **Checkpoint**,
**Watch Out**, **Exercise**, **Cumulative**, **Recap**, **Quiz**,
**Orientation**.

Interaction patterns observed:

- **Multiple choice / multiple response** with submit and a feedback box;
  answers and rationales live in the package script as a question array.
- **Click-to-place sorting** into buckets.
- **Scenario / decision branching**: a draft architecture is shown and the
  learner picks exactly N defective components.
- **Flip / reveal cards** via `<details>` / `<summary>`, plus glossary items.
- **Tab strips**.
- **Reflection / honor-system free text** (`textarea`, nothing graded).
- **Cumulative design exercise**: one design problem grows across screens and
  ends in a five-decision write-up.
- **Diagrams**: inline SVG.
- Academy React widgets embedded as iframes (not SCORM), and "animated
  explainers" as inline SVG scene sequences with a range slider.

Progress and completion: Skilljar drives completion from the Next button;
SCORM packages set `cmi.core.lesson_status` through a SCORM 1.2 API shim.
On Academy, progress and badges require sign-in with a Claude account.

## 3. Best course per topic

| Topic                            | Primary                                                 | Backup / deeper                                            |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| AI concepts                      | AI capabilities and limitations; AI Fluency framework   | CCDV-F module 1                                            |
| AI safety                        | CCAR-P module 3 (responsible AI, safety, risk)          | CCDV-F module 4 (prompt injection, guardrails)             |
| Using AI agents                  | Claude 101, Introduction to Claude Cowork               | Human-agent teams; Claude Platform 101 (managed agents)    |
| AI-assisted software engineering | Claude Code 101, then Claude Code in action             | AI-native SDLC playbook; CCDV-F module 3                   |
| Customizing agents               | Intro to agent skills, Intro to subagents, Intro to MCP | MCP advanced topics; API course prompt engineering section |
| Building agents                  | Building with the Claude API (lessons 76-82 on agents)  | CCDV-F module 2; CCAR-P module 1; Bedrock/Vertex for cloud |

## 4. License and terms

The course material is Anthropic's copyright, held as private study notes
under a partner account. **Reference and link only.** Prefer the public
`academy.claude.com/courses/<slug>` URLs, which need no partner account. Do
not copy lesson text, transcripts, quiz answers, slide images, or attachments.
