# Google.OxfordComma

## Rule

`.vale/styles/Google/OxfordComma.yml` extends `existence` with `scope: sentence`, `level: warning`, and `nonword: true`. It carries a single
regex token (not a word list) that looks for a comma before the final
`and`/`or` item of a two-or-more-item list, with four guards to cut false
positives: (1) the matched comma cannot be the one closing a fronted
subordinate clause (`when...,`, `if...,`, etc.) — only the sentence's
first comma is exempt from this guard; (2) the list item after the comma
cannot open with a clause-introducer such as `which` or `that`; (3) the
item cannot open with a subject pronoun directly followed by a verb
(compound-predicate signal), though a pronoun before `and`/`or` still
matches; (4) neither list item may contain an auxiliary verb such as
`is`/`has`/`will`. The message is `Use the Oxford comma in '%s'.`, and
the pattern allows end-of-scope so trailing list fragments still match.

## Stats

Total hits: 93.

| Area       | Hits | Words  | Hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| spec       | 45   | 13,184 | 3.413             |
| plan       | 31   | 15,884 | 1.952             |
| lessons    | 14   | 12,227 | 1.145             |
| repo-docs  | 2    | 3,489  | 0.573             |
| agent-docs | 1    | 2,707  | 0.369             |
| data       | 0    | 15,584 | 0                 |

(Word totals per area are the sum of `wordcount.tsv` rows for files in that
area, not restricted to files with hits.)

Top matched phrases (lowercased), by count:

| Count | Phrase                                            |
| ----- | ------------------------------------------------- |
| 2     | `, an editor or a chat.`                          |
| 1     | `, run now and then`                              |
| 1     | `, on which port and pid`                         |
| 1     | `, never inside list items or tables.`            |
| 1     | `, open source and open content.`                 |
| 1     | `, structure and vocabulary with citation.`       |
| 1     | `, recap and quiz.`                               |
| 1     | `, with the verbs and the review recall`          |
| 1     | `, confidentiality and data`                      |
| 1     | `,\nassessments or progress tracking anywhere.`   |
| 1     | `, component evals and a runnable eval pipeline.` |
| 1     | `, slide images or attachments.`                  |
| 1     | `, area and competency views.`                    |
| 1     | `, data and prompts`                              |
| 1     | `, mcp and subagents`                             |
| ...   | (77 more, each count 1)                           |

Every remaining phrase occurs exactly once. Distinct phrases: 92 (out of
93 hits — one phrase, `, an editor or a chat.`, repeats verbatim between
`docs/spec/S01-dictionary.md:99` and `docs/spec/S03-lesson-authoring.md:138`).

## Examples

- `docs/spec/S01-dictionary.md:99` (spec, top phrase `, an editor or a chat.`): "- Done outside the page: in a terminal, an editor or a chat. The
  learner\\n self-grades against a model answer. Honor system."
