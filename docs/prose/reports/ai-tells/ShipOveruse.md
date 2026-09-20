# ai-tells.ShipOveruse

## Rule

`.vale/styles/ai-tells/ShipOveruse.yml` extends the `existence` rule with
`nonword: true`, `ignorecase: true`, and `level: error`, message "AI
overused word: '%s'. State the specific action or object. Disable this rule
for maritime or logistics writing." A single token, `\bship(?:s|ped|ping)?\b`,
matches every inflection of the word. The comment calls "ship" an "AI and
startup overuse fingerprint" covering the release verb ("ship it", "ship
the feature") and maritime cliches ("run a tight ship"); the match is
"deliberately broad and carries no exemptions" because the logistics verb
and the vessel noun look identical to a regex, so a writer in those domains
"turns the whole rule off". Word boundaries keep `-ship` suffixes
(relationship, leadership) and compounds (spaceship, shipment) out. There
is no exceptions list.

## Stats

Total hits: 14.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    7 | 13147 |              0.53 |
| plan       |    3 | 15852 |              0.19 |
| lessons    |    3 | 12134 |              0.25 |
| agent-docs |    1 |  3200 |              0.31 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   14 | 66006 |              0.21 |

Top matched phrases:

| phrase     | count |
| ---------- | ----: |
| `shipping` |     5 |
| `ships`    |     4 |
| `shipped`  |     3 |
| `ship`     |     2 |

Distinct phrases: 4 (the four inflections).

## Examples

All 14 hits, in file order. Each notes the sense: "release" means
software release, as in the project's "Ship" development phase and spec
S06-release-1.

- `docs/plan/explore/02-agent-engineer-course.md:27` — "Part 2, Building
  and shipping (201):" (release; a heading-like line quoting the source
  course's part title)
- `docs/plan/explore/06-lesson-inventory.md:33` — "### Part 2: building
  and shipping" (release; H3 heading, same source course title)
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:222` — "02.
  Ship 4-6 exemplar dialogues in the skill body instead of more prose."
  (release/deliver: include in the skill that gets published)
- `docs/prose/report-template.md:21` — "1. **Rule.** One paragraph: what
  the rule's YAML does (read / `.vale/styles/write-good/<Rule>.yml`), its
  shipped level, and the size of / its word list or pattern." (release:
  the severity level the package is distributed with)
- `docs/spec/000-specs.md:7` — "teaches, how lessons are written, how
  learning is recorded and reviewed, and / what ships." (release: what
  the site publishes, pointing at S06)
- `docs/spec/000-specs.md:36` — "The dictionary defines words; rules about
  writing, storing, and shipping / belong in the later specs." (release)
- `docs/spec/000-specs.md:68` — "| `In progress - <what has shipped>` |
  Partial implementation; say what has shipped and what's deferred |"
  (release; spec Status table)
- `docs/spec/000-specs.md:70` — "| `Implemented (YYYY-MM-DD)` | Shipped;
  the date is the commit date of the last implementing commit |"
  (release; spec Status table)
- `docs/spec/S01-dictionary.md:21` — "Rules about how / pages are written,
  how data is stored and what ships when live in later / specs."
  (release)
- `docs/spec/S02-topic-map.md:285` — "| `coding-with-agents/ships-with-agent`
  | Ships a change with a coding agent through plan, implement, and
  verify | first-session, workflow, context |" (release; competency name
  and its verb-phrase definition)
- `docs/spec/S02-topic-map.md:449` — "| Ng, AI engineering skills map |
  Building and deploying AI applications | Build, evaluate, ship |
  `building-agents/*` |" (release; quoting an external skills map)
- `site/src/content/docs/coding-with-agents/first-session.mdx:29` — "The
  / repository is a fixture that ships with this course, so nothing you do
  here / can touch your own work." (bundled with: the fixture is included
  in the site, a distribution sense rather than the release verb)
- `site/src/content/docs/coding-with-agents/index.mdx:3` — "description:
  Shipping software changes with a coding agent." (release; frontmatter)
- `site/src/content/docs/coding-with-agents/index.mdx:8` — "Shipping
  software changes with a coding agent. It starts with your first session
  in a small repository, then moves through planning, implementing and
  verifying a change, and ends with working alongside a team." (release;
  course page lead)

No hit is the maritime noun or a maritime idiom. Thirteen are the
software-release sense; one (`first-session.mdx:29`, "ships with") is the
bundled-distribution sense. Four of the fourteen quote or restate an
external title ("Building and shipping", "Build, evaluate, ship").

## Concentration

Top files by hit count:

| file                                                 | hits |
| ---------------------------------------------------- | ---: |
| `docs/spec/000-specs.md`                             |    4 |
| `docs/spec/S02-topic-map.md`                         |    2 |
| `site/src/content/docs/coding-with-agents/index.mdx` |    2 |
| `docs/plan/explore/02-agent-engineer-course.md`      |    1 |
| `docs/plan/explore/06-lesson-inventory.md`           |    1 |

Half the hits are in `docs/spec/`, where "ship" is the index's word for
the release spec S06 and for the `Implemented`/`In progress` status
vocabulary. Four hits are in table cells (`000-specs.md:68,70`,
`S02-topic-map.md:285,449`), one in an H3 heading
(`06-lesson-inventory.md:33`), one in YAML frontmatter
(`index.mdx:3`), one in a numbered list, the rest in running prose. The
competency slug `ships-with-agent` at `S02-topic-map.md:285` is a code span
and is not itself matched; the hit there is the cell text "Ships a change".
