# ai-tells.VerbTricolon

## Rule

`.vale/styles/ai-tells/VerbTricolon.yml` extends the `existence` rule
with `nonword: true`, `level: error`, and 24 regex tokens. Each token
looks for three parallel items in a comma series, with the item gaps
`[^,.!?]+` so a series never spans a sentence boundary. The item shape
is inferred from surface form, not from a part-of-speech tag: a word
ending in `-ing`, a word ending in `-ed`, a word ending in `-s`, or any
word after a modal (`can`, `could`, `will`, ..., `must`), after a pronoun
subject (`they`, `we`, `you`), after `to`, or after a colon. Each shape
has a syndetic form (`, and` / `, or` before the third item) and an
asyndetic form (no conjunction), plus a subject-verb form ("the X verbs
A, the Y verbs B, ..."). An optional `\w+ly` adverb may precede each
item. The colon tokens carry a lookbehind that exempts a Conventional
Commits subject (`feat:`, `fix(scope):`, ...). The message is "AI
tricolon: '%s'. Exactly three parallel verbs in series. Restructure or
vary the count." The YAML comment gives the rationale: "LLMs produce
prose where nearly every enumeration is exactly three items and almost
never two or four," and the asyndetic form is "Even punchier ... AI
loves the drumroll without the cymbal crash." The comment names no
situation in which to disable the rule. The `Match` is the whole series,
so it varies per hit; 53 of the 95 matches span a line break.

## Stats

Total hits: 95.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| lessons    |   37 | 12134 |              3.05 |
| spec       |   30 | 13147 |              2.28 |
| plan       |   27 | 15852 |              1.70 |
| agent-docs |    1 |  3200 |              0.31 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   95 | 66006 |              1.44 |

Top matched phrases:

| phrase                                  | count |
| --------------------------------------- | ----: |
| `: in a terminal, an editor, or a chat` |     2 |
| every other matched span                |     1 |

Distinct phrases: 94 (of 95). The one repeat is the same sentence in
`docs/spec/S01-dictionary.md:99` and
`docs/spec/S03-lesson-authoring.md:138`. Because the phrases don't
repeat, the shape of the match is the usable aggregate: 58 of the 95
matches begin with a colon and a space (one of the four after-colon tokens fired), 44
contain `and` or `or` (syndetic), 51 have no conjunction (asyndetic).

## Examples

Each example ends with a note on what the three matched items are.

- `site/src/content/docs/coding-with-agents/first-session.mdx:32`
  (picked at random) — "A coding agent is an agent that works in your
  terminal or editor with the / tools a programmer has: it reads files,
  edits them, and runs commands." Items: `reads`, `edits`, `runs`; three
  third-person verbs.
- `docs/spec/S01-dictionary.md:76` — "**Covers** one topic and teaches
  one to five of its concepts. **Serves** / the learning objectives it
  teaches toward, **assumes** the objectives it / relies on, and
  **extends to** where a confident learner goes next." Items: `Serves`,
  `assumes`, `extends`; three verbs.
- `site/src/content/docs/customizing-agents/instructions.mdx:176`
  (picked at random) — "The agent keeps running / `python -m pytest`
  (wrong), committing to `main`, and wrapping mail calls in / retry
  loops." Items: `running`, `committing`, `wrapping`; three gerunds.
- `docs/spec/S02-topic-map.md:235` (table cell) — "| `using-agents/ delegating` | Delegating to an agent | task brief, giving context,
  choosing a degree of autonomy, checking results | ..." Items:
  `giving`, `choosing`, `checking`; three gerunds heading noun phrases
  in a keyword list of four (the regex skipped "task brief").
- `docs/spec/S02-topic-map.md:173` (table cell) — "| `concepts/ recognizes-agents` | Recognizes an agent, its tools, and its degree of
  autonomy | ..." Items as the `-s` token read them: `Recognizes`,
  `its`, `its`; one verb and two possessive pronouns.
- `docs/spec/S02-topic-map.md:122` (table cell) — "| `AEC-01` | What are
  AI agents: model versus agent, autonomy levels, when a prompt suffices
  |" Colon token; items are two noun phrases and a `when` clause, not
  verbs.
- `docs/plan/explore/02-agent-engineer-course.md:85` — "Git history: 29
  commits by Addy Osmani (through 2026-07-16), 1 by Ivar Soares /
  Urdalen, 32 by Leo Simons (from 2026-07-19 onwards), 18 by
  dependabot." Colon token; items are counts (`29 commits`, `1`, `32`)
  in a four-item list, not verbs.
- `docs/plan/README.md:82` (table cell) — "| Area naming | Two sidebar
  groups: **Foundations** (Concepts, Safety, Using agents) and
  **Engineering** (Coding with agents, Customizing agents, Building
  agents). |" Gerund token; items are `Using`, `Customizing`,
  `Building`, the heads of three area names (`Coding with agents` was
  swallowed into the first item's gap).
- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:14` —
  "**Tracks** (README.md, P01 "Goal"): three audience-specific tracks,
  modules of / 30-90 minutes, standalone and combinable into
  workshops:" Colon token; items are noun phrases (`three ... tracks`,
  `modules`, `standalone and combinable`), not verbs.
- `docs/prose/report-template.md:5` (the one agent-docs hit) —
  "Gathering only: no verdicts, no classification, no rewrites." Colon
  token; items are three `no` + noun phrases, not verbs.
- `docs/spec/S03-lesson-authoring.md:138` (the repeated phrase) — "- Done
  outside the page: in a terminal, an editor, or a chat." Colon token;
  items are three nouns (`a terminal`, `an editor`, `a chat`), not
  verbs.
- `docs/spec/S05-spaced-review.md:4` (picked at random) — "**Purpose:**
  Define how the site brings a learner back to what they learned, /
  without a backend: which items are reviewed, on what schedule, where
  reviews / surface, and what's stored." Colon token; items are a
  `which` clause, a prepositional phrase, and a `where` clause, the
  first three of four.
- `site/src/content/docs/using-agents/delegating.mdx:66` — "A brief has
  four parts: the goal, the context the work needs, the limits it / must
  stay within, and how you know it is done." Colon token; items are
  noun phrases, the first three of a four-part list the sentence itself
  counts as four.
- `site/src/content/docs/safety/agent-risk.mdx:43` — "An / agent's
  output goes to a tool: a mail server, a file system, a shell, a /
  payment system, a calendar." Asyndetic colon token; items are the
  first three nouns of a five-item list.
- `site/src/content/docs/concepts/how-models-work.mdx:60` — "You ask a
  model to solve a puzzle, it gets it wrong, and you ask "why did / you
  say that?"." Pronoun-subject token; items are three clauses with
  different subjects (`You ask`, `it gets`, `you ask`), each holding a
  verb.
- `docs/spec/S02-topic-map.md:426` — "**Andrew Ng's AI engineering
  skills map** names four skills: building and / deploying AI
  applications, software engineering fundamentals, using coding /
  agents, and shaping the build (deciding what goes in the spec)." Colon
  token; the match stops at "using coding agents"; items are a gerund
  phrase, a noun phrase, and a gerund phrase, the first three of the
  four the sentence counts.

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/spec/S02-topic-map.md`                                |   16 |
| `site/src/content/docs/safety/agent-risk.mdx`               |   11 |
| `site/src/content/docs/customizing-agents/instructions.mdx` |    9 |
| `docs/plan/explore/11-roadmap-sh.md`                        |    6 |
| `docs/spec/S01-dictionary.md`                               |    6 |

`site/src/content/docs/coding-with-agents/first-session.mdx` and
`site/src/content/docs/using-agents/delegating.mdx` have 6 each. By the
line the hit sits on: 61 hits are in running prose, 23 in Markdown
table rows, 8 in list items, 2 on a `**Purpose:**` bold-label line, and
1 in YAML frontmatter (`agent-risk.mdx:3`, the `description`). The
`docs/spec/S02-topic-map.md` hits are mostly table cells that hold a
comma-separated keyword list after a title and colon (the `AEC-NN` and
`DLAI-NN` source rows, lines 115 to 151) or a comma-separated concept
list in the topics table (lines 173 to 276). The lesson hits are
running prose, the `description` frontmatter, `<Recap>` items, and
`<Exercise>` bodies. Of the 16 examples above, 5 match three verbs or
gerunds in the same grammatical role (`first-session.mdx:32`,
`S01-dictionary.md:76`, `instructions.mdx:176`, `S02-topic-map.md:235`,
`README.md:82`), 1 matches three clauses with a verb each
(`how-models-work.mdx:60`), 1 matches one verb plus two `its`
(`S02-topic-map.md:173`), and 9 match noun phrases, clauses, or counts
after a colon; in 5 of those the sentence lists four or five items and
the match is the first three.
