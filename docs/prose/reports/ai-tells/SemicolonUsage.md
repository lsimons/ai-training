# ai-tells.SemicolonUsage

## Rule

`.vale/styles/ai-tells/SemicolonUsage.yml` extends the `existence` rule
with `nonword: true`, `level: error`, and a single token,
`; [^,;\n]*[.!?]`: a semicolon followed by a run of text that holds no
comma and no second semicolon, up to the next period, question mark, or
exclamation mark. Sixteen case-insensitive `exceptions` drop the match
when the run contains a conjunctive adverb (`however`, `therefore`,
`thus`, `hence`, `moreover`, `furthermore`, `consequently`,
`nevertheless`, `nonetheless`, `otherwise`, `meanwhile`, `accordingly`,
`besides`, `indeed`, `namely`, `instead`). The message is "AI
punctuation: '%s'. Replace the semicolon with a period or two
sentences." The YAML comment gives the rationale: the semicolon is "an
em-dash workaround" that an agent reaches for once the em-dash is
flagged, "to tack a punchy clause onto a sentence"; per Google's
guidance the legitimate uses "nearly always carry a comma" (a series
with internal punctuation, a "; however," join, a complex clause), so
the token flags "only a comma-free clause-final continuation" and
"Google.Semicolons still warns on the rest." The comment names no
situation in which to disable the rule. The `Match` is the whole span
from the semicolon to the terminal punctuation, so it varies per hit.

## Stats

Total hits: 150.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |   71 | 15852 |              4.48 |
| lessons    |   26 | 12134 |              2.14 |
| spec       |   25 | 13147 |              1.90 |
| repo-docs  |   16 |  3139 |              5.10 |
| agent-docs |   12 |  3200 |              3.75 |
| data       |    0 | 18534 |              0.00 |
| **total**  |  150 | 66006 |              2.27 |

Top matched phrases:

| phrase                     | count |
| -------------------------- | ----: |
| `; run ************ once.` |     2 |
| every other matched span   |     1 |

Distinct phrases: 149 (of 150). The match runs from the semicolon to
the end of the sentence, so nearly every span is unique; the one repeat
is the same sentence in `CONTRIBUTING.md:21` and
`site/src/content/docs/contributing.md:13`. Vale replaces inline code
with asterisks before matching, which is why the `Match` reads
`************` where the source reads `` `mise install` ``. The span
after the semicolon is 2 to 19 words long, median 6. The first word
after the semicolon, lowercased, has 92 distinct values; the most
frequent:

| first word after `;` | count |
| -------------------- | ----: |
| the                  |    24 |
| it                   |     9 |
| no                   |     8 |
| a                    |     6 |
| they                 |     4 |
| never                |     3 |
| area                 |     3 |
| ours                 |     3 |

### Overlap with Google.Semicolons

The same JSON holds 530 `Google.Semicolons` alerts (one per `;`
character, a one-character span). 147 of the 150 ai-tells hits contain
a Google.Semicolons alert on the same file and line inside the ai-tells
span. The 3 ai-tells hits with no Google alert on that line are
`.claude/skills/tutor/SKILL.md:3` (YAML frontmatter `description`),
`docs/prose/README.md:37`, and
`site/src/content/docs/customizing-agents/instructions.mdx:253`; each
sits in a numbered-list item or frontmatter block. 383 Google.Semicolons
alerts (on 326 distinct lines) fall inside no ai-tells span; ai-tells
does not flag them.

## Examples

- `AGENTS.md:60` — "For a one-off check of the built site prefer `mise run site-preview` or `site-screenshot`; neither leaves a daemon
  behind."
- `CONTRIBUTING.md:21` — "Tools are pinned in `.mise.toml`; run `mise install` once. Then:"
- `.claude/skills/tutor/SKILL.md:3` (frontmatter; no Google.Semicolons
  alert on this line) — "description: Act as a tutor for the AI Training
  site running locally. Hints, not answers; scoped to one lesson or
  topic; asks a recall question first when reviews are due."
- `docs/agents/writing-a-lesson.md:87` — "The file holds the complete,
  runnable program; the page shows only the part the learner needs."
- `docs/prose/README.md:37` (no Google.Semicolons alert on this line) —
  "4. The maintainer decides. The decision lands in the table below and
  in the config files; hits for rules that gate get fixed first."
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:153` — "The
  project deliberately makes a capable model less useful so it is more
  educationally useful; they call these **pedagogical guardrails**."
- `docs/plan/explore/09-brilliant-skills-map.md:131` — "needs and the
  limits it must stay within, because an agent fills in what's unsaid;
  domain knowledge is what lets you judge and correct its output."
- `docs/spec/S01-dictionary.md:129` — "Paths are advisory; nothing is
  ever locked."
- `docs/spec/S03-lesson-authoring.md:147` — "- A widget teaches; it
  never grades."
- `site/src/content/docs/concepts/how-models-work.mdx:146` — "2. Output
  is one token at a time, sampled from a distribution the model scores;
  temperature reshapes the distribution and adds nothing."
- `site/src/content/docs/safety/agent-risk.mdx:290` — "1. An assistant's
  mistake is a wrong answer; an agent's mistake is a wrong action that a
  tool carries out without skepticism."
- `site/src/content/docs/customizing-agents/instructions.mdx:253` (no
  Google.Semicolons alert on this line) — "5. A rule you can't afford to
  have skipped belongs in a hook, not in prose; a procedure the agent
  should repeat belongs in a skill."
- `docs/plan/explore/11-roadmap-sh.md:118` (picked at random) — "Done
  strikes the node through on the map and fills it gray; Skip and
  Learning have their own styles."
- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:68` (picked
  at random) — "(books, courses with free/duration, references); a
  `learningPath` narrative; an `evaluation` field that maps onto
  assessment; three proficiency tiers."
- `docs/spec/S02-topic-map.md:48` (picked at random) — "Paths are lists
  of lesson ids; goals are competency levels."

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |   16 |
| `docs/plan/explore/06-lesson-inventory.md`                  |   11 |
| `AGENTS.md`                                                 |   10 |
| `docs/spec/S01-dictionary.md`                               |    9 |
| `docs/spec/S02-topic-map.md`                                |    9 |

By the line the hit sits on: 104 hits are in running prose paragraphs,
23 in Markdown table rows, 21 in list items (bulleted or numbered), 1 in
YAML frontmatter, and 1 in a bold-label line. No hits are in headings.
The table hits are mostly `docs/plan/explore/06-lesson-inventory.md`
and `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md`, where
a cell ends in a short semicolon-joined fragment ("; safety checklist.",
"; ELI5.", "; strict pass."). The lesson hits are all running prose or
`<Recap>` numbered items. 22 of the 150 matched spans contain the word
"and" or "or"; the rest are a single clause with no coordinator. The
three shortest spans are `; **..` (`docs/spec/S02-topic-map.md:113`,
where the source reads "; `M1`..`M5` are modules" and Vale's masking of
the code spans leaves `**..` before the second code span), and `; PR).`
and `; CLAUDE.` (both
`docs/plan/explore/01-prior-sbp-training-and-course-compare.md:88`, a
parenthetical semicolon-separated list where the source reads "commit;
CLAUDE.md; plan mode; reviewer subagent; PR)." and the `.` of
`CLAUDE.md` ends the span).
