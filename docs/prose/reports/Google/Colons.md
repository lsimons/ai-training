# Google.Colons

## Rule

`.vale/styles/Google/Colons.yml` extends `existence` at `level: warning`,
scoped to `sentence`. Its single token is a regex,
`(?<!Note: )(?<!Caution: )(?<!Warning: )(?<!Success: )(?<=:\s)[A-Z]\w+`, which
matches a capitalized word immediately following a colon and a space, unless
the colon is preceded by `Note`, `Caution`, `Warning`, or `Success` (the
lookbehinds exempt those notice labels). The message is `'%s' should be in lowercase.` and it links to
`https://developers.google.com/style/colons`. There is no word list; it is a
single pattern, not a vocabulary.

## Stats

Total hits: 85.

| Area      | Hits | Words  | Hits/1000 words |
| --------- | ---- | ------ | --------------- |
| plan      | 55   | 15,884 | 3.46            |
| spec      | 27   | 13,184 | 2.05            |
| repo-docs | 3    | 3,489  | 0.86            |

No hits in `lessons`, `agent-docs`, or `data`.

Top matched phrases (lowercased), by count:

| Phrase        | Count |
| ------------- | ----- |
| draft         | 6     |
| foundations   | 4     |
| cs50          | 4     |
| claude        | 3     |
| ai            | 3     |
| build         | 3     |
| define        | 3     |
| react         | 2     |
| mcp           | 2     |
| cc            | 2     |
| scorm         | 2     |
| brilliant     | 2     |
| learn         | 2     |
| fix           | 2     |
| use           | 1     |
| demonstrating | 1     |
| security      | 1     |

85 hits map to 59 distinct phrases (matched text lowercased).

## Examples

- `CODE_OF_CONDUCT.md:55` (repo-docs) — "**Community Impact**: Use of
  inappropriate language or other behavior deemed / unprofessional or
  unwelcome in the community."
- `README.md:97` (repo-docs) — "[Code of Conduct](./CODE_OF_CONDUCT.md). AI
  agents see / [AGENTS.md](./AGENTS.md). Security reports:
  [SECURITY.md](./SECURITY.md)."
- `docs/spec/S01-dictionary.md:8` (spec) — "**Status:** Draft" (top phrase:
  "draft").
- `docs/spec/S02-topic-map.md:8` (spec) — "**Status:** Draft" (top phrase:
  "draft").
- `docs/plan/README.md:82` (plan) — "Area naming | Two sidebar groups:
  **Foundations** (Concepts, Safety, Using agents) and **Engineering**
  (Coding with agents, Customizing agents, Building agents)." (top phrase:
  "foundations").
- `docs/plan/explore/09-brilliant-skills-map.md:21` (plan) — "Marketing
  framing: "designed for college students, early-career / professionals, and
  ambitious beginners". Two halves: **Foundations of / Computer Science** (7
  big ideas, 42 learning objectives, 196 skills) and" (top phrase:
  "foundations").
- `docs/plan/explore/03-cs50-pedagogy.md:1` (plan) — "# Exploration: CS50 AI
  course and CS50 educator workshops" (top phrase: "cs50").
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:135` (plan) —
  "## Part 2: CS50 Duck tutor design" (top phrase: "cs50").
- `docs/plan/explore/02-agent-engineer-course.md:30` (plan) —
  "- 12-getting-started-with-claude-code: Claude Code, Anthropic API via a
  LiteLLM / proxy, Agent SDK; also the production toolbox (uv, FastAPI,
  Pydantic v2," (top phrase: "claude").
- `docs/plan/explore/04-anthropic-academy.md:45` (plan) — "- Cloud variants:
  Claude with Amazon Bedrock, Claude with Google Cloud's Vertex AI." (top
  phrase: "claude").
- `docs/plan/explore/04-anthropic-academy.md:24` (plan) — "- Audience
  variants: AI Fluency for builders / educators / students / nonprofits,
  Teaching AI Fluency (same slugs under `academy.claude.com/courses/`)." (top
  phrase: "ai").
- `docs/spec/S01-dictionary.md:51` (spec) — "| **Site** | The whole
  thing: *AI Training*. |
  portal, academy, suite |" (top phrase: "ai").
- `docs/plan/explore/10-execute-program.md:1` (plan, picked at random) — "#
  Exploration 10: Execute Program".
- `docs/spec/S02-topic-map.md:125` (spec, picked at random) — "| `AEC-04` |
  Agentic design patterns: ReAct, reflection, tool use, planning
  |".
- `docs/plan/explore/11-roadmap-sh.md:135` (plan, picked at random) —
  "Switches the drawer to the AI Tutor tab and streams a structured /
  explanation of the topic: **What it is**, **How it works**, **Why this /
  matters**, **Common misunderstandings**, **Concrete example** (with code),".

## Concentration

Top five files by hit count:

| File                                                        | Hits |
| ----------------------------------------------------------- | ---- |
| `docs/spec/S02-topic-map.md`                                | 12   |
| `docs/plan/explore/04-anthropic-academy.md`                 | 8    |
| `docs/plan/explore/02-agent-engineer-course.md`             | 6    |
| `docs/plan/explore/03-cs50-pedagogy.md`                     | 6    |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` | 6    |

(Tied with the above three at 6: `docs/plan/explore/09-brilliant-skills-map.md`,
`docs/plan/explore/10-execute-program.md`, `docs/plan/explore/11-roadmap-sh.md`,
`docs/spec/S01-dictionary.md`.)

All hits are in running prose or markdown structures that use a colon
followed by a proper noun or a capitalized bold term: table cells
(`docs/spec/S01-dictionary.md`, `docs/spec/S02-topic-map.md`), bulleted lists
describing course content (`docs/plan/explore/02-agent-engineer-course.md`,
`docs/plan/explore/04-anthropic-academy.md`, `docs/plan/explore/11-roadmap-sh.md`),
headings (`docs/plan/explore/03-cs50-pedagogy.md:1`,
`docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:135`,
`docs/plan/explore/10-execute-program.md:1`), and repeated frontmatter-style
lines (`**Status:** Draft` in every `docs/spec/S0N-*.md` file, six hits).
None are in quoted material or code-adjacent text.
