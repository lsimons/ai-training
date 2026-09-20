# ai-tells.FigurativeShape

## Rule

`.vale/styles/ai-tells/FigurativeShape.yml` extends the `existence` rule
with `nonword: true`, `ignorecase: true`, and `level: error`. Five regex
tokens match "shape" used as a stand-in for a concrete noun (a data
structure, a message format, a review's size, a prose rhythm): a
determiner-gated noun with an optional modifier ("the shape", "the same
shape", "a review shape"), the bare "shape of" followed by a determiner,
the gerund and relative verb forms ("shaping the", "what shapes the"), the
hyphenated compound ("code-shaped"), and a gated plural ("the shapes",
"both shapes"). Each token carries long negative lookaheads that refuse
geometric and graphics heads ("shape of the curve", "polygon shape"),
Go's generics vocabulary ("shape type"), and literal-outline prefixes
("star-shaped", "L-shaped"). Message: "AI figurative noun: '%s'. Say which
structure, format, size, or pattern it stands for." The YAML comment
states the count is deliberately high (about sixty-five hits across seven
pre-LLM corpora) and says to disable the rule for prose about geometry,
graphics, or array dimensions.

## Stats

Total hits: 23.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    9 | 13147 |              0.68 |
| plan       |    8 | 15852 |              0.50 |
| lessons    |    4 | 12134 |              0.33 |
| agent-docs |    2 |  3200 |              0.63 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   23 | 66006 |              0.35 |

Top matched phrases:

| phrase                  | count |
| ----------------------- | ----: |
| `the shape`             |     8 |
| `shaping the`           |     4 |
| `exercise-shaped`       |     2 |
| `two shapes`            |     1 |
| `same shape`            |     1 |
| `the lesson shape`      |     1 |
| `the walkthrough shape` |     1 |
| `the repository shapes` |     1 |
| `a different shape`     |     1 |
| `shape of a`            |     1 |
| `a shape`               |     1 |
| `shape of the`          |     1 |

Distinct phrases: 12. The two `shape of` matches carry a trailing space
in `Match` because the token ends at the determiner boundary.

## Examples

Each bullet ends with whether the flagged word is used figuratively or
literally in that sentence.

- `docs/plan/README.md:84` — "| First public release ("done") | One thin
  slice through all six areas: one or two lessons each so the shape is
  visible end to end, then deepen. |" Figurative (the site's overall
  structure).
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:82` —
  "Cluster 4 ("shaping the build") is covered by neither Osmani nor
  DLAI." Figurative (a quoted skill-cluster name; "shaping" means
  deciding what goes into the build).
- `docs/plan/explore/06-lesson-inventory.md:39` — "| 13 |
  `13-building-your-first-agent.md` | Agent loop from scratch in six
  steps, then with the Agent SDK | 3.8k, 20 m + 2-3 h | 6, 4 | Engineer |
  Only lesson with no widget; most exercise-shaped |" Figurative
  (resembles an exercise in form).
- `docs/plan/explore/06-lesson-inventory.md:122` — "names four skills:
  building/deploying AI apps, software engineering fundamentals, using
  coding agents, shaping the build. Maps onto areas 6, 4, 3 and justifies
  the area split." Figurative (same source skill name).
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:68` (picked
  at random) — "One JSON blob in localStorage under a **versioned key**
  (for example `dev-m2-vF2`) so content changes invalidate state. Two
  shapes; the nicer one keeps `visited / done / skipped / attempted`."
  Figurative (two JSON data-structure layouts).
- `docs/plan/explore/09-brilliant-skills-map.md:113` — "Principles),
  Algorithms & Data Structures (EFF Analyzing Efficiency, DSI Data
  Structures & Interfaces, ALG Algorithm Design). Same shape. Not our
  subject, but it shows the framework is meant to span from classic CS
  to AI-era" Figurative (the same tier-and-code structure).
- `docs/plan/explore/12-learn-prompting.md:155` — "6. **The walkthrough
  shape.** The Applied Prompting pages (LSAT multiple choice, discussion
  questions) follow a good tutorial arc: naive prompt," Figurative (the
  arc or pattern of a tutorial).
- `docs/prose/README.md:7` (picked at random) — "Every Markdown file in
  the repository shapes the Markdown written after it: authors and
  agents read these files and copy their patterns." Figurative (the verb
  "influences"); the match is the plural-noun token reading "the
  repository shapes" as a noun phrase, though "shapes" is a verb here.
- `docs/prose/README.md:42` — "A *metric* package (Readability) is a
  different shape: each rule computes one score per file and Vale
  reports only the files over the threshold, at" Figurative (a different
  kind of package).
- `docs/spec/000-specs.md:46` — "## Shape of a spec" Figurative (the
  section layout a spec follows). Heading.
- `docs/spec/S02-topic-map.md:184` — "| `prompts-reliably` |
  `asks-for-structure` | base | Asks for output in a shape the next step
  can use |" Figurative (an output format).
- `docs/spec/S05-spaced-review.md:97` — "The schedule lives in the
  progress record's `reviews` map, keyed by checkpoint id, with the shape
  shown in the progress record spec." Figurative (a JSON structure).
- `docs/spec/S06-release-1.md:4` (picked at random) — "**Purpose:**
  Define the first release: one lesson per area, chosen so the shape of
  the site is visible end to end and every mechanism is exercised at
  least once." Figurative (the site's structure).
- `site/src/content/docs/coding-with-agents/first-session.mdx:88` — "The
  transcripts in this lesson are illustrative: they show the shape of a
  good exchange, not a recording of one model. Your agent phrases things"
  Figurative (the pattern of an exchange).
- `site/src/content/docs/using-agents/delegating.mdx:120` (picked at
  random) — "The response above is illustrative, written to show the
  shape of a good result rather than recorded from one model, and your
  result differs in" Figurative (the pattern of a result).

None of the 23 hits uses "shape" for a geometric outline; every one is
figurative, and one (`docs/prose/README.md:7`) is a verb caught by the
plural-noun token.

## Concentration

Top five files by hit count:

| file                                       | hits |
| ------------------------------------------ | ---: |
| `docs/spec/S02-topic-map.md`               |    4 |
| `docs/spec/000-specs.md`                   |    3 |
| `docs/plan/explore/06-lesson-inventory.md` |    2 |
| `docs/prose/README.md`                     |    2 |
| `docs/plan/README.md`                      |    1 |

Seventeen files carry hits; none has more than four. Eight of the 23
fall inside Markdown table cells (`docs/plan/README.md`,
`docs/plan/explore/06-lesson-inventory.md:39`, three of the four in
`docs/spec/S02-topic-map.md`, `docs/spec/000-specs.md:18`), one is a
heading (`docs/spec/000-specs.md:46`), one is a bold list-item label
(`docs/plan/explore/12-learn-prompting.md:155`), and four repeat one
quoted source skill name, "shaping the build". The remaining hits are in
running prose. The four lesson hits are three near-identical
"illustrative ... the shape of a good exchange/result" disclaimers
(`first-session.mdx`, `agent-risk.mdx`, `delegating.mdx`) plus the
landing page's release blurb, which repeats the S06 purpose sentence.
