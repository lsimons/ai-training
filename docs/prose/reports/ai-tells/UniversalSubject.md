# ai-tells.UniversalSubject

## Rule

`.vale/styles/ai-tells/UniversalSubject.yml` extends the `existence` rule
with `nonword: true` and `level: error`, and no `ignorecase`, message "AI
blanket claim: '%s'. Say which cases were checked, or drop the
quantifier." It has four tokens, all anchored on a capitalized `All` or
`Every` so that only the sentence-initial declarative fires, not the
mid-sentence "when all bytes are consumed". The copula token matches
`All/Every <1-3 words> is/are/was/were/has been/... <participle>` with any
`-ed` form plus a list of irregular participles and an optional adverb. The
scoreboard token matches uncounted test-status claims ("All tests pass",
"Every check is green"). Two active-form tokens (singular `Every ... reads/holds/has/uses/...` and plural `All ... read/hold/have/use/...`)
match a curated list of about 60 verbs followed by a determiner, count, or
preposition, refusing a modal in the subject slot. The comment says the
pattern is ordinary in pre-LLM documentation (86 corpus hits, the
"uniformity sweep" of "All tabs are expanded to spaces") and that the rule
flags that register anyway; "a file whose spec formulas are deliberate adds
its own exceptions". Quantifier floats ("X, Y, and Z are all copied") and
future promises ("All feedback will be addressed") are out of scope.

## Stats

Total hits: 13.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    7 | 13147 |              0.53 |
| agent-docs |    2 |  3200 |              0.62 |
| plan       |    2 | 15852 |              0.13 |
| repo-docs  |    1 |  3139 |              0.32 |
| lessons    |    1 | 12134 |              0.08 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   13 | 66006 |              0.20 |

Top matched phrases:

| phrase                                 | count |
| -------------------------------------- | ----: |
| `every page has one`                   |     2 |
| `every repo task lives in`             |     1 |
| `every served objective gets at least` |     1 |
| `every option has a`                   |     1 |
| `all real answers live in`             |     1 |
| `every lesson has a`                   |     1 |
| `every spec uses the`                  |     1 |
| `every section has a`                  |     1 |
| `every answer is grounded`             |     1 |
| `every unit is identified`             |     1 |
| `every source is cited`                |     1 |
| `every real loop has a`                |     1 |

Distinct phrases: 12. Twelve hits start with `Every`, one with `All`. Ten
are the active-form token (`has` six times, `lives`/`live` twice, `gets`,
`uses`), three the copula token (`is grounded`, `is identified`, `is cited`). No scoreboard hits.

## Examples

All 13 hits, in file order.

- `AGENTS.md:13` — "Every repo task lives in `.mise.toml`; `mise tasks`
  lists them."
- `docs/agents/writing-a-lesson.md:45` — "Every served objective gets at
  least one checkpoint with / `objective="<that id>"`; each checkpoint
  names the one objective it / evidences."
- `docs/agents/writing-a-lesson.md:117` — "Every option has a
  `consequence`; the correct one too."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:80` — "**All
  real answers live in localStorage only.** This is / exactly the plan's
  model; copy it deliberately, and include reset and the"
- `docs/plan/explore/08-diataxis.md:39` — "1. **Every lesson has a
  mode**, `tutorial` or `explanation`, declared in / frontmatter."
- `docs/spec/000-specs.md:35` — "- Every spec uses the terms of [S01
  Project dictionary](S01-dictionary.md)."
- `docs/spec/S01-dictionary.md:34` — "Every page has one of four kinds,
  after Diátaxis."
- `docs/spec/S01-dictionary.md:56` — "| **Section** | An H2 of a lesson.
  Every section has a kind. See "Section kinds". | screen, step, slide |"
- `docs/spec/S01-dictionary.md:215` — "Every answer is grounded in the
  concept definitions and behaviors of that / node, never in general
  knowledge alone, and cites the node's reference page."
- `docs/spec/S01-dictionary.md:229` — "Every unit is identified by a
  lowercase kebab-case **slug**."
- `docs/spec/S03-lesson-authoring.md:21` — "Every page has one of the
  four kinds."
- `docs/spec/S03-lesson-authoring.md:114` — "- **Every source is cited by
  key.** `(@key)` in Markdown resolves against / one bibliography file in
  the repo and renders as a numbered reference"
- `site/src/content/docs/building-agents/agent-loop.mdx:126` — "Every real
  loop has a budget."

## Concentration

Top files by hit count:

| file                                | hits |
| ----------------------------------- | ---: |
| `docs/spec/S01-dictionary.md`       |    4 |
| `docs/agents/writing-a-lesson.md`   |    2 |
| `docs/spec/S03-lesson-authoring.md` |    2 |
| `AGENTS.md`                         |    1 |
| `docs/spec/000-specs.md`            |    1 |

Seven of thirteen hits are in `docs/spec/`, where the sentence states a
rule of the project ("Every page has one of four kinds", "Every unit is
identified by a ... slug"); the two `docs/agents/` hits and the `AGENTS.md`
hit are the same register in agent instructions. One hit is in a table
cell (`S01-dictionary.md:56`), three are the bold lead of a list item
(`07-scorm-...:80`, `08-diataxis.md:39`, `S03-lesson-authoring.md:114`),
one a plain list item (`000-specs.md:35`), the rest running prose. The
single lesson hit (`agent-loop.mdx:126`) is a four-word sentence closing a
paragraph about `max_steps`. Six matches end in a code span or a bracketed
link right after the reported span (`.mise.toml`, `consequence`,
`localStorage`, `tutorial`, `[S01 ...]`), so the "object" the rule
requires is a determiner ahead of an identifier.
