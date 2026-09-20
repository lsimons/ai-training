# ai-tells.FormalTransitions

## Rule

`.vale/styles/ai-tells/FormalTransitions.yml` extends the `existence`
rule with `ignorecase: true` and `level: error` (word-boundary matching;
`nonword` is not set). It lists 74 tokens: single-word connectives
("Moreover", "Furthermore", "Additionally", "Consequently", "Hence",
"Thus", "Therefore", "Likewise", "Similarly", "Notably", "Crucially",
"Importantly"), multi-word ones ("In addition", "By contrast", "As a
result", "For instance", "For example", "In particular", "That's why",
"This is because", "Not to mention", "Case in point", "In the same vein",
"By extension", "Given that", "Given the above"), and five degree adverbs
anchored to the line start with a trailing comma ("^Specifically(?=,)",
"^Significantly(?=,)", "^Essentially(?=,)", "^Fundamentally(?=,)",
"^Of note"), because their mid-sentence senses are not the tell. Message:
"AI transition: '%s'. Delete it, or use a simpler connector like 'and',
'but', or 'so'." The YAML has short comments only, no stated rationale
beyond the anchoring note and no disable guidance. The comment notes
that "Worth noting" belongs to FigurativeWorth.

## Stats

Total hits: 19.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    7 | 13147 |              0.53 |
| plan       |    6 | 15852 |              0.38 |
| lessons    |    6 | 12134 |              0.49 |
| agent-docs |    0 |  3200 |              0.00 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   19 | 66006 |              0.29 |

Top matched phrases:

| phrase        | count |
| ------------- | ----: |
| `for example` |    13 |
| `that's why`  |     4 |
| `notably`     |     1 |
| `hence`       |     1 |

Distinct phrases: 4, out of 74 tokens. "For example" is also what the
house style's `Google.Latin` rule prescribes in place of "e.g."
(`AGENTS.md`, Quality section), which is a fact about the overlap, not a
verdict.

## Examples

- `docs/plan/explore/02-agent-engineer-course.md:59` (picked at random) —
  "Prose exercises exist ("Hands-On Exercise", "Try it yourself", notably
  lessons 12 and 13)."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:67` — "One
  JSON blob in localStorage under a **versioned key** (for example
  `dev-m2-vF2`) so content changes invalidate state."
- `docs/plan/explore/08-diataxis.md:52` — "One path, no choices, or
  alternatives. Hence comfort levels apply to alternative exercises and
  shorts, never to branches inside a lesson."
- `docs/plan/explore/09-brilliant-skills-map.md:153` — "Vocabulary:
  **course** (subject, for example Fractions), **level** (a group of
  lessons capped by a 10 to 15 problem **level review**), **lesson** (5
  to 10"
- `docs/plan/explore/10-execute-program.md:69` (picked at random) — "Some
  lessons are titled **Quiz: ...** (for example "Quiz: Two Foreign Keys"
  in SQL), which are code problems without teaching."
- `docs/plan/explore/11-roadmap-sh.md:183` — "**Lesson Packs** at
  `/packs` are hand-written short courses by the roadmap.sh team (for
  example Git Fundamentals, 14 lessons, 2.3 hours read) with projects
  and "an AI tutor on the side"."
- `docs/spec/000-specs.md:22` — "- Spec files are named `SNN-<slug>.md`,
  for example `S01-dictionary.md`."
- `docs/spec/000-specs.md:38` — "- Cross-references are relative links
  with the spec's title, for example `[project dictionary](S01-dictionary.md)`.
  Inside tables, use the number:"
- `docs/spec/S01-dictionary.md:146` (picked at random) — "| **Concept**
  | A named idea a learner can understand and explain, for example
  *context window*, *prompt injection*. The smallest node. Belongs to
  exactly one topic. Has a one-paragraph definition and a glossary
  anchor. | idea, notion |"
- `docs/spec/S01-dictionary.md:149` — "| **Competency** | Something a
  learner can *do*, stated as a verb phrase, for example *Verifies AI
  output before relying on it*. Draws on one or more topics, possibly
  across areas. Owns three to six learning objectives. | skill,
  capability, ability, topic |"
- `docs/spec/S01-dictionary.md:153` — "| **Goal** | A learner-chosen
  destination expressed as a competency at a level, for example "Building
  agents: base". Paths are the routes to goals. | objective, target |"
- `site/src/content/docs/coding-with-agents/first-session.mdx:220` —
  "Everything you have said and everything the agent has read in this
  session sits in its context window: the agent's working memory. That's
  why the agent could answer "explain this repository" once and then fix
  the bug"
- `site/src/content/docs/concepts/how-models-work.mdx:77` — "That's why
  models know a great deal about things that appear often in writing and
  are unreliable about things that appear rarely, recently, or"
- `site/src/content/docs/customizing-agents/instructions.mdx:215` — "For
  example, a hook that runs before every shell command, inspects the
  command the agent is"
- `site/src/content/docs/using-agents/delegating.mdx:68` — "The agent
  fills in whatever you leave unsaid with plausible defaults. That's why
  what it must *not* do carries as much weight as what it must do, and
  why "summarize this""

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/spec/S01-dictionary.md`                               |    5 |
| `docs/spec/000-specs.md`                                    |    2 |
| `site/src/content/docs/using-agents/delegating.mdx`         |    2 |
| `docs/plan/explore/02-agent-engineer-course.md`             |    1 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |    1 |

Fourteen files carry hits. The five `docs/spec/S01-dictionary.md` hits
are all "for example" inside the definition column of one glossary table,
introducing italicized instances of the term being defined. Eleven of the
thirteen "for example" hits are parenthetical or mid-sentence, introducing
a concrete instance (a filename, a course name, a quiz title); the two
lesson hits (`instructions.mdx:215`, `delegating.mdx:165`) open a
sentence with "For example,". All four "That's why" hits are in lessons,
each opening a sentence that draws a consequence from the sentence
before. "Hence" and "notably" appear once each, in plan notes. No hits
in headings, code, or quoted source material.
