# Google.Contractions

## Rule

`.vale/styles/Google/Contractions.yml` extends the `substitution` rule. For
each of the 20 key/value pairs in its `swap` map it flags the long form
(key, e.g. `do not`) and suggests the contracted form (value, e.g. `don't`)
via `message: "Use '%s' instead of '%s'."` and `action: { name: replace }`.
`ignorecase: true`, so `Do not` and `do not` both match. The shipped level is
`suggestion`. The `swap` map has 22 entries: `are not`, `cannot`,
`could not`, `did not`, `do not`, `does not`, `has not`, `have not`,
`how is`, `is not`, `it is`, `should not`, `that is`, `they are`,
`was not`, `we are`, `we have`, `were not`, `what is`, `when is`,
`where is`, `will not`. Of those, `how is`, `it is`, `should not`,
`when is`, and `were not` produced no matches in this repository.

## Stats

Total hits: **191**.

| area       | hits | words  | hits / 1,000 words |
| ---------- | ---- | ------ | ------------------ |
| lessons    | 83   | 12,227 | 6.79               |
| plan       | 46   | 15,884 | 2.90               |
| spec       | 41   | 13,184 | 3.11               |
| repo-docs  | 13   | 3,489  | 3.73               |
| agent-docs | 8    | 2,707  | 2.96               |
| data       | 0    | 18,534 | 0.00               |

Top matched phrases (lowercased), 17 distinct phrases in total:

| phrase    | count |
| --------- | ----- |
| what is   | 34    |
| do not    | 32    |
| cannot    | 26    |
| that is   | 22    |
| is not    | 20    |
| does not  | 19    |
| did not   | 11    |
| are not   | 8     |
| they are  | 6     |
| we are    | 4     |
| could not | 2     |
| we have   | 2     |
| have not  | 1     |
| will not  | 1     |
| where is  | 1     |
| was not   | 1     |
| has not   | 1     |

## Examples

- `site/src/content/docs/customizing-agents/instructions.mdx:91` (top
  phrase `what is`) — "Build one now. Tick what is true for a project you
  know, fill in the / short fields, and read the result as if you were the
  agent seeing it for"
- `site/src/content/docs/safety/agent-risk.mdx:98` (top phrase `cannot`) —
  "For the web-reading agent: give it *only* reading. If it cannot send
  mail / or run commands, a hostile web page can confuse it but cannot
  make it do"
- `docs/plan/explore/02-agent-engineer-course.md:106` (top phrase
  `do not`) — "(content), Ivar Soares Urdalen (Starlight setup) and Leo
  Simons (Claude-stack / edition) with links, and do not imply
  endorsement."
- `docs/spec/S02-topic-map.md:220` (top phrase `that is`) — table row:
  "| `verifies-output` | `checks-claims` | base | Checks
  claims and sources on anything that leaves their desk |" /
  "| `verifies-output` | `spots-sycophancy` | base | Spots
  agreement that is not evidence |" /
  "| `verifies-output` | `calibrates-trust` | base | Matches
  the depth of checking to the cost of being wrong |"
- `AGENTS.md:221` (top phrase `is not`) — "Work is not complete until
  every change is committed, pushed, and CI passes."
- `docs/agents/writing-a-lesson.md:39` (`do not`) — "\`assumes\` may be
  empty for a first lesson. \`extends-to\` hrefs may point at / pages
  that do not exist yet; they render as plain text until they do."
- `site/src/content/docs/coding-with-agents/first-session.mdx:71`
  (`is not`) — "Your first message is not a task. It is a question, and
  its purpose is to / check that the agent is looking at the same code
  you are."
- `docs/plan/explore/09-brilliant-skills-map.md:43` (`what is`) — "Tier
  **The governing practices**: development should be informed by
  judgment / about what is worth building and guided by building in
  shippable increments."
- `docs/spec/S01-dictionary.md:26` (`do not`) — "1. **One word per
  idea.** Synonyms listed under "do not use" are banned in / content,
  code, frontmatter and the sidebar."
- `site/src/content/docs/building-agents/agent-loop.mdx:73` (`does not`,
  picked at random from the non-top-five phrases) — "A first draft often
  reads "Calls the OpenWeather API with an HTTP GET". / The model does
  not care how; it needs to know *when* and *with what*. / Rule: write
  the description for the caller, name each argument and its"
- `docs/plan/explore/11-roadmap-sh.md:185` (`did not`, random) — "read)
  with projects and "an AI tutor on the side". Personalize on the /
  roadmap page did not open in the driven browser and was not examined."
- `site/src/content/docs/concepts/index.mdx:8` (`they are`, random) —
  "How language models work, what they are good at, and where they
  break."
- `docs/agents/issue-tracker.md:26` (`will not`, random) — "| ready-for-human
  | Requires human implementation | #e6e6fa | /
  | wontfix | This will not be worked on |
  #ffffff |"

Random picks (chosen from phrases outside the top five): `does not`,
`did not`, `they are`, `will not`.

## Concentration

Top five files by hit count:

| file                                                       | hits | area    |
| ---------------------------------------------------------- | ---- | ------- |
| site/src/content/docs/customizing-agents/instructions.mdx  | 25   | lessons |
| docs/spec/S02-topic-map.md                                 | 21   | spec    |
| site/src/content/docs/safety/agent-risk.mdx                | 19   | lessons |
| site/src/content/docs/using-agents/delegating.mdx          | 18   | lessons |
| site/src/content/docs/coding-with-agents/first-session.mdx | 12   | lessons |

`docs/spec/S02-topic-map.md` hits cluster heavily inside Markdown table
cells (competency and lesson-map descriptions), e.g. lines 181, 220, 273,
276, 302, 317, 337, 357, 380, 398, 417, 420, 434, 472 are all `|`-delimited
rows.

`site/src/content/docs/customizing-agents/instructions.mdx` hits are mostly
in running prose; two of its 25 sit in headings (`## What does not belong`
at line 101, `## When instructions are not enough` at line 208).

`site/src/content/docs/safety/agent-risk.mdx`,
`site/src/content/docs/using-agents/delegating.mdx` and
`site/src/content/docs/coding-with-agents/first-session.mdx` show no
heading or table hits in the sampled lines; their hits sit in running
prose.
