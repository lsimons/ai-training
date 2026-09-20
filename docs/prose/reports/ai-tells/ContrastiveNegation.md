# ai-tells.ContrastiveNegation

## Rule

`.vale/styles/ai-tells/ContrastiveNegation.yml` extends the `existence`
rule with `nonword: true`, `ignorecase: true`, `level: error`, and two
`exceptions` ("no longer", "no sooner", which the comment calls temporal
adverbs of a different construction). Two regex tokens: a stacked
anaphora `no X, no Y[, no Z]` (`\bno [^,.;:!?]{2,}, no [^.!?]+`, which
runs to the end of the sentence) and a single clause-final fragment
`, no <noun phrase>.` (`, no [a-z][^.!?,;:]*[.!?]`). Message: "AI contrast
by negation: '%s'. State the positive directly without the trailing
negation." The stated rationale: a telegraphic negation cadence, often
the workaround once the "not X; it's Y" formula is flagged, pairing a
positive spec with a negated one; the stacked form also catches the
marketing cadence and its idioms ("no pain, no gain"). The comment says
the single-fragment token "is aggressive by design and will also catch a
literal 'coffee, no sugar'", and says to disable the rule for terse spec
lists where that is intended.

## Stats

Total hits: 17.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| plan       |    8 | 15852 |              0.50 |
| spec       |    4 | 13147 |              0.30 |
| agent-docs |    4 |  3200 |              1.25 |
| lessons    |    1 | 12134 |              0.08 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   17 | 66006 |              0.26 |

Top matched phrases:

| phrase                                           | count |
| ------------------------------------------------ | ----: |
| `, no h1).`                                      |     1 |
| `, no progress state in the site.`               |     1 |
| `, no full solutions.`                           |     1 |
| `, no embedding infrastructure needed.`          |     1 |
| `, no lesson text reused.`                       |     1 |
| `, no exercises beyond "try this in chatgpt".`   |     1 |
| `, no verdicts.`                                 |     1 |
| `, no links.`                                    |     1 |
| `, no alternatives.`                             |     1 |
| `, no choices.`                                  |     1 |
| `no multiple choice, no true/false anywhere`     |     1 |
| `no verdicts, no classification, no rewrites`    |     1 |
| `no server, no account, and no telemetry`        |     1 |
| `no server, no notifications, no email`          |     1 |
| `no mail, no network posts, no shell`            |     1 |
| `no learner state, no sequencing beyond ...`     |     1 |
| `no ********* or ****** (they rot), no * in ...` |     1 |

Distinct phrases: 17, every match unique, so there is no top-five to
cover. By token: 10 hits from the single clause-final fragment (the ", no
X." form) and 7 from the stacked anaphora (the "no X, no Y" form). Two
`Match` values are long: the `05-career-model` one spans three source
lines, and the `docs/prose/README.md:79` one has its code spans masked
to asterisks by Vale.

## Examples

Fifteen of the 17 hits follow; the two omitted are
`docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:224` (", no
embedding infrastructure needed.") and
`docs/plan/explore/12-learn-prompting.md:77` (", no exercises beyond "try
this in ChatGPT".").

- `docs/plan/explore/02-agent-engineer-course.md:12` — "All content:
  `site/src/content/docs/NN-slug.md` (frontmatter `title` plus
  `sidebar.order`, no H1). Landing: `index.mdx`." Single fragment,
  inside a parenthesis.
- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:69` — "Gaps:
  no explicit goals or outcomes, no learner state, no sequencing beyond
  prerequisites, no stable IDs (display-name paths are brittle), levels
  are prose not structured criteria, and most detail files are unwritten"
  Stacked; the match runs to the end of the sentence across three lines.
- `docs/plan/explore/06-lesson-inventory.md:61` (picked at random) — "No
  quizzes, no checkpoints, no progress state in the site." Single
  fragment token fired on the last item; the stacked token did not match
  because the sentence begins at "No" after a period on the previous
  line and the `{2,}` run stops at the first comma.
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:160` — "Four
  moves: persona, topic restriction, off-topic refusal, no full
  solutions. Re-injected on every turn." Single fragment, last item of a
  colon list.
- `docs/plan/explore/10-execute-program.md:6` — "Proprietary; structure
  and mechanics only, no lesson text reused." Single fragment.
- `docs/plan/explore/10-execute-program.md:20` (picked at random) — "No
  multiple choice, no true/false anywhere." Stacked.
- `docs/prose/README.md:32` (picked at random) — "Gathering only, no
  verdicts." Single fragment.
- `docs/prose/README.md:79` — "| Google | `Latin`, `Timeless`,
  `Exclamation`, `OptionalPlurals` | Every run | Small and fair: `for example` over `e.g.`, no `currently` or `latest` (they rot), no `!` in
  teaching text, no `(s)` |" Stacked, in a table cell; the code spans are
  masked in the `Match`.
- `docs/prose/report-template.md:5` — "Gathering only: no verdicts, no
  classification, no rewrites. The reader decides." Stacked.
- `docs/prose/report-template.md:36` — "Keep the whole report under 250
  lines. Root-relative paths, no links." Single fragment.
- `docs/spec/S01-dictionary.md:39` — "| `tutorial` | action, study | yes
  (lesson) | yes | The learner does something and sees results early and
  often. One path, no alternatives. Minimal explanation, link out instead.
  |" Single fragment, in a table cell.
- `docs/spec/S03-lesson-authoring.md:74` (picked at random) — "- **One
  path, no choices.** Differentiation happens through routing between
  lessons, never through branches inside one." Single fragment, inside a
  bold list-item label.
- `docs/spec/S04-progress-record.md:18` — "- **Browser only.** The record
  is one JSON document in browser local storage. There is no server, no
  account, and no telemetry." Stacked.
- `docs/spec/S05-spaced-review.md:108` (picked at random) — "- No server,
  no notifications, no email. A learner who doesn't come back is not
  reminded." Stacked.
- `site/src/content/docs/safety/agent-risk.mdx:227` — "Set up an agent
  that can (a) fetch a web page and (b) write a file, and nothing else:
  no mail, no network posts, no shell." Stacked; the only lesson hit, in
  an exercise setup instruction.

## Concentration

Top five files by hit count:

| file                                                        | hits |
| ----------------------------------------------------------- | ---: |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` |    2 |
| `docs/plan/explore/10-execute-program.md`                   |    2 |
| `docs/prose/README.md`                                      |    2 |
| `docs/prose/report-template.md`                             |    2 |
| `docs/plan/explore/02-agent-engineer-course.md`             |    1 |

Thirteen files carry hits; none has more than two. Two hits are in
Markdown table cells (`docs/prose/README.md:79`,
`docs/spec/S01-dictionary.md:39`), one in a bold list-item label
(`S03-lesson-authoring.md:74`), one inside a parenthesis, and the rest in
running prose or list items, mostly in terse note-taking sentences of the
plan explorations and the prose-lint docs. Three of the seven stacked
hits list what the site doesn't have (server, account, telemetry,
notifications, email) in the S04 and S05 specs and the lesson exercise;
the "Gathering only, no verdicts" instruction appears in both
`docs/prose/README.md` and `docs/prose/report-template.md`. No hits
inside code blocks.
