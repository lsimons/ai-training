# ai-tells.FormalRegister

## Rule

`.vale/styles/ai-tells/FormalRegister.yml` extends the `existence` rule
with `ignorecase: true` and `level: error`. Its `tokens` list holds 49
plain words: the inflections of `utilize`, `facilitate`, `implement`,
`commence`, `terminate`, `ascertain`, `endeavour`, `conceptualize`,
`operationalize`, `prioritize`, `incentivize`, `optimize`, `maximize`,
and `minimize`. Message: "AI formalism: '%s'. Use a plainer everyday word
(e.g., 'use', 'help', 'start')." The YAML carries no explanatory comment
and names no domain in which to disable it. The `implement` family (four
forms) is the only entry in the list that is also ordinary software
vocabulary; the other thirteen stems are Latinate verbs of the "utilize
for use" kind.

## Stats

Total hits: 12.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    6 | 13147 |              0.46 |
| plan       |    4 | 15852 |              0.25 |
| agent-docs |    1 |  3200 |              0.31 |
| lessons    |    1 | 12134 |              0.08 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   12 | 66006 |              0.18 |

Top matched phrases:

| phrase           | count |
| ---------------- | ----: |
| `implementation` |     4 |
| `implementing`   |     4 |
| `implements`     |     2 |
| `minimize`       |     2 |

Distinct phrases: 4. Ten of the twelve hits are the `implement` family;
the other two are `Minimize`. None of the other twelve stems in the token
list appears anywhere in the repository.

## Examples

All twelve hits, in file order.

- `docs/agents/issue-tracker.md:25` — "| ready-for-human | Requires human
  implementation | #e6e6fa |"
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:23` —
  "3. Engineering leaders, *Implementing Agentic Engineering*: staffing
  models, / review and quality gates, metrics, procurement and tooling,
  risk"
- `docs/plan/explore/08-diataxis.md:51` — "- Minimize explanation; link
  to an explanation page or short instead."
- `docs/plan/explore/09-brilliant-skills-map.md:60` (two hits on the same
  line) — "Tier **The build loop**: every piece of work needs
  specification, / implementation and verification; as AI takes
  implementation, human skill / concentrates in specifying, verifying and
  designing workflows, and then one"
- `docs/spec/000-specs.md:68` — "| `In progress - <what has shipped>` |
  Partial implementation; say what has shipped and what's deferred |"
- `docs/spec/000-specs.md:70` — "| `Implemented (YYYY-MM-DD)` | Shipped;
  the date is the commit date of the last implementing commit |"
- `docs/spec/S02-topic-map.md:263` — "Two topics exist because
  Brilliant's map shows where human skill / concentrates once an agent
  does the implementing: **specification** (taste, / success criteria,
  decomposition, designing the verification) and"
- `docs/spec/S02-topic-map.md:374` — "| `builds-agent-loop` |
  `implements-the-loop` | base | Implements the loop with error handling
  and a stop condition |"
- `docs/spec/S02-topic-map.md:531` — "own or folds into
  `ships-with-agent`. Kept separate for now because / specifying is where
  human skill concentrates once an agent implements."
- `docs/spec/S03-lesson-authoring.md:73` — "- **Minimize explanation.**
  Link to an explanation page or a short instead."
- `site/src/content/docs/coding-with-agents/index.mdx:8` — "Shipping
  software changes with a coding agent. It starts with your first session
  in a small repository, then moves through planning, implementing and
  verifying a change, and ends with working alongside a team."

## Concentration

Top files by hit count:

| file                                                            | hits |
| --------------------------------------------------------------- | ---: |
| `docs/spec/S02-topic-map.md`                                    |    3 |
| `docs/plan/explore/09-brilliant-skills-map.md`                  |    2 |
| `docs/spec/000-specs.md`                                        |    2 |
| `docs/agents/issue-tracker.md`                                  |    1 |
| `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` |    1 |

Four of the twelve hits sit inside Markdown table cells (the label table
in `issue-tracker.md`, the status-value table in `000-specs.md`, the
learning-objective table in `S02-topic-map.md`). One is an italicized
course title quoted from an external syllabus
(`01-prior-sbp-training-and-course-compare.md:23`). The `Minimize` pair
is the same Diátaxis principle restated in a plan note and in spec S03.
The remaining hits are running prose about the build loop
(specification, implementation, verification), where `implement` names
the phase of work the surrounding text is contrasting with specifying
and verifying. The single lesson hit is the course-page blurb for
`coding-with-agents`. No hits fall in headings or code-adjacent text.
