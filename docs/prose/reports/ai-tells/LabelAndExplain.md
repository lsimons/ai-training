# ai-tells.LabelAndExplain

## Rule

`.vale/styles/ai-tells/LabelAndExplain.yml` extends the `existence` rule
with `nonword: true`, `scope: ~heading` (everything except headings), and
`level: error`, message "AI label-and-explain: '%s'. Fold the noun-phrase
label into the sentence it introduces." It has 22 tokens: one structural
pattern and 21 curated labels. The structural token matches a
determiner-led noun phrase (`The`, `A`, `An`, `One`, `Our`, `Their`, `Its`
plus up to four lowercase words) followed by a colon and, in a lookahead, a
lowercase clause of 20+ characters with no period or colon until sentence
punctuation; a lookbehind refuses labels ending in a copula ("are
available:"). Only the label and colon are reported. The 21 curated labels
("The price:", "The catch:", "The kicker:", "The upshot:", "The
tradeoff:", "The trick:", "The cost:", "The downside:", "The flip side:",
"The bottom line:", "The takeaway:", "The result:", "The answer:", "The
reason:", "The lesson:", "The moral:", "The point:", "The pitch:", "The
fix:", "The payoff:", "The trade-off:") fire whatever follows the colon.
The comment says a capitalized noun-phrase label ("The Redis cache: it
evicts ...") is out of scope, and "Label: Capital" is left to ColonUsage.
It gives no domain in which to disable the rule.

## Stats

Total hits: 15.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| lessons    |    7 | 12134 |              0.58 |
| plan       |    4 | 15852 |              0.25 |
| agent-docs |    2 |  3200 |              0.62 |
| repo-docs  |    1 |  3139 |              0.32 |
| spec       |    1 | 13147 |              0.08 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   15 | 66006 |              0.23 |

Top matched phrases:

| phrase                          | count |
| ------------------------------- | ----: |
| `the rule:`                     |     3 |
| `a good result:`                |     2 |
| `the full gate:`                |     1 |
| `the governing practices:`      |     1 |
| `a small table per competency:` |     1 |
| `their marketing table:`        |     1 |
| `a project page has:`           |     1 |
| `one paragraph:`                |     1 |
| `a table per area:`             |     1 |
| `the body:`                     |     1 |
| `a dot per lesson:`             |     1 |
| `a brief has four parts:`       |     1 |

Distinct phrases: 12. None of the 15 hits is from the curated-label list;
all come from the structural token.

## Examples

All 15 hits, in file order.

- `CONTRIBUTING.md:31` — "- `mise run ci` - The full gate: install, lint,
  check, build. Must pass / before you push."
- `docs/plan/explore/09-brilliant-skills-map.md:42` — "Tier **The
  governing practices**: development should be informed by judgment /
  about what's worth building and guided by building in shippable
  increments."
- `docs/plan/explore/09-brilliant-skills-map.md:205` — "4. **Add an
  alignment layer.** A small table per competency: external / framework,
  code, what it asks, our targeted objectives."
- `docs/plan/explore/10-execute-program.md:100` — "Their marketing table:
  interact 6 hours total as 30 / minutes a day for 12 days, then
  occasional reviews taking under 10% of total"
- `docs/plan/explore/11-roadmap-sh.md:190` — "A project page has: tags
  (technologies, topic, / level), description, **Project Requirements**
  as a numbered list with code"
- `docs/prose/report-template.md:20` — "1. **Rule.** One paragraph: what
  the rule's YAML does (read / `.vale/styles/write-good/<Rule>.yml`), its
  shipped level, and the size of / its word list or pattern."
- `docs/prose/report-template.md:23` — "2. **Stats.** Total hits. A table
  per area: hits, words, hits per thousand / words."
- `docs/spec/000-specs.md:53` — "5. The body: headers and subheaders;
  tables and lists are preferred over / long paragraphs."
- `site/src/content/docs/coding-with-agents/first-session.mdx:211` — "The
  tests did pass. The rule: the agent's summary / is a claim, the diff is
  the evidence, and a passing test is only proof if"
- `site/src/content/docs/coding-with-agents/first-session.mdx:247` — "A
  good result: the diff touches one line in `todo.py`, `test_todo.py` and
  / `todos.json` are unchanged, and the last line of the test run is
  `OK`."
- `site/src/content/docs/customizing-agents/instructions.mdx:236` — "A
  good result: the second run makes none of the wrong guesses from the /
  first, and every line in your file traces back to one of them."
- `site/src/content/docs/progress.mdx:13` — "A dot per lesson: gray
  untouched, amber read, green finished, dark gray / skipped."
- `site/src/content/docs/safety/agent-risk.mdx:115` — "The mistake was
  ordinary; the access made it expensive. The rule: grant / for the task
  in front of you, and take access away when the task is done."
- `site/src/content/docs/using-agents/delegating.mdx:66` — "A brief has
  four parts: the goal, the context the work needs, the limits it / must
  stay within, and how you know it is done."
- `site/src/content/docs/using-agents/delegating.mdx:139` — "The rule:
  write the done-criteria before you send the task, and make / them
  things you can tick, not adjectives."

## Concentration

Top files by hit count:

| file                                                         | hits |
| ------------------------------------------------------------ | ---: |
| `docs/plan/explore/09-brilliant-skills-map.md`               |    2 |
| `docs/prose/report-template.md`                              |    2 |
| `site/src/content/docs/coding-with-agents/first-session.mdx` |    2 |
| `site/src/content/docs/using-agents/delegating.mdx`          |    2 |
| `CONTRIBUTING.md`                                            |    1 |

Hits spread across 11 files, none with more than two. Five are in list
items (`CONTRIBUTING.md`, `09-brilliant-skills-map.md:205`,
`report-template.md` twice, `000-specs.md`), where the label leads a
bullet or a numbered step. The seven lesson hits are all running prose;
two shapes recur: "The rule:" closing a Pitfall section (three times, in
`first-session.mdx`, `agent-risk.mdx`, `delegating.mdx`) and "A good
result:" opening the self-check of an Exercise section (twice). Three
matches include a verb in the label ("A project page has:", "A brief has
four parts:"), which the copula lookbehind does not cover because the verb
is "has". `09-brilliant-skills-map.md:42` matches across a bold span
("**The governing practices**:"). No hits in tables or headings.
