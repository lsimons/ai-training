# ai-tells.CataphoricForecasting

## Rule

`.vale/styles/ai-tells/CataphoricForecasting.yml` extends the
`existence` rule with `nonword: true`, `level: error`, and 13 regex
tokens grouped in the YAML as patterns A through H. The shared anchor is
a spelled-out cardinal (`Two` through `Ten`, in Pattern G through
`Twelve`) at the start of a sentence, so capitalized. Pattern A pairs it
with a curated framework noun (`pillars`, `principles`, `tenets`,
`personas`, `levers`, `axes`, `dimensions`, and so on); Pattern B with a
one- or two-word noun phrase and a forecasting verb (`define`, `shape`,
`drive`, `govern`, `anchor`, ...); Pattern C is the listicle pivot
("Here are the four", "The following three"); a demonstrative form
covers "These three pillars"; Patterns D and E take a lowercase
mid-sentence count after a progression or grouping verb ("breaks down
into four stages", "falls into three categories"); Pattern F is
sentence-initial "The <cardinal> <noun>"; Pattern G is any
sentence-initial cardinal followed by two lowercase-continuing words,
with a lookahead that drops temporal and partitive follow-words (`of`,
`to`, `hours`, `weeks`, `percent`, ...); Pattern H is the folksy
proportion ("three of every four", "nine times out of ten"). The
message is "AI numbered lead-in: '%s'. Present the items or the measured
figures directly instead of leading with a count." The YAML comment
gives the rationale: "a sentence that announces a count of items and
then enumerates them" is "a lead-in ... pointing forward to content that
has not arrived yet"; Vale can't see whether a list block follows, so
sentence-initial position is "the proxy for the adjacency." It says to
disable the rule "for hardware or mechanical writing" (literal levers
and pillars) and, for Patterns F and G, to "add a project exception"
for a legitimate back-reference ("The two functions return different
types.") or a proper noun that opens with a cardinal ("Three Mile
Island"). The `Match` is the token's span, so it varies per hit.

## Stats

Total hits: 32.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |   19 | 15852 |              1.20 |
| lessons    |    8 | 12134 |              0.66 |
| spec       |    5 | 13147 |              0.38 |
| agent-docs |    0 |  3200 |              0.00 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   32 | 66006 |              0.48 |

Top matched phrases:

| phrase                               | count |
| ------------------------------------ | ----: |
| `two prompting principles`           |     2 |
| `two sidebar groups:`                |     1 |
| `eleven prioritized recommendations` |     1 |
| `three sources:`                     |     1 |
| `four quality pillars`               |     1 |
| `three hint tiers:`                  |     1 |
| `three ramps:`                       |     1 |
| `two sequencing idioms:`             |     1 |
| `four moves:`                        |     1 |
| `the four quadrants`                 |     1 |
| `two halves:`                        |     1 |
| `three per half`                     |     1 |
| `three representative skills`        |     1 |
| `two views over the same mapping:`   |     1 |
| `three element kinds`                |     1 |

Distinct phrases: 31 (of 32). The repeat is the same DeepLearning.AI
course summary in two plan tables
(`docs/plan/explore/05-career-model-and-deeplearning-ai.md:90` and
`docs/plan/explore/06-lesson-inventory.md:108`). By cardinal: `Two` 14,
`Three` 10, `Four` 4, `Six` 2, `Five` 1, `Eleven` 1. 11 of the 32
matches end in a colon (Pattern A and B tokens allow a trailing `:`);
2 begin with `The` (Pattern F: `The four quadrants`, `The three paths`); 3 hits (2 phrases) end in a Pattern A framework noun (`Four quality pillars`, `Two prompting principles` twice).

## Examples

- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:90` (table
  cell) — "| 1 | ChatGPT Prompt Engineering | Two prompting principles,
  then summarize/infer/transform/expand, a chatbot | AIC |"
- `docs/plan/explore/04-anthropic-academy.md:8` — "Three sources:
  partner Skilljar, public Skilljar (being retired), and Claude /
  Academy (<https://academy.claude.com>), the public successor."
- `docs/plan/explore/06-lesson-inventory.md:30` (table cell) — "| 09 |
  `09-evaluating-and-testing-agents.md` | Four quality pillars, metrics,
  trajectories, LLM-as-judge, eval harness | 6.5k, 35 m | 1, 2, 6 |
  Engineer | ..."
- `docs/plan/explore/06-lesson-inventory.md:89` — "- Hard rule: never
  state the answer to an open question. Three hint tiers: / reframe,
  locate, scaffold."
- `docs/plan/explore/08-diataxis.md:14` — "The four quadrants are the
  four / kinds of documentation, and the claim is that there are exactly
  four because"
- `docs/plan/explore/09-brilliant-skills-map.md:117` (heading) — "###
  Three representative skills, paraphrased"
- `docs/plan/explore/09-brilliant-skills-map.md:29` (picked at random;
  table cell) — "| Tier | A named band on the map with a one-paragraph
  note. Three per half. | "The build loop" | ..."
- `docs/plan/explore/10-execute-program.md:69` — "Some / lessons are
  titled **Quiz: ...** (for example "Quiz: Two Foreign Keys" in / SQL),
  which are code problems without teaching."
- `docs/spec/S02-topic-map.md:262` — "Two topics exist because
  Brilliant's map shows where human skill / concentrates once an agent
  does the implementing:"
- `docs/spec/S06-release-1.md:53` (table cell) — "| Lesson graph | Six
  course pages, each a one-node graph with a milestone bar and
  completion ring |"
- `docs/spec/S06-release-1.md:74` — "- Paths as rendered maps. The three
  paths are defined as data; the / three-lane rendering can wait until
  courses have more than one lesson."
- `site/src/content/docs/customizing-agents/instructions.mdx:108` —
  "Three things to leave out:"
- `site/src/content/docs/using-agents/delegating.mdx:55` — "2. Three
  bullets: what's happening, what you must do, and by when."
- `site/src/content/docs/safety/agent-risk.mdx:102` (picked at random) —
  "Two things people get wrong here. First, they think about the task
  and grant / what the task needs at its widest."
- `site/src/content/docs/safety/agent-risk.mdx:127` (picked at random) —
  "Three questions sort actions quickly."
- `site/src/content/docs/safety/agent-risk.mdx:157` (inside a
  `<Response>` block) — "I found four scheduling emails and drafted a
  reply to each with a free slot. / The drafts are in your outbox. Two
  go to people outside the company; do you / want to review those before
  I send any?"
- `site/src/content/docs/coding-with-agents/first-session.mdx:94` —
  "Most coding / agents load a project-instructions file at start. Four
  lines there set the / rules for the whole session, and you didn't
  have to repeat them."

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/plan/explore/06-lesson-inventory.md`                  |    4 |
| `docs/plan/explore/09-brilliant-skills-map.md`              |    4 |
| `docs/spec/S06-release-1.md`                                |    3 |
| `site/src/content/docs/safety/agent-risk.mdx`               |    3 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |    2 |

Four more files have 2 each (`docs/plan/explore/10-execute-program.md`,
`docs/plan/explore/12-learn-prompting.md`, `docs/spec/S02-topic-map.md`,
`site/src/content/docs/customizing-agents/instructions.mdx`). By the
line the hit sits on: 18 hits are in running prose, 7 in Markdown table
rows, 6 in list items, and 1 in a heading. Of the 11 colon-ending
matches, 4 are a whole line or paragraph directly above a list (`Two sequencing idioms:`, `Two views over the same mapping:`, `Two branches matter:`, `Three things to leave out:`) and 7 are followed on the same
line by the items they count (`Three sources:`, `Three hint tiers:`,
`Three ramps:`, `Four moves:`, `Two halves:`, `Three bullets:`, `Two sidebar groups:`). Two matches are
counts inside quoted or example material rather than the author's own
lead-in: the quiz title "Quiz: Two Foreign Keys" at
`10-execute-program.md:69` and the agent reply "Two go to people
outside the company" in the `agent-risk.mdx:157` transcript. The plan
hits sit in exploration notes summarizing another site's structure
(`Three element kinds`, `Two halves`, `Three per half`, `Four quality pillars`); the lesson hits are paragraph openers in `agent-risk.mdx`,
`how-models-work.mdx` (`Two things to notice.`), and
`instructions.mdx` (`Five lines of content.`).
