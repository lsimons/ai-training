# ai-tells.AnthropomorphicCognition

## Rule

`.vale/styles/ai-tells/AnthropomorphicCognition.yml` extends the
`existence` rule with `nonword: true`, `ignorecase: true`, `level: error`, 73 regex tokens, and 41 `exceptions`. The tokens look for
cognition or volition attributed to an artifact, grouped in the YAML as
volition ("the spec wants us to retry"), teaching (an artifact as
teacher, or a tool as pupil: "teach the compiler that"), learning
("cspell learns the new slug"), ignorance ("has no idea"), inquiry and
trust ("asks whether", "the reviewer trusts the inlined material"),
judgment ("decides which", "answers questions", "answers to", "forbids",
"arbitrates", "cedes", "adopts"), instruction ("tells you to"),
fallibility ("could mistake", "can't tell", "guesses"), pretense and
pursuit ("pretends", "hunts"), confusion and misconduct ("gets
confused", "misbehaves"), and honesty ("tells the truth"). Most tokens
put a determiner-led subject or the object inside the span so that the
exceptions, which name people and roles (`we`, `you`, `users?`,
`readers?`, `reviewers?`, `students?`, `teachers?`, `children`,
`teams?`, `customers?`, and so on), can drop a match where a human does
the thinking. The message is "AI anthropomorphism: '%s'. State what the
tool checks or produces. Disable this rule for prose about people." The
YAML comment gives the rationale ("Cognition and volition handed to an
artifact ... what remains is the machine given a mind") and records
per-token costs measured across the Go and Python standard libraries
and a documentation corpus. It names three cases to disable the rule:
"Machine-learning prose, where a model literally learns", "prose about
people" (for the teaching tokens), and "security writing", where trust
anchors use "trusts" literally. The `Match` is the token's span, so it
varies per hit.

## Stats

Total hits: 42.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |   21 | 13147 |              1.60 |
| plan       |   10 | 15852 |              0.63 |
| agent-docs |    5 |  3200 |              1.56 |
| lessons    |    4 | 12134 |              0.33 |
| repo-docs  |    2 |  3139 |              0.64 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   42 | 66006 |              0.64 |

Top matched phrases:

| phrase                    | count |
| ------------------------- | ----: |
| `teaches it`              |     6 |
| `teaching it`             |     3 |
| `teaching fellow`         |     2 |
| `teaching fellows`        |     2 |
| `teaches one`             |     2 |
| `teaches toward`          |     2 |
| `taught and`              |     2 |
| `a learner asks for`      |     1 |
| `teaching approach`       |     1 |
| `this project adopts its` |     1 |
| `teaching prose`          |     1 |
| `teach and`               |     1 |
| `teaching screens`        |     1 |
| `teach environment`       |     1 |
| `teaching resources`      |     1 |

Distinct phrases: 30. 34 of the 42 matches contain `teach` or
`taught`. Of those, 19 are the verb (`teaches it` 6, `teaches one` 2,
`teaches toward` 2, `taught and` 2, `taught here`, `teach a lesson`,
`teaching assumed`, `teach and`, `teach environment`, `teach`, `teach nothing`), 12 are "teaching" as a modifier or noun in a compound
(`teaching fellow(s)` 4, `teaching assistant`, `teaching resources`,
`teaching prose`, `teaching screens`, `teaching text`, `teaching element`, `teaching approach`, `Teaching AI`), and 3 are the noun "the
teaching" in "the teaching it belongs to". The 8 non-teaching matches
come from the `asks` tokens (3: `a learner asks for`, `each objective asks for`, `a wrong answer asks a`; plus `the agent and ask it`), the
`answers` token (`The model answers with`), `adopts` (`This project adopts its`), `forbids` (`license forbids`), and `guesses` (`the wrong guesses`).

## Examples

- `docs/spec/S02-topic-map.md:47` (picked at random) — "**serves**, the
  objectives it **assumes** (each pointing at the lesson / section that
  teaches it) and the lessons, topics, or shorts it **extends / to**."
- `.claude/skills/tutor/SKILL.md:14` — "If the gap is upstream, / point
  at the section that teaches it (the lesson's `assumes` frontmatter /
  names it) rather than re-explaining."
- `docs/spec/S01-dictionary.md:57` (table cell) — "| **Pitfall** | A
  section showing a realistic failure mode right after the teaching it
  belongs to: setup, what went wrong, the rule. |"
- `docs/plan/explore/03-cs50-pedagogy.md:47` — "**sections** / (about
  1h, hands-on practice with a teaching fellow), **problem set / pset**
  / (the programming assignment), **practice problems** (smaller,
  exit-ticket"
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:198` —
  "debugging, 10 error message, 5 intro, 5 conceptual); blind pairwise
  A/B by 29 / teaching fellows, single- and multi-turn; Elo with 95%
  CIs."
- `docs/spec/S02-topic-map.md:31` — "A lesson / covers one topic and
  teaches one to five of its concepts."
- `docs/spec/S03-lesson-authoring.md:61` (picked at random; table cell)
  — "| `serves` | The learning objective ids the lesson teaches toward;
  each gets at least one checkpoint |"
- `docs/spec/S02-topic-map.md:33` (heading) — "### Taught and learned"
- `docs/spec/S02-topic-map.md:90` (picked at random; table cell) — "|
  Edges | Dotted lines from the lessons that teach an assumed objective
  to the lessons that assume it; derived from `assumes` at build time
  |"
- `docs/agents/writing-a-lesson.md:167` — "Widgets are their own
  components under `site/src/components/widgets/` and / are imported by
  name. They teach and never grade."
- `NOTICE.md:21` — "This project adopts its four documentation kinds and
  the / compass; see `docs/plan/explore/08-diataxis.md`."
- `docs/plan/explore/11-roadmap-sh.md:246` — "Not adopted: the
  drawing-as-map model (no prerequisite semantics, layout by / hand),
  sponsored "premium resources", quotas and upsell, and any of their /
  text or images, which the license forbids."
- `docs/spec/S02-topic-map.md:476` (table cell) — "| Tutor mode | On a
  wrong answer asks a diagnostic question; if the gap is upstream it
  points at the upstream section rather than re-explaining. |"
- `site/src/content/docs/concepts/how-models-work.mdx:125` — "You ask
  for the release date of a library version that came out last / month.
  The model answers with a specific date, stated confidently, and it /
  is wrong."
- `site/src/content/docs/coding-with-agents/first-session.mdx:65`
  (heading) — "## Start the agent and ask it to explain"
- `site/src/content/docs/customizing-agents/instructions.mdx:236` — "A
  good result: the second run makes none of the wrong guesses from the /
  first, and every line in your file traces back to one of them."

## Concentration

Top five files by hit count:

| file                                    | hits |
| --------------------------------------- | ---: |
| `docs/spec/S02-topic-map.md`            |    9 |
| `docs/spec/S01-dictionary.md`           |    8 |
| `docs/plan/explore/03-cs50-pedagogy.md` |    5 |
| `docs/spec/S03-lesson-authoring.md`     |    3 |
| `.claude/skills/tutor/SKILL.md`         |    2 |

Three more files have 2 each (`NOTICE.md`,
`docs/agents/writing-a-lesson.md`,
`site/src/content/docs/customizing-agents/instructions.mdx`). By
the line the hit sits on: 23 hits are in running prose, 14 in Markdown
table rows, 3 in list items, and 2 in headings. The spec hits cluster in
the dictionary and topic-map tables that define what a lesson, section,
or widget does ("the section that teaches it", "the lesson teaches
toward", "teaches one to five of its concepts"); the same phrase
"the section that teaches it" appears in `S02-topic-map.md` (lines 47,
468, 475), `S03-lesson-authoring.md:62`, `S05-spaced-review.md:72`, and
`.claude/skills/tutor/SKILL.md:14`. The `docs/plan/explore/03-cs50- pedagogy.md` hits are the CS50 role names `teaching fellow`, `teaching assistant`, and `teaching resources`, one of them inside a quoted CS50
system prompt (line 74). The four lesson hits are one heading
(`ask it to explain`), one checkpoint stem (`The model answers with`),
and two prose lines in `instructions.mdx` (`teach nothing`, at line
122, about generic instruction lines; `the wrong guesses`, at line
236, about the agent's first run).
