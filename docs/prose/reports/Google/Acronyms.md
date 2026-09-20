# Google.Acronyms

## Rule

`.vale/styles/Google/Acronyms.yml` extends `conditional` at `level: suggestion`, `ignorecase: false`. Its `first` pattern is `\b([A-Z]{3,5})\b`
(any all-caps token of three to five letters); its `second` pattern is
`(?:\b[A-Z][a-z]+ )+\(([A-Z]{3,5})\)` (one or more capitalized words followed
by the same all-caps token in parentheses — the "spelled out" form). The rule
fires on a `first` match when no matching `second` expansion exists in the
same scope. The message is `"Spell out '%s', if it's unfamiliar to the audience."`, linking to
`https://developers.google.com/style/abbreviations`. An `exceptions` list of
54 all-caps tokens (`API`, `CLI`, `HTML`, `JSON`, `URL`, `YAML`, etc.) is
excluded from matching outright.

## Stats

Total hits: 274.

| Area       | Hits | Words  | Hits/1000 words |
| ---------- | ---- | ------ | --------------- |
| plan       | 209  | 15,158 | 13.79           |
| spec       | 57   | 7,702  | 7.40            |
| lessons    | 4    | 2,472  | 1.62            |
| agent-docs | 2    | 1,817  | 1.10            |
| repo-docs  | 2    | 1,883  | 1.06            |

No hits in `data`.

Top matched phrases (case preserved as matched), by count. The "Spelled out
anywhere?" column is filled in for the top ten only, per the task; it
records whether any file containing that acronym also contains the literal
pattern `(ACRONYM)` (a capitalized-words expansion followed by the acronym
in parentheses) anywhere in that same file:

| Phrase | Count | Spelled out anywhere? (top ten only)                                                         |
| ------ | ----- | -------------------------------------------------------------------------------------------- |
| MCP    | 34    | No — not found in any of its 7 files                                                         |
| RAG    | 19    | Yes — `docs/spec/S02-topic-map.md:165` has "retrieval (RAG)"; not found in its other 5 files |
| SPC    | 17    | No — not found in either of its 2 files                                                      |
| VER    | 15    | No — not found in either of its 2 files                                                      |
| SCORM  | 15    | No — not found in any of its 4 files                                                         |
| LLM    | 15    | No — not found in any of its 7 files                                                         |
| INC    | 15    | No — not found in either of its 2 files                                                      |
| SEC    | 13    | No — not found in either of its 2 files                                                      |
| BLD    | 13    | No — not found in either of its 2 files                                                      |
| TAS    | 7     | No — not found in either of its 2 files                                                      |
| SWE    | 6     | —                                                                                            |
| MCQ    | 6     | —                                                                                            |
| ABS    | 6     | —                                                                                            |
| MEM    | 5     | —                                                                                            |
| GPT    | 5     | —                                                                                            |

274 hits map to 60 distinct phrases (matched text, case preserved).

## Examples

