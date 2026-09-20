# ai-tells.FigurativeCarries

## Rule

`.vale/styles/ai-tells/FigurativeCarries.yml` extends the `existence` rule
with `nonword: true`, `ignorecase: true`, and `level: error`, message "AI
overused verb: '%s'. Say what it contains or entails. Disable this rule for
freight or logistics prose." The YAML comment calls "carries" an AI
fingerprint for "freighting an abstraction with unstated consequence" (a
term "carries baggage", a change "carries risk"). It has 20 token
patterns in eight families: verb-first tokens gated on a head-noun list
(weight/significance/risk, caveat/cost/penalty, the day/team/torch,
logic/state/payload/data, pattern/rule/policy/constraint,
prefix/suffix/tag/label, "carries no ...", "carries the same"), and
open-subject tokens where the discriminator is a determiner-gated,
pronoun, code-span, plural, or auxiliary-fronted subject with the
complement left open. Phrasal "carries out/over/on" and the arithmetic
carry are excluded by lookaheads. A 52-entry `exceptions` list names
literal carriers (vehicles, people, disease vectors, wires, water, plus
"paper", "context", and "object"). The comment says freight, logistics,
biology, electrical, medical, finance, and media writing should disable the
rule per file.

## Stats

Total hits: 16.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |   10 | 15852 |              0.63 |
| spec       |    3 | 13147 |              0.23 |
| lessons    |    2 | 12134 |              0.16 |
| agent-docs |    1 |  3200 |              0.31 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   16 | 66006 |              0.24 |

Top matched phrases (every match is distinct, count 1 each):

| phrase                             | count |
| ---------------------------------- | ----: |
| `a derivative may carry`           |     1 |
| `derivatives must carry`           |     1 |
| `primitives carry`                 |     1 |
| `answers carry`                    |     1 |
| `theirs carry`                     |     1 |
| `ours carry`                       |     1 |
| `of ours should carry`             |     1 |
| `that carry`                       |     1 |
| `every ai surface carries`         |     1 |
| `should carry`                     |     1 |
| `which files carry`                |     1 |
| `the node that carries`            |     1 |
| `the agent carries`                |     1 |
| `whether foundations should carry` |     1 |
| `the agent itself carries`         |     1 |

Distinct phrases: 16 (the sixteenth is `carries as much weight`). The
open-subject tokens report the subject together with the verb, so no two
matches share a string; the verb form splits 9 `carry`, 7 `carries`.

## Examples

Sixteen hits is one over the template's ceiling, so fifteen are listed;
the one left out is `docs/plan/explore/09-brilliant-skills-map.md:177`
second match (`ours carry`), which sits in the same table cell as the
`Theirs carry` example below.

- `docs/plan/explore/02-agent-engineer-course.md:102` — "A derivative may
  carry a CC license while keeping / Apache-2.0 terms on the incorporated
  material."
- `docs/plan/explore/03-cs50-pedagogy.md:98` — "**non-commercial only**;
  derivatives must carry the same license."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:130` — "-
  About six primitives carry the corpus: MCQ, matching, bucket sort, /
  multi-select-N, textarea + self-grade, reveal/accordion."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:207` — "-
  Endorsed answers: bot answers carry a disclaimer until a human endorses."
- `docs/plan/explore/09-brilliant-skills-map.md:177` — "| Big idea (noun)
  | Topic | Same register. Theirs carry a one-sentence "why now" summary;
  ours carry concepts and edges. |"
- `docs/plan/explore/09-brilliant-skills-map.md:202` — "Our 18 are
  big-idea sized. Brilliant's 37 / objectives for coding-with-AI alone
  suggest each of ours should carry / three to six coded objectives, and
  the objectives are what lessons and / checkpoints point at."
- `docs/plan/explore/11-roadmap-sh.md:51` — "Topic and subtopic are the /
  only nodes that carry content, and the parent relation is stored on the
  / rendered SVG (`data-parent-id`) rather than in the JSON."
- `docs/plan/explore/11-roadmap-sh.md:129` — "Every AI surface carries "AI
  can make mistakes, verify important / information"."
- `docs/plan/explore/12-learn-prompting.md:149` — "Ours / should carry the
  model and date, since their undated davinci-003 outputs / are the main
  reason the pages aged badly."
- `docs/prose/report-template.md:32` — "4. **Concentration.** Which files
  carry the most hits (top five with / counts), and whether the hits
  cluster in tables, headings, quoted / material, code-adjacent text or
  running prose."
- `docs/spec/S01-dictionary.md:148` — "| **Topic** | A named cluster of
  two to eight concepts inside an area, for example *Prompting*, *Tool
  use*. A noun. The unit a lesson covers and the node that carries links.
  Has its own reference page. | subject, module, theme, competency |"
- `docs/spec/S02-topic-map.md:338` — "| `configures-agent` |
  `manages-memory` | expert | Manages what the agent carries between
  sessions |"
- `docs/spec/S02-topic-map.md:527` — "4. Whether Foundations should carry
  any `expert` objectives at all. Two are drafted above
  (`keeps-a-check-habit`, `sets-oversight`); / drop them if Foundations
  stops at `base` by design."
- `site/src/content/docs/safety/agent-risk.mdx:204` — "With an agent, the
  / worrying version is when the agent itself carries it out, because it
  was / told to by something it read."
- `site/src/content/docs/using-agents/delegating.mdx:69` — "That's why
  what it must / *not* do carries as much weight as what it must do, and
  why "summarize this" / is a request but not a brief."

Every area with hits is represented. All phrases have count 1, so the
"top five" criterion is moot; no random draw was needed since all but one
hit are listed.

## Concentration

Top files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/plan/explore/09-brilliant-skills-map.md`              |    3 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |    2 |
| `docs/plan/explore/11-roadmap-sh.md`                        |    2 |
| `docs/spec/S02-topic-map.md`                                |    2 |
| `docs/plan/explore/02-agent-engineer-course.md`             |    1 |

Ten of sixteen hits are in `docs/plan/explore/`. Four sit inside Markdown
table cells (`09-brilliant-skills-map.md:177` twice, `S01-dictionary.md:148`,
`S02-topic-map.md:338`), three in list items, the rest in running prose.
Two matches are the literal-adjacent senses the YAML comment discusses:
`agent-risk.mdx:204` is "carries it out" with a pronoun object between the
verb and "out", so the `(?!\s+out)` lookahead does not apply, and the two
license hits (`02-agent-engineer-course.md:102`, `03-cs50-pedagogy.md:98`)
use "carry a license" in the legal-terms sense. No hits are in headings or
code blocks; `report-template.md:32` is a numbered-list item in an
agent-facing doc.
