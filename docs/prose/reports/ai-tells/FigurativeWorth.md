# ai-tells.FigurativeWorth

## Rule

`.vale/styles/ai-tells/FigurativeWorth.yml` extends the `existence` rule
with `nonword: true`, `ignorecase: true`, and `level: error`. It has one
token: the bare word `worth`, with a lookbehind refusing "net worth" and
hyphenated compounds ("self-worth"), a lookahead refusing the quantity
idiom "worth of" ("two days' worth of logs"), and up to two following
words captured so the finding shows which spelling fired ("worth knowing
about", "worth the effort", "worth it"). The stated rationale: a subject
graded as deserving attention or effort, with the grade standing in for
the fact the reader was owed. The comment records that four other rules
(HedgingPhrases, MicDrop, FormalTransitions, AnthropomorphicJustification)
gave up their "worth" tokens so a finding reports once, that the
reader-directed complements ("worth knowing", "worth a look") measured
zero across seven pre-LLM corpora while the hedge band ("worth noting",
44\) and the tradeoff band ("worth it", 64; "worth the effort"; "worth
adding") are established there, and that the ban takes all three on the
maintainer's call. It says to disable the rule for finance or commerce
writing, where things have a price.

## Stats

Total hits: 18.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |    9 | 15852 |              0.57 |
| spec       |    5 | 13147 |              0.38 |
| agent-docs |    4 |  3200 |              1.25 |
| lessons    |    0 | 12134 |              0.00 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   18 | 66006 |              0.27 |

Top matched phrases:

| phrase                  | count |
| ----------------------- | ----: |
| `worth building`        |     4 |
| `worth building and`    |     2 |
| `worth reusing`         |     2 |
| `worth building before` |     1 |
| `worth`                 |     1 |
| `worth adopting as`     |     1 |
| `worth a small`         |     1 |
| `worth noting`          |     1 |
| `worth the reading`     |     1 |
| `worth a rewrite`       |     1 |
| `worth reading`         |     1 |
| `worth fixing`          |     1 |
| `worth a foundations`   |     1 |

Distinct phrases: 13. Grouped by complement: "worth building" in some
form 7 (plus the bare `worth` at a line break before "building", 8),
"worth reusing" 2, and one each of the rest.

## Examples

Each bullet ends with whether "worth" is used figuratively (a grade of
attention or effort) or literally (a monetary value) in that sentence.

- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:45` —
  "**Worth reusing:** the three-track audience split and its topic lists;
  the tutorial-as-directory layout with shared design assets;
  multi-format render with" Figurative (deserves reuse). Bold label
  opening a paragraph.
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:202` (picked
  at random) — "### Product ideas worth reusing" Figurative. Heading.
- `docs/plan/explore/09-brilliant-skills-map.md:43` — "Tier **The
  governing practices**: development should be informed by judgment about
  what's worth building and guided by building in shippable increments."
  Figurative (paraphrase of the source's tier description).
- `docs/plan/explore/09-brilliant-skills-map.md:45` (picked at random) —
  "- **TAS Taste, what's worth building.** As building gets cheap,
  deciding what's worth building and what a good result is comes first."
  Figurative (the source's skill name; line 46 is the second half of the
  same sentence and counts as a separate hit).
- `docs/plan/explore/09-brilliant-skills-map.md:210` — "5. **Content gaps
  this exposes in area 4 and 6.** Taste (what's worth building),
  specification and design as a first-class topic, verification"
  Figurative; the `Match` is the bare `worth` because "building" starts
  the next line.
- `docs/plan/explore/09-brilliant-skills-map.md:222` — "Worth adopting as
  how paths and the map interact." Figurative (deserves adoption).
- `docs/plan/explore/10-execute-program.md:139` — "Worth a small spec of
  its own." Figurative (deserves the effort).
- `docs/plan/explore/12-learn-prompting.md:55` — "Authoring mechanics
  worth noting:" Figurative (the hedge band).
- `docs/prose/README.md:19` — "| Off | none | | Not worth the reading time
  |" Figurative (doesn't repay the time). Table cell.
- `docs/prose/README.md:55` — "| write-good | Cliches | Every run | Rare,
  and a hit is nearly always worth a rewrite |" Figurative. Table cell.
- `docs/prose/README.md:60` (picked at random) — "| write-good | Passive |
  Now and then | Regex over "is/are/be + participle"; most hits are idiom,
  a minority hide who does what and are worth fixing |" Figurative. Table
  cell.
- `docs/spec/S02-topic-map.md:273` — "| `coding-with-agents/specification`
  | Deciding and specifying | what's worth building, success criteria,
  decomposition into components, dependencies, designing the verification
  | first-session, using-agents/decomposition | new; `Brilliant TAS`,
  `Brilliant SPC` |" Figurative (a listed topic concept). Table cell.
- `docs/spec/S02-topic-map.md:293` — "| `specifies-work` |
  `judges-worth-building` | base | Judges whether something is worth
  building before building it |" Figurative (a learning objective
  statement; the objective's id also contains the word inside a code
  span, which the rule skips). Table cell.
- `docs/spec/S02-topic-map.md:417` (picked at random) — "| TAS | Taste:
  what's worth building | Judge ideas, define success, weigh value against
  cost |" Figurative (the source skill name). Table cell.
- `docs/spec/S02-topic-map.md:523` (picked at random) — "2. Whether
  `safety/governance` is worth a Foundations lesson or only the `expert`
  objective `sets-oversight`. Leaning: one short lesson." Figurative
  (deserves the effort of a lesson).

All 18 hits are figurative; none is a monetary appraisal or the
quantity idiom.

## Concentration

Top five files by hit count:

| file                                                            | hits |
| --------------------------------------------------------------- | ---: |
| `docs/plan/explore/09-brilliant-skills-map.md`                  |    5 |
| `docs/spec/S02-topic-map.md`                                    |    5 |
| `docs/prose/README.md`                                          |    4 |
| `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` |    1 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md`     |    1 |

Six files carry hits; no lesson does. Eight of the 18 are the phrase
"what's worth building", which is the name of a skill in the Brilliant
"Coding with AI" skills map that `09-brilliant-skills-map.md` summarizes
and `S02-topic-map.md` maps onto this project's topics and objectives;
these appear in a bold label, a tier paraphrase, and four table cells.
Eight hits sit in Markdown table cells (four in `docs/spec/S02-topic-map.md`,
three in `docs/prose/README.md`, plus the S02 objective row), one is a
heading, two are bold labels, and the rest are short verdict sentences in
plan notes ("Worth adopting as ...", "Worth a small spec of its own.").
No hits inside code spans; the objective id `judges-worth-building`
contains the word but is skipped as code.
