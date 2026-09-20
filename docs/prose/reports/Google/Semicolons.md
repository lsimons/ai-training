# Google.Semicolons

## Rule

`.vale/styles/Google/Semicolons.yml` extends the `existence` rule with
`nonword: true`, `scope: sentence`, a `tokens` list holding a single
pattern (`;`), and `level: suggestion`. It fires once per semicolon
character found anywhere in a sentence, message "Use semicolons
judiciously.", linking to
`https://developers.google.com/style/semicolons`. The token list has one
entry, so every hit is a literal `;` — there is no word list to size.

## Stats

Total hits: 510.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |  254 | 15884 |             15.99 |
| spec       |  122 | 13184 |              9.25 |
| lessons    |   60 | 12227 |              4.91 |
| repo-docs  |   49 |  3489 |             14.04 |
| agent-docs |   25 |  2707 |              9.24 |
| data       |    0 | 18534 |              0.00 |
| **total**  |  510 | 66025 |              7.73 |

Top matched phrases:

| phrase | count |
| ------ | ----: |
| `;`    |   510 |

Distinct phrases: 1. The rule's token is a bare, non-word character, so
every alert has an identical `Match` value; there is no phrase-level
variation to rank.

## Examples

- `AGENTS.md:8` — "published to GitHub Pages. Basic material is for
  knowledge workers; the rest is for software engineers. The plan is in
  `docs/plan/README.md`."
- `.claude/skills/tutor/SKILL.md:43` — "| quiz me | Ask one question per
  served objective, one at a time; hints on a miss, never answers |"
- `docs/plan/explore/06-lesson-inventory.md:15` — "Total prose is about
  82k words, roughly 7.5 h of reading; with the exercises and build
  lessons 12-16 h."
- `docs/spec/S02-topic-map.md:277` — "| `coding-with-agents/verification`
  | Verifying agent work | reviewing code you did not write, verifying
  against the specification, observing a running system, isolating a
  fault, bounded self-checking loops | workflow, safety/verification |
  new; `Brilliant VER` |"
- `site/src/content/docs/safety/agent-risk.mdx:79` — "The second phrasing
  is uncomfortable. That is the point; it tells you what to shrink."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:7` —
  "Licensing: the Anthropic SCORM packages are proprietary. This note
  records **structure, mechanics and counts only**; no lesson text,
  question stems, options, rationales or model answers."
- `docs/spec/S06-release-1.md:12` — "Terms are per the [project
  dictionary](S01-dictionary.md); topics, objectives and the
  source-material keys are per the"
- `site/src/content/docs/using-agents/delegating.mdx:34` — "Here is the
  text you will hand over. It is fictional; read it once now so that you
  can judge the agent's work later."
- `README.md:7` — "Site: <https://lsimons.github.io/ai-training/> (not
  yet published; see \[Publishing\](#publishing))."
- `docs/spec/S01-dictionary.md:16` — "software engineers who have
  finished Foundations. Learner state lives in the browser only; there is
  no backend."
- `docs/prose/report-template.md:29` (picked at random) — "Choose them so
  that: every area with hits has at least one; the top five phrases each
  appear at least once; at least three are picked at random from the rest
  (say which)."
- `docs/agents/writing-a-lesson.md:117` (picked at random) — "Every
  option has a `consequence`; the correct one too."
- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:19` (picked
  at random) — "44 files exist; most are stubs (`definition: todo`);
  `construction/coding.yaml` is fully fleshed out."

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/spec/S02-topic-map.md`                                |   63 |
| `docs/plan/explore/06-lesson-inventory.md`                  |   61 |
| `AGENTS.md`                                                 |   37 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |   37 |
| `docs/plan/explore/11-roadmap-sh.md`                        |   19 |

`docs/spec/S02-topic-map.md` carries its hits mostly inside the large
Markdown table of areas/topics, where semicolons separate list items
within a single cell (see the example above). The `docs/plan/explore/`
files and `AGENTS.md` carry their hits in running prose, joining two
independent clauses or appending a qualifying clause, as in the AGENTS.md
and delegating.mdx examples above. No hits fall inside code blocks or
code-adjacent spans (the rule's `nonword`/`sentence` scope only inspects
prose text, and no hits appear in files under `site/examples/`).
