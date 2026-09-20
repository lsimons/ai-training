# ai-tells.BareNames

## Rule

`.vale/styles/ai-tells/BareNames.yml` extends the `existence` rule with
`nonword: true`, `ignorecase: true`, and `level: error`, message "AI
designation verb: '%s'. Say that it specifies or references the thing, or
tell the reader to state it. Disable this rule for API reference prose."
It flags "names/named/naming" and the bare "name" where an inanimate
subject designates a thing ("the manifest names the tag", "it names a kind
of file") and the imperative ("Name the version in the changelog", "name
what you tried"). Seven tokens: a determiner-gated subject with optional
modifier and adverb; a pronoun or relative subject (`it`, `which`, `that`,
`each`, ...); a bare plural subject (`recipes name the`); a modal or
negated verb (`must name a`); a filename subject (`mise.toml names the`);
and two imperative tokens, at sentence start or after `, ; and then or`.
Every token requires a determiner, count, or `what/which` after the verb
and refuses `that` and `the same/way`, so the plural noun "names" stays
out. The imperative tokens exclude a code span, quoted name, or "after"
within three words, which is the literal act of giving a name. A 34-entry
`exceptions` list names people and bodies who literally name things
(teams, authors, users, callers) and the legal/journalistic register
(complaints, courts, polls). The comment reports about fifteen matches
across the Go and Python standard libraries, all the designation sense,
and says a project writing API reference prose "disables the rule per
file".

## Stats

Total hits: 13.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| spec       |    7 | 13147 |              0.53 |
| lessons    |    4 | 12134 |              0.33 |
| agent-docs |    1 |  3200 |              0.31 |
| plan       |    1 | 15852 |              0.06 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   13 | 66006 |              0.20 |

Top matched phrases:

| phrase                      | count |
| --------------------------- | ----: |
| `name what`                 |     4 |
| `each checkpoint names the` |     1 |
| `the answer names the`      |     1 |
| `the brief names the`       |     1 |
| `a card naming the`         |     1 |
| `a message naming the`      |     1 |
| `name each`                 |     1 |
| `it names the`              |     1 |
| `a good result names one`   |     1 |
| `name the`                  |     1 |

Distinct phrases: 10. Six hits are the imperative tokens (`name what` four
times, `name each`, `name the`), six the determiner-gated subject token,
one the pronoun token (`it names the`). The four `name what` hits are two
copies of one sentence: the S02 Purpose line, which fires twice ("Name
what the site teaches ... name what a learner should be able to do") and is
repeated verbatim in the `000-specs.md` index table.

## Examples

All 13 hits, in file order. Each notes what the flagged "name" refers to.

- `docs/agents/writing-a-lesson.md:46` — "Every served objective gets at
  least one checkpoint with / `objective="<that id>"`; each checkpoint
  names the one objective it / evidences." (a checkpoint component's
  `objective` attribute holds an objective id)
- `docs/plan/explore/08-diataxis.md:26` — "ask "action or cognition?" and
  "study / or work?" and the answer names the kind." (the two compass
  answers determine the Diátaxis page kind)
- `docs/spec/000-specs.md:14` — "| S02 | [Topic map and
  competencies](S02-topic-map.md) | Name what the site teaches (topics and
  concepts, with prerequisite links), name what a learner should be able
  to do afterwards (competencies, objectives, behaviors), and say how the
  map differentiates between learners. | Draft |" (two hits, `Name what`
  and `name what`: the spec's purpose is to enumerate topics and
  competencies)
- `docs/spec/S02-topic-map.md:3` — "**Purpose:** Name what the site
  teaches (topics and their concepts, per area, / with prerequisite
  links), name what a learner should be able to do afterwards" (same
  sentence as above, `Name what` on line 3)
- `docs/spec/S02-topic-map.md:4` — the continuation of the same sentence,
  `name what` on line 4 (the competencies list)
- `docs/spec/S02-topic-map.md:400` — "| 3 | The brief names the
  information the agent should use and where it is. | An agent that has to
  guess sources picks the most available one, not the right one. | ..."
  (a delegation brief states the sources for the agent)
- `docs/spec/S02-topic-map.md:469` — "| Failed or skipped checkpoint |
  Shows a card naming the assumed objective and the section to revisit. |"
  (a routing card displays an objective and a section link)
- `docs/spec/S04-progress-record.md:90` — "- A file with an older
  `version` is migrated when a migration exists and / otherwise refused
  with a message naming the versions." (an error message states the file
  and expected version numbers)
- `site/src/content/docs/building-agents/agent-loop.mdx:74` — "Rule:
  write the description for the caller; name each argument and its /
  type, and say what comes back." (a tool description should list its
  arguments; imperative to the learner)
- `site/src/content/docs/coding-with-agents/first-session.mdx:144` —
  "This brief sends the agent hunting. Rewrite it so it names the file, /
  the failing test, what the agent may and may not change, and how you"
  (the learner's brief should specify `todo.py` and the failing test)
- `site/src/content/docs/concepts/how-models-work.mdx:137` — "A good
  result names one failure mode per wrong answer and can say, in a /
  sentence, why prediction rather than lookup produces it." (the
  learner's exercise answer identifies a failure mode)
- `site/src/content/docs/safety/agent-risk.mdx:238` — "Whatever happened,
  the check is the same: did you / see the planted line as an instruction
  the agent might follow, and did you / name the path the data could take
  out?" (the learner's prediction states an exfiltration path; "name"
  follows "did you" at the start of a wrapped line, where the imperative
  token's sentence-start lookbehind matched)

None of the 13 is the literal act of assigning a name; every hit is the
designation sense (a document, message, card, or answer specifying or
listing something) or an instruction to the reader to state something.

## Concentration

Top files by hit count:

| file                               | hits |
| ---------------------------------- | ---: |
| `docs/spec/S02-topic-map.md`       |    4 |
| `docs/spec/000-specs.md`           |    2 |
| `docs/agents/writing-a-lesson.md`  |    1 |
| `docs/plan/explore/08-diataxis.md` |    1 |
| `docs/spec/S04-progress-record.md` |    1 |

Seven of thirteen hits are in `docs/spec/`, and four of those are one
sentence (the S02 Purpose) counted twice in two files. Five hits are in
table cells (`000-specs.md:14` twice, `S02-topic-map.md:400,469`), one in
a list item (`S04-progress-record.md:90`), the rest running prose. The
four lesson hits are all in exercise or rule text addressed to the
learner ("Rewrite it so it names", "A good result names", "did you name",
"name each argument"). `agent-risk.mdx:238` is not grammatically an
imperative: "name" follows "did you" at the start of a wrapped line, and
the sentence-start lookbehind matched at the line boundary.