- `AGENTS.md:89` (repo-docs) — "`src/styles/custom.css` - the LSD Warm
  theme; `lesson.css` - lesson, / course, map, progress and review styles
  (global on purpose: review".
- `NOTICE.md:4` (repo-docs) — "Content in this repository is licensed under
  CC BY-SA 4.0 and code under the / Apache License 2.0; see
  [LICENSE](./LICENSE) and [LICENSE-CODE](./LICENSE-CODE). / Material
  incorporated from third parties is listed here with its origin and".
- `docs/agents/writing-a-lesson.md:10` (agent-docs) — "A lesson is an MDX
  file at `site/src/content/docs/<area>/<lesson>.mdx`. Its / lesson id is
  `<area>/<lesson>`. The course page for the area is".
- `site/src/content/docs/customizing-agents/instructions.mdx:31` (lessons)
  — "fixture is a small fictional project called `invoice-mailer`: a Python
  / service that renders invoices to PDF and sends them over SMTP. You can /
  reproduce every step in an empty directory with a text editor.".
- `site/src/content/docs/guides/slides.md:37` (lessons) — "The reveal.js
  theme lives in `site/public/presentations/reveal.scss` and maps / the
  deck's fonts and accent color onto the site's LSD Warm palette. Adjust the
  / SCSS variables there to restyle the HTML slides.".
- `site/src/content/docs/guides/writing-pages.md:6` (lessons) — "Pages are
  Markdown (`.md`) or MDX (`.mdx`) files under / `site/src/content/docs/`.
  The path under that directory becomes the URL, and" (top phrase: "MDX").
- `docs/plan/explore/02-agent-engineer-course.md:34` (plan) — "-
  13-building-your-first-agent: hands-on agent loop from scratch, then Agent
  SDK / - 14-agent-protocols-mcp-and-a2a: MCP and A2A" (top phrase: "MCP").
- `docs/spec/S02-topic-map.md:165` (spec) — "| \`concepts/what-is-an-agent\`
  | What an agent is | model vs agent, tool, agent loop, degree of autonomy,
  harness | prompting, limits | \`AEC-01\`, usable for knowledge workers as
  is; \`DLAI-11\` M1 | / | \`concepts/grounding\` | Grounding and memory |
  retrieval (RAG), grounding, short- and long-term memory, context rot |
  what-is-an-agent | \`AEC-05\` knowledge-worker parts; \`AEC-08\`
  introduction |" (top phrase: "RAG"; this is the one file where RAG is
  spelled out, as "retrieval (RAG)").
- `docs/plan/explore/11-roadmap-sh.md:69` (plan) — "controls, open vs closed
  weights, streaming, reasoning models, fine-tuning / vs prompting,
  embeddings, RAG basics), AI Agents 101 (what agents are, what / tools are,
  the agent loop drawn as four numbered steps: perception, reason" (top
  phrase: "RAG"; unlike `S02-topic-map.md`, this file does not spell RAG
  out).
- `docs/plan/explore/09-brilliant-skills-map.md:37` (plan) — "appear inside
  skill text ("the same judgment about relevant information from / SPC-5,
  applied at the moment work is handed off"), so codes are used as /
  citations between nodes. No prerequisites, levels or grades are encoded."
  (top phrase: "SPC").
- `docs/plan/explore/09-brilliant-skills-map.md:30` (plan) — "| Big idea
  (pillar) | A **noun phrase** with a three-letter code and a one-sentence
  summary of why it matters now. | VER "Verification": generation is
  cheap, so verification is the new bottleneck |" (top phrase: "VER"; the
  word "Verification" appears in the same cell but not in the
  `Word (ACRONYM)` order the rule's `second` pattern requires).
- `docs/plan/README.md:56` (plan) — " (Starlight, LSD Warm theme, Quarto
  decks, pinned toolchain, CI, zizmor). / - **Interactive lesson content**
  in the style of the Anthropic SCORM modules: / teaching screens,
  checkpoints (multiple choice, sorting, scenario" (top phrase: "SCORM").
- `docs/plan/explore/02-agent-engineer-course.md:17` (plan, picked at
  random) — "- 01-what-are-ai-agents: what agents are, why they matter,
  when to use them / - 02-how-agents-think: LLM as reasoning engine, context
  windows, sampling / - 03-tools-giving-agents-hands: function calling, tool
  schema design".
- `docs/plan/explore/03-cs50-pedagogy.md:89` (plan, picked at random) —
  "blocks despite the rule. Fix: **show, not tell**. V2 used few-shot
  examples / (4), V3 fine-tuned GPT-4o-mini on 50 TF-authored conversations.
  Blind A/B / evaluation by 29 teaching fellows on 50 real student queries,
  scored with".
- `docs/spec/S05-spaced-review.md:102` (spec, picked at random) — "|
  \`stage\` | 1 to 5, or \`done\` | /
  | \`due\` | ISO calendar day in the learner's local time zone; the
  item is due when \`due \<= today\` | / | \`last\` | \`pass\` or \`fail\`
  (Give Up records \`fail\`) |".

## Concentration

Top five files by hit count:

| File                                                        | Hits |
| ----------------------------------------------------------- | ---- |
| `docs/plan/explore/09-brilliant-skills-map.md`              | 67   |
| `docs/spec/S02-topic-map.md`                                | 55   |
| `docs/plan/explore/05-career-model-and-deeplearning-ai.md`  | 33   |
| `docs/plan/explore/04-anthropic-academy.md`                 | 28   |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` | 16   |

These five files account for 199 of the 274 hits (73%). Hits in
`docs/plan/explore/09-brilliant-skills-map.md` and `docs/spec/S02-topic-map.md`
concentrate in tables and short-code cells (`SPC-5`, `INC-2`, `VER`, `BLD`,
`SEC`, `TAS` as three-letter pillar/skill codes, e.g. lines 29-37 of
`09-brilliant-skills-map.md` and rows in the `S02-topic-map.md` tables around
lines 165, 422 and 441-442). Hits in `04-anthropic-academy.md`,
`05-career-model-and-deeplearning-ai.md`, `07-scorm-interactions-and-duck-tutor.md`,
and most of the remaining `docs/plan/explore/*.md` files are in running
prose describing courses and tools (`MCP`, `LLM`, `RAG`, `SCORM`, `GPT`,
`SBP`, `DLAI`). Hits outside `docs/plan/` and `docs/spec/` are sparse (2
in `repo-docs`, 2 in `agent-docs`, 4 in `lessons`) and each sits in a single
sentence of prose (`LSD`, `MDX`, `SMTP`, `CODE`). None of the hits are inside
code blocks or fenced examples; several are inside Markdown table cells
(pipe-delimited rows) rather than free-running prose.
