# ai-tells.FigurativeIdioms

## Rule

`.vale/styles/ai-tells/FigurativeIdioms.yml` extends the `existence` rule
with `nonword: true`, `ignorecase: true`, and `level: error`. It lists
about eighty regex tokens for fixed figurative phrases that stand in for a
plain statement of outcome, grouped by figure: unpriced cost ("costs
little", "comes at a cost", "measured cost", "tolerated cost"), proverb
cause ("for want of"), blank-start and evasion ("clean slate", "dodges
the", "sails through", "blast radius", "moves the goalposts"), reduction
("boils down to", "comes down to"), substitution ("stands in for"),
progress and repair ("closes the gap", "in lockstep", "brought into line
with"), retraction ("walk it back"), self-consumption ("dogfooding", "eats
its own cooking"), "sleeping dogs", scatter ("fans out"), a 2026-09 audit
group ("lines up with", "doubles as", "double duty", "the whole trick", "a
step further", "meets the bar", "on hand", "went away", "for good",
"judgment call", "takes a while", "picks up on", "stands up a"), and
burial ("buried in", "buries the"). Message: "AI idiom: '%s'. State the
literal outcome instead." The comment says every token measured at two or
fewer matches across the Go and Python standard libraries, and names two
places to disable: runtime and memory-management prose (for "out of
reach"), API prose built on placeholders (for "stands in for"), and prose
about graves or geology (for "buried").

## Stats

Total hits: 21.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| lessons    |   17 | 12134 |              1.40 |
| plan       |    2 | 15852 |              0.13 |
| agent-docs |    1 |  3200 |              0.31 |
| spec       |    1 | 13147 |              0.08 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   21 | 66006 |              0.32 |

Top matched phrases:

| phrase            | count |
| ----------------- | ----: |
| `blast radius`    |    17 |
| `doubles as`      |     2 |
| `bury the`        |     1 |
| `the whole trick` |     1 |

Distinct phrases: 4, out of roughly eighty tokens in the rule.

## Examples

Each bullet ends with whether the flagged phrase is used figuratively or
literally in that sentence.

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:133` — "The
  Complete screen doubles as the path map from one cross-module key."
  Figurative (serves a second purpose).
- `docs/plan/explore/10-execute-program.md:141` — "A generated reference
  from finished lessons doubles as the recap and as the review's crib."
  Figurative (serves a second purpose).
- `docs/prose/README.md:82` — "| Google | `Semicolons` | Now and then,
  lessons only | Density, not defects: every semicolon in a lesson, for
  the sweep that splits long sentences. Elsewhere it would bury the
  Passive output |" Figurative (drown out in volume).
- `docs/spec/S02-topic-map.md:201` — "| `safety/agent-risk` | Agent risk
  | blast radius, permissions and least privilege, human in the loop,
  prompt injection, exfiltration | concepts/what-is-an-agent, verification
  | `AEC-10`, the best knowledge-worker safety material available |"
  Figurative (a listed topic concept; no explosion).
- `site/src/content/docs/building-agents/agent-loop.mdx:3` —
  "description: Define one tool, run the loop that lets a model call it,
  and see why the loop is the whole trick." Figurative (the entire
  mechanism). Frontmatter description field.
- `site/src/content/docs/coding-with-agents/first-session.mdx:171` —
  "Ask about blast radius, as you did in *Why agent safety is different*:
  a one-line edit to a file you can `git checkout` is about as small as a
  blast radius gets." Figurative (reach of an action; this line and 173
  are the same sentence, counted twice).
- `site/src/content/docs/coding-with-agents/first-session.mdx:255`
  (picked at random) — "3. The permissions prompt is where your judgment
  enters; weigh the blast radius, and keep the prompt on." Figurative.
- `site/src/content/docs/safety/agent-risk.mdx:51` — "## Blast radius"
  Figurative. Heading.
- `site/src/content/docs/safety/agent-risk.mdx:53` — "The **blast
  radius** of an action is everything it can reach and change, including
  things you didn't intend." Figurative; this sentence defines the term
  for the lesson.
- `site/src/content/docs/safety/agent-risk.mdx:66` (picked at random) —
  "Its blast radius is every file the shell can touch, which on most
  machines means every file you own, and any command it can run, which
  means" Figurative.
- `site/src/content/docs/safety/agent-risk.mdx:76` — "The habit is to say
  the blast radius out loud before you start." Figurative.
- `site/src/content/docs/safety/agent-risk.mdx:90` (picked at random) —
  "The task is done just as well. The blast radius shrinks from "anyone"
  to "nobody until I click"." Figurative.
- `site/src/content/docs/safety/agent-risk.mdx:217` — "Blast radius,
  least privilege, and human in the loop aren't three separate lessons;
  they're one habit, and prompt injection is" Figurative.
- `site/src/content/docs/safety/agent-risk.mdx:261` — "1. **Blast
  radius.** With the access it has, what can it reach and change? Say it
  in the uncomfortable form." Figurative. Bold list-item label.
- `site/src/content/docs/safety/agent-risk.mdx:291` — "2. Blast radius is
  what an action *can* reach and change with the access it has, not what
  you asked for. Say it out loud in its uncomfortable form." Figurative;
  recap restating the definition.

All 21 hits are figurative; none describes an explosion, a physical
burial, or a person doubling as another.

## Concentration

Top five files by hit count:

| file                                                         | hits |
| ------------------------------------------------------------ | ---: |
| `site/src/content/docs/safety/agent-risk.mdx`                |   13 |
| `site/src/content/docs/coding-with-agents/first-session.mdx` |    3 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md`  |    1 |
| `docs/plan/explore/10-execute-program.md`                    |    1 |
| `docs/prose/README.md`                                       |    1 |

Six files carry hits. Seventeen of the 21 are the single phrase "blast
radius", and 16 of those 17 sit in two lessons: `agent-risk.mdx`, where
the phrase is a section heading, a bolded defined term, a recap bullet,
an exercise prompt, and running prose in between, and `first-session.mdx`,
which refers back to that lesson by name. The seventeenth is the
`docs/spec/S02-topic-map.md` table cell listing the concept for the
`safety/agent-risk` topic. The other four hits are one each in a plan
list item, a plan numbered list, a `docs/prose/README.md` table cell, and
an MDX frontmatter `description`. No hits fall inside code spans or
blocks.
