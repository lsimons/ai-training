# ai-tells.ContrastiveFormulas

## Rule

`.vale/styles/ai-tells/ContrastiveFormulas.yml` extends the `existence`
rule with `level: error` and no `ignorecase` (the tokens carry their own
`[Ii]t` alternations). Its `tokens` list holds 120 regular expressions,
grouped by comment into the "It's not just X; it's Y", "It's not about
X; it's about Y", "This isn't X; it's Y", "It's more than X; it's Y",
"less about X and more about Y", "X isn't the point; Y is", "The real X
isn't Y; it's Z", "What matters isn't X", "The question isn't X", "Yes,
X, but Y", "It's not whether X; it's how Y", "[Noun] isn't X. It's Y.",
"Not only X but also Y", "Not because X, but because Y", plural
"These aren't X. They're Y.", "Doesn't mean X. It means Y.", and
multi-word-subject "The [noun] isn't X. It's Y." families, each in
semicolon-, em-dash-, and period-separated variants. One token is the
verbless bare appositive "a Y, not a Z"; the comment says it "also fires
in headings, where the clause-level tokens above never match" and
"subsumes the older single-word-subject 'X is a Y, not a Z' token".
Message: "AI contrast: '%s'. State the positive claim directly without
the 'not X, but Y' formula." The YAML names no domain in which to
disable the rule.

## Stats

Total hits: 12.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| agent-docs |    3 |  3200 |              0.94 |
| plan       |    5 | 15852 |              0.32 |
| spec       |    3 | 13147 |              0.23 |
| lessons    |    1 | 12134 |              0.08 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   12 | 66006 |              0.18 |

Top matched phrases:

| phrase                                                                                                     | count |
| ---------------------------------------------------------------------------------------------------------- | ----: |
| `a remark plugin, not a component`                                                                         |     2 |
| `a scoped action, not an open chat box`                                                                    |     1 |
| `a guide, not a plan`                                                                                      |     1 |
| `a drawing, not a graph`                                                                                   |     1 |
| `a word, not a pattern`                                                                                    |     1 |
| `a british-to-american swap list, not a spell check`                                                       |     1 |
| `a sweep, not a nag`                                                                                       |     1 |
| `a graph, not a list`                                                                                      |     1 |
| `a gate into engineering, not a track of its own after foundations`                                        |     1 |
| `a good exchange, not a recording of`                                                                      |     1 |
| `levels are behaviors within a competency (...), not separate nodes; there is no role or seniority ladder` |     1 |

Distinct phrases: 11. Eleven of the twelve hits are the bare appositive
token "a Y, not a Z"; the twelfth
(`05-career-model-and-deeplearning-ai.md:49`) is the multi-clause
"[Noun] are X, not Y" form, whose `Match` spans two source lines and a
masked code span.

## Examples

All twelve hits, in file order.

- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:49` —
  "Interaction Design, Architecture, Construction, Test, Maintenance.
  Competencies / and sub-competencies below each area. **Levels are
  behaviors within a / competency** (`base / expert / lead`), not
  separate nodes; there is no role or / seniority ladder."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:204` — "-
  Explain highlighted code as a scoped action, not an open chat box."
- `docs/plan/explore/08-diataxis.md:29` — "Process guidance: use it as a
  guide, not a plan; improve one small thing at a / time and publish it;
  never create empty section scaffolding; let structure"
- `docs/plan/explore/11-roadmap-sh.md:48` — "So the map is a **drawing,
  not a graph**. Grouping is by position and by / connector lines; only
  41 of 279 nodes in AI Engineer are joined by real"
- `docs/plan/explore/12-learn-prompting.md:144` — "natural rendering of
  spec S01's concept register inside lessons. Their / two implementations
  show it can be a remark plugin, not a component, so / plain Markdown
  stays plain."
- `docs/prose/README.md:61` — "| write-good | E-Prime | Off | Bans every
  "to be"; definitions are "X is Y" and it flags a word, not a pattern.
  Would bury Passive |"
- `docs/prose/README.md:68` — "| proselint | `Spelling` | Off | A
  British-to-American swap list, not a spell check; a spell checker does
  this |"
- `docs/prose/README.md:81` — "| Google | `We`, `FirstPerson` | Now and
  then | Second person is the aim for guides and tutorials; the lesson
  opener and the tutor commands use "we" and "me" on purpose, so a sweep,
  not a nag |"
- `docs/spec/S02-topic-map.md:85` — "Each course renders as a graph, not
  a list."
- `docs/spec/S02-topic-map.md:496` — "| `safety/agent-risk` ->
  `coding-with-agents/quality`, `customizing-agents/hooks-permissions` |
  prerequisite | Safety is a gate into Engineering, not a track of its
  own after Foundations |"
- `docs/spec/S03-lesson-authoring.md:119` — "- **The first mention of a
  concept is a term.** It is marked in Markdown by / a remark plugin, not
  a component, so plain Markdown stays plain. The term / renders the
  concept's glossary definition on hover and links to its"
- `site/src/content/docs/safety/agent-risk.mdx:148` — "A short exchange
  with a well-set-up agent looks like this. The transcript / is
  illustrative: it shows the shape of a good exchange, not a recording of
  / one model, and your agent phrases things differently."

## Concentration

Top files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/prose/README.md`                                      |    3 |
| `docs/spec/S02-topic-map.md`                                |    2 |
| `docs/plan/explore/05-career-model-and-deeplearning-ai.md`  |    1 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |    1 |
| `docs/plan/explore/08-diataxis.md`                          |    1 |

Four of the twelve hits sit in Markdown table cells: the three in
`docs/prose/README.md` are in the "why" column of the rule-decision
table, and `S02-topic-map.md:496` is in the cross-area-edge table. Two
are list items (`07-scorm:204`, `S03:119`). The rest are running prose.
The same sentence, "a remark plugin, not a component, so plain Markdown
stays plain", appears in both a plan note and spec S03. Two hits carry
bold on the contrasted pair (`11-roadmap-sh.md:48`, `05-career:49`). No
hits fall in headings, and none in code-adjacent text; the one
`Match` containing masked asterisks
(`05-career-model-and-deeplearning-ai.md:49`) spans an inline code span
that Vale blanked before matching.