- `AGENTS.md:29` (repo-docs, top phrase `, run now and then`): "\`mise run
  prose-extended\` | Vale with the passive-voice rule too; advisory,
  run now and then |"
- `AGENTS.md:53` (repo-docs, top phrase `, on which port and pid`): "\`bunx
  astro dev status\` | Is a daemon running, on which port and pid |"
- `docs/agents/writing-a-lesson.md:44` (agent-docs, top phrase `, never inside list items or tables.`): "Opener paragraph(s), then H2 sections.
  Teaching prose is plain Markdown.\\nComponents go between paragraphs, never
  inside list items or tables.\\nEvery served objective gets at least one
  checkpoint with"
- `docs/plan/README.md:24` (plan, top phrase `, open source and open content.`): "\\nIt is public, open source and open content. Decided
  2026-09-19: content is\\n**CC BY-SA 4.0** and code is **Apache-2.0**
  (including the parts lifted from"
- `site/src/content/docs/safety/agent-risk.mdx:142` (lessons area
  requirement): "Put those together and a pattern falls out. The agent may
  read, search,\\ndraft, propose and prepare freely. It stops and asks before
  it sends,\\ndeletes, pays, publishes or changes anything shared. In
  practice the agent"
- `docs/spec/S02-topic-map.md:135` (spec, top concentration file): "|
  \`AEC-13\` | Building your first agent: the loop from scratch, then with
  an SDK |\\n| \`AEC-14\` | Agent protocols, MCP
  and A2A |\\n|
  \`AEC-15\` | AGENTS.md: contents, monorepo hierarchies, with a builder
  widget |"
- `docs/spec/S01-dictionary.md:242` (spec): "| Objective | \`<competency
  id>/<objective>\`, verb-led | \`safety/verifies-output/checks-claims\`
  |\\n| Concept | \`<concept>\`, global and unique |
  \`context-window\` |"
- `docs/plan/explore/11-roadmap-sh.md:209` (plan, random pick): "Decision
  2026-09-20: items 2, 4, 5 and 8 applied to specs S01 and S02.\\nItems 1, 3,
  6 and 7 declined for now."
- `docs/plan/explore/09-brilliant-skills-map.md:150` (plan, random pick):
  "Frameworks covered besides Common Core: Digital SAT, ACT, AP Precalculus,\\nNY
  Regents, NC Math 1-3, GCSE, A Level, IB, GRE and GMAT Quant. The coding\\nmap
  is not yet aligned to anything external."
- `site/src/content/docs/using-agents/delegating.mdx:43` (lessons, random
  pick): "> everyone working from home that day. Facilities will label and
  transport\\n> monitors, chairs and personal crates. Each person gets one
  crate and packs\\n> it by the Thursday evening before the move. Anything
  left on a desk after"
- `docs/spec/S04-progress-record.md:18` (spec): "- **Browser only.** The
  record is one JSON document in browser local\\n storage. There is no
  server, no account and no telemetry.\\n- **Nothing leaves the browser**
  unless the learner exports the file."
- `docs/spec/S03-lesson-authoring.md:138` (spec, second occurrence of top
  phrase): "\\n- Done outside the page: in a terminal, an editor or a chat.\\n-
  Runs in a contrived, resettable setting (a fixture repository, a"

Areas represented: spec, repo-docs, agent-docs, plan, lessons (data has no
hits, none picked). Top five phrases each appear at least once. Random
picks (stated above): `docs/plan/explore/11-roadmap-sh.md:209`,
`docs/plan/explore/09-brilliant-skills-map.md:150`, and
`site/src/content/docs/using-agents/delegating.mdx:43`.

## Concentration

Top five files by hit count:

| File                                          | Hits |
| --------------------------------------------- | ---- |
| `docs/spec/S02-topic-map.md`                  | 19   |
| `docs/spec/S01-dictionary.md`                 | 12   |
| `docs/plan/explore/11-roadmap-sh.md`          | 10   |
| `docs/spec/S03-lesson-authoring.md`           | 7    |
| `site/src/content/docs/safety/agent-risk.mdx` | 7    |

`docs/spec/S02-topic-map.md`'s hits are concentrated in its Markdown
tables (topic/lesson listings, e.g. lines 135, 161, 163, 182) and in
running prose describing topic scope. `docs/spec/S01-dictionary.md`'s
hits are split between its definition tables (e.g. line 242, a table
cell) and running prose (e.g. line 99). `docs/plan/explore/11-roadmap-sh.md`'s
hits are concentrated in running prose describing external-site features
and decisions (e.g. lines 4, 61, 209), not in tables or headings.
`docs/spec/S03-lesson-authoring.md` and
`site/src/content/docs/safety/agent-risk.mdx` hits are in running prose,
including one quoted/blockquoted example
(`site/src/content/docs/using-agents/delegating.mdx:43`, a fictional
workplace-move scenario inside a blockquote used as lesson material).
