# Exploration: agent-engineer-course

Explored 2026-09-19 by a read-only agent. Source:
`~/git/lsimons/agent-engineer-course`, a fork of addyosmani/agent-engineer
(content) plus ivarurdalen/agent-engineer-course (Starlight setup), rewritten
by Leo for the Claude stack. Published at
<https://lsimons.github.io/agent-engineer-course/>.

## Lessons

All content: `site/src/content/docs/NN-slug.md` (frontmatter `title` plus
`sidebar.order`, no H1). Landing: `index.mdx`. 480-1000 lines each.

Part 1, Fundamentals (101):

- 01-what-are-ai-agents: what agents are, why they matter, when to use them
- 02-how-agents-think: LLM as reasoning engine, context windows, sampling
- 03-tools-giving-agents-hands: function calling, tool schema design
- 04-agentic-design-patterns: ReAct, reflection, planning patterns
- 05-memory-and-context: sessions, context windows, long-term memory
- 06-planning-and-reasoning: task decomposition and decisions
- 07-multi-agent-systems: coordination, delegation
- 08-agentic-rag: search, evaluate, refine retrieval loops
- 09-evaluating-and-testing-agents: metrics, evals, observability
- 10-guardrails-and-safety: security, alignment (other lessons link back here)

Part 2, Building and shipping (201):

- 11-from-prototype-to-production: CI/CD, rollout, ops
- 12-getting-started-with-claude-code: Claude Code, Anthropic API via a LiteLLM
  proxy, Agent SDK; also the production toolbox (uv, FastAPI, Pydantic v2,
  Instructor, FastMCP, LangGraph, Qdrant, Langfuse)
- 13-building-your-first-agent: hands-on agent loop from scratch, then Agent SDK
- 14-agent-protocols-mcp-and-a2a: MCP and A2A

Part 3, Deep dives (301):

- 15-agents-md, 16-mcp-deep-dive, 17-agent-skills, 18-orchestrators,
  19-where-to-go-from-here

## Site tech

- Astro 7.3.2 plus @astrojs/starlight 0.42.0, bun, TypeScript 6, sharp.
  Config `site/astro.config.mjs` (base `/agent-engineer-course`, Merriweather
  fonts, custom CSS, hardcoded 3-group sidebar).
- Custom rehype plugin `rehypeBaseLinks` prefixes root-relative links with the
  deploy base. Same pattern as the doc template this repo started from.
- No framework components. Interactive widgets are inline
  `<div class="not-content" id="...">` plus `<script>` blocks written directly
  in the Markdown of 18 of 19 lessons. Examples: `agent-levels-explorer`,
  `context-window-explorer`, `tool-call-flow`, `pattern-visualizer`,
  `memory-explorer`, `planning-sim`, `multi-agent-viz`, `rag-viz`,
  `eval-dashboard`, `guardrails-viz`, `pipeline-viz`, `claude-stack`,
  `mcp-a2a-viz`, `agents-md-builder`, `mcp-deep-viz`,
  `skill-loading-timeline`, `orch-playground`, `learning-path` with
  `lp-quiz` / `lp-roadmap` (lesson 19).
- No progress tracking or persisted quizzes in the site itself; quizzing and
  progress exist only in the `/teach` skill. Prose exercises exist ("Hands-On
  Exercise", "Try it yourself", notably lessons 12 and 13).
- Pagefind search. CI builds and astro-checks; deploy publishes `site/dist` to
  Pages. Tooling pinned in `.mise.toml`; hooks in `prek.toml`.

## The experimental AI tutor skill

Path: `.claude/skills/teach/SKILL.md` (commit 6dd3036, "experimental").

- Slash command `/teach [lesson number | resume | review | status]`. Persona:
  tutor, not lecturer; never pastes lessons into chat.
- Progress lives in Claude's auto-memory directory as `teach-progress.md`
  (indexed from `MEMORY.md`): a table of Lesson / Read / Quiz / Score / Weak
  spots, a spaced-recall review queue, and learner notes. Updated after each
  quiz and at session end.
- Boots the local server: from `docs/` runs `bunx astro dev status`; if down,
  `mise run site-dev` (Astro 7 daemonizes), polls the local URL for 200, then
  opens the lesson URL in the browser. Leaves the server running.
- Builds the lesson list dynamically from frontmatter, not hardcoded.
- Quizzing: 3-5 questions one at a time, mapped to the lesson's "What you will
  learn" bullets; mixes recall / apply / contrast; at least one question
  references a concrete page artifact. Pass = all bullets touched, at most one
  miss. Three-tier hint escalation (reframe, locate, scaffold). Hard rule:
  never reveal answers to open questions, even on insistence.

## Upstream vs Leo

Git history: 29 commits by Addy Osmani (through 2026-07-16), 1 by Ivar Soares
Urdalen, 32 by Leo Simons (from 2026-07-19 onwards), 18 by dependabot.

Leo's own work: the Starlight port, the rewrite for the Claude stack
(Google/Gemini/Vertex+ADK replaced; lesson 12 renamed), the production toolbox,
folding in Addy's 2026 blog insights (lessons 07/09/10/13/15/17/18), landing
page, README and attribution, theme, Pages deploy, widget fixes, all tooling,
AGENTS.md, and the `/teach` skill. Lesson prose structure and the widgets come
from upstream Addy content, edited throughout by Leo. Attribution is in
`README.md` ("Origins"), `AGENTS.md`, and `index.mdx` ("About this course").

## License and reuse

- `LICENSE` is Apache License 2.0 boilerplate with the copyright placeholder
  unfilled and no NOTICE file. Upstream addyosmani/agent-engineer should be
  checked for its own license and copyright holder before reuse.
- For a CC-licensed derivative: Apache-2.0 is one-way compatible with CC BY 4.0
  and CC BY-SA 4.0. A derivative may carry a CC license while keeping
  Apache-2.0 terms on the incorporated material. Required: retain the Apache
  license text and notices, state that files were changed, credit Addy Osmani
  (content), Ivar Soares Urdalen (Starlight setup) and Leo Simons (Claude-stack
  edition) with links, and do not imply endorsement.

## Gaps and TODOs

- One leftover stub: `14-agent-protocols-mcp-and-a2a.md:187`,
  `// MCP packet animation placeholder`.
- `/teach` is marked experimental; no tests or CI coverage.
- LICENSE copyright placeholder not filled in.
- `CONTRIBUTING.md` line 7 references "the guidelines above" that do not exist.
- Documented constraints in `AGENTS.md`: public repo (no company names or
  internal URLs), widgets must be `class="not-content"`, never emit literal
  `</script>` / `</pre>` inside widget JS strings, TypeScript held to 6.x.
