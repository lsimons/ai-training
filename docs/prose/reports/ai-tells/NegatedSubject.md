# ai-tells.NegatedSubject

## Rule

`.vale/styles/ai-tells/NegatedSubject.yml` extends the `existence` rule
with `nonword: true`, `level: error`, and no `ignorecase`. Its `tokens`
list holds 15 regular expressions, all anchored on a capitalized
sentence-initial negator or on a conjunction: the copula form "No
<subject> is/are/was/gets/will be/has been <participle>" with a curated
list of about 70 predicates (`required`, `needed`, `made`, `collected`,
`stored`, `lost`, `written`, ...); the same with `Zero`, `Not a single`,
and `Not one`; the mid-sentence form after `and|but|because|since|while|although|though|whereas`; an adjective-predicate form ("No field is
optional") with a curated adjective list; an intransitive-verb form ("No
schema migration comes with it") with a curated verb list; the
elliptical badge form "No signup required"; the pronoun subjects
`Nothing`, `None of`, and `Neither` followed by an inflected verb; and a
relative-clause form ("a file that no manifest names"). The comment calls
it "the passive sibling of NegatedObject: the object of the negated claim
promoted to subject", "the reassurance register of a marketing page or a
compliance notice", and explains that case matters because the lowercase
form is "the docs conditional ('if no timeout is specified')". It lists
the predicates deliberately left out (`returned`, `raised`, `allowed`,
`given`, `specified`, `set`, `found`, ...) because they anchor standard
docs formulas, and notes that the human caveat register ("No other
validation is performed") "is the same construction and flags on
purpose". Message: "AI negated subject: '%s'. Name who does what: 'you
don't need to configure anything' instead of announcing an absence." The
YAML names no domain in which to disable the rule.

## Stats

Total hits: 10.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| lessons    |    4 | 12134 |              0.33 |
| plan       |    4 | 15852 |              0.25 |
| spec       |    2 | 13147 |              0.15 |
| agent-docs |    0 |  3200 |              0.00 |
| repo-docs  |    0 |  3139 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   10 | 66006 |              0.15 |

Top matched phrases:

| phrase                                  | count |
| --------------------------------------- | ----: |
| `no training content was ever written`  |     1 |
| `no duration metadata exists`           |     1 |
| `no answer required`                    |     1 |
| `no roadmap text may be reused`         |     1 |
| `no how-to or reference section exists` |     1 |
| `nothing leaves the browser unless`     |     1 |
| `nothing is stored as facts`            |     1 |
| `nothing in this lesson runs`           |     1 |
| `nothing else happened`                 |     1 |
| `nothing here needs`                    |     1 |

Distinct phrases: 10. By token: five are the capital-`No` forms (one
copula "was ever written", two intransitive "exists", one modal "may be
reused", one elliptical "No answer required"); five are the `Nothing`
pronoun form (one copula "is stored", four with an inflected verb:
"leaves", "runs", "happened", "needs"). No `Zero`, `None of`, `Neither`,
conjunction-led, or relative-clause hits.

## Examples

All ten hits, in file order.

- `docs/plan/explore/01-prior-sbp-training-and-course-compare.md:10` —
  "**Status: scaffolding only. No training content was ever written.**
  The repo is / docs infrastructure (specs, plans, scripts) plus a
  placeholder Python package."
- `docs/plan/explore/06-lesson-inventory.md:14` — "No duration metadata
  exists. Estimates below are prose word counts at about / 180 wpm.
  Total prose is about 82k words, roughly 7.5 h of reading; with the"
- `docs/plan/explore/10-execute-program.md:34` — "Code\*\* button. The
  learner presses it, the code actually runs in the / browser, and the
  result appears. No answer required. Used when the point / is to show,
  not to test."
- `docs/plan/explore/11-roadmap-sh.md:15` — ""community created" but the
  terms aren't. This note records structure, / mechanics, and topic
  titles as facts. No roadmap text may be reused."
- `docs/spec/S03-lesson-authoring.md:33` — "- How-to and reference pages
  serve learners at work and stay outside / courses and paths. No how-to
  or reference section exists in the sidebar / until there is a page to
  put in it."
- `docs/spec/S04-progress-record.md:19` — "storage. There is no server,
  no account, and no telemetry. / - **Nothing leaves the browser** unless
  the learner exports the file."
- `site/src/content/docs/concepts/how-models-work.mdx:73` — "amounts of
  text and is nudged, each time, so that the token that really / came
  next scores higher. Nothing is stored as facts or rules. What emerges /
  is a compressed statistical model of the text it saw: grammar, style,"
- `site/src/content/docs/customizing-agents/instructions.mdx:29` —
  "Nothing in this lesson runs. The examples are file contents, and the /
  fixture is a small fictional project called `invoice-mailer`: a Python"
- `site/src/content/docs/safety/agent-risk.mdx:25` — "A chat assistant
  that gets something wrong hands you a wrong paragraph. You / read it,
  you frown, you delete it. Nothing else happened. An agent that gets /
  the same thing wrong may already have sent the email, deleted the
  folder or"
- `site/src/content/docs/safety/agent-risk.mdx:33` — "Nothing here needs
  code. The examples are an agent with access to your / mailbox, an agent
  that can run commands on a computer, and an agent that"

## Concentration

Top files by hit count:

| file                                                            | hits |
| --------------------------------------------------------------- | ---: |
| `site/src/content/docs/safety/agent-risk.mdx`                   |    2 |
| `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` |    1 |
| `docs/plan/explore/06-lesson-inventory.md`                      |    1 |
| `docs/plan/explore/10-execute-program.md`                       |    1 |
| `docs/plan/explore/11-roadmap-sh.md`                            |    1 |

No file carries more than two hits. All ten are in running prose or
list items; none in headings, table cells, or code-adjacent text. Two
are bolded status or principle statements (`01-prior-sbp:10`,
`S04-progress-record.md:19`). Two of the four `lessons` hits are
lesson-opening scope statements telling the learner what the page does
not require ("Nothing in this lesson runs.", "Nothing here needs code.");
the other two are inside the teaching narrative (`how-models-work.mdx:73`,
`agent-risk.mdx:25`). Three of the four `plan` hits are the notes'
licensing or status caveats about source material ("No training content
was ever written", "No roadmap text may be reused", "No duration metadata
exists").
