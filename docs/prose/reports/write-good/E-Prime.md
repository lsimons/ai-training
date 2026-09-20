# write-good.E-Prime

## Rule

`.vale/styles/write-good/E-Prime.yml` extends Vale's `existence` check
against a fixed, case-insensitive token list of 27 entries (26 distinct
forms once the duplicated `here's` is removed): the "to be" verb forms
(`am`, `are`, `be`, `been`, `being`, `is`, `was`, `were`) and their
contractions (`aren't`, `isn't`, `wasn't`, `weren't`, `he's`, `here's`,
`how's`, `i'm`, `it's`, `she's`, `that's`, `there's`, `they're`, `we're`,
`what's`, `where's`, `who's`, `you're`). The rule fires on every occurrence
of any token, with message `Try to avoid using '%s'.`. It ships at
`level: suggestion`, so it advises and does not fail a Vale run in this
repo's configuration.

## Stats

Total hits: **1000**.

| area       | hits |  words | hits / 1000 words |
| ---------- | ---: | -----: | ----------------: |
| plan       |  338 | 15,885 |             21.28 |
| lessons    |  280 | 12,232 |             22.89 |
| spec       |  225 | 13,187 |             17.06 |
| repo-docs  |  132 |  4,900 |             26.94 |
| agent-docs |   25 |  1,627 |             15.37 |

Word counts are the totals for every file `wordcount.tsv` assigns to that
area, not just the files with hits.

Top matched phrases (lowercased):

| phrase | hits |
| ------ | ---: |
| is     |  626 |
| are    |  250 |
| be     |   81 |
| was    |   17 |
| being  |    7 |
| were   |    7 |
| am     |    4 |
| been   |    3 |
| isn't  |    2 |
| what's |    1 |
| you're |    1 |
| it's   |    1 |

12 distinct phrases hit out of the 26 the token list can match; none of the
other contractions (`aren't`, `wasn't`, `weren't`, `he's`, `here's`, `how's`,
`i'm`, `she's`, `that's`, `there's`, `they're`, `where's`, `who's`) appear.

## Examples

Coverage: every area below has at least one example; the top five phrases
(`is`, `are`, `be`, `was`, `being`) each appear at least once. The last
five are picked at random (`random.seed(1)`, `random.sample(rest, 5)` over
the alerts not already used for coverage) — marked "random" below.

- `site/src/content/docs/building-agents/agent-loop.mdx:3` (lessons, `is`) —
  frontmatter description: "Define one tool, run the loop that lets a model
  call it, and see why the loop **is** the whole trick."
- `docs/spec/000-specs.md:3` (spec, `is`) — "This document **is** the entry
  point for the *AI Training* specifications."
- `docs/plan/README.md:4` (plan, `is`) — "Status: **draft, captured at
  project setup on 2026-09-19; interview decisions / added the same day**.
  This **is** the brief as given, the first exploration / round, and the
  decisions from the approach interview."
- `AGENTS.md:3` (repo-docs, `is`) — "> This file (`AGENTS.md`) **is** the
  canonical agent configuration. `CLAUDE.md` is a symlink to this file."
  (the same line also matches `is` a second time, in "CLAUDE.md is a
  symlink").
- `.claude/skills/tutor/SKILL.md:3` (agent-docs, `are`) — frontmatter
  description: "Hints, not answers; scoped to one lesson or topic; asks a
  recall question first when reviews **are** due."
- `AGENTS.md:121` (repo-docs, `be`) — "content may be adapted with
  attribution and an entry in `NOTICE.md`; CS50 / (CC BY-NC-SA) may be cited
  and its ideas used, but its text may not **be** / adapted (verbatim
  inclusion only, marked per page\]."
- `CODE_OF_CONDUCT.md:60` (repo-docs, `was`) — "clarity around the nature of
  the violation and an explanation of why the / behavior **was**
  inappropriate."
- `CODE_OF_CONDUCT.md:17` (repo-docs, `being`) — "- Demonstrating empathy
  and kindness toward other people / - **Being** respectful of differing
  opinions, viewpoints, and experiences / - Giving and gracefully accepting
  constructive feedback" (a bullet list item, `Being` capitalized at the
  start of the line).
- (random) `docs/agents/writing-a-lesson.md:4` (agent-docs, `are`) — "How to
  write a lesson page with the lesson components. The rules the page / must
  follow **are** in `docs/spec/S03-lesson-authoring.md`; the ids it
  declares / come from `docs/spec/S02-topic-map.md` and the YAML under
  `site/src/data/`."
- (random) `docs/spec/S02-topic-map.md:317` (spec, `are`) — inside the S03
  lesson-map table, in the cell "coding-with-agents/context ... AGENTS.md /
  CLAUDE.md, sections, monorepo hierarchy, when instructions **are** not
  enough". The full row is a single, very long pipe-delimited table line;
  quoting only the matching cell here for length.
- (random) `site/src/content/docs/guides/slides.md:28` (lessons, `is`) —
  "`example.html` and `example.pdf` beside the source. The PDF output uses
  LaTeX / (Beamer); if it **is** missing, install it once with `quarto install tinytex`."
- (random) `site/src/content/docs/customizing-agents/instructions.mdx:45`
  (lessons, `is`) — "your team runs before pushing, which directory **is**
  generated, or which / obvious-looking fix has already been tried and
  reverted twice."
- (random) `site/src/content/docs/concepts/how-models-work.mdx:43`
  (lessons, `is`) — "Given the tokens so far, the model outputs a score for
  every token in its / vocabulary: how likely **is** each one to come
  next? Those scores become a / probability distribution."

## Concentration

Top five files by hit count:

| file                                                       | hits | area    |
| ---------------------------------------------------------- | ---: | ------- |
| site/src/content/docs/safety/agent-risk.mdx                |   74 | lessons |
| docs/spec/S02-topic-map.md                                 |   57 | spec    |
| docs/plan/explore/09-brilliant-skills-map.md               |   54 | plan    |
| site/src/content/docs/coding-with-agents/first-session.mdx |   54 | lessons |
| site/src/content/docs/customizing-agents/instructions.mdx  |   48 | lessons |

`AGENTS.md` and `CLAUDE.md` are the same file (`CLAUDE.md` is a symlink to
`AGENTS.md`, confirmed with `ls -la`); Vale scans both paths and the JSON
carries an identical 43-hit alert list under each name, so `AGENTS.md`'s 43
hits are effectively double-counted once more under `CLAUDE.md` inside the
1000-hit total and inside the repo-docs area total.

Line-by-line classification of each file's distinct hit lines (by leading
character: `|` for a table row, `#` for a heading, `-`/`*` for a bullet,
else prose) shows a split: in `docs/spec/S02-topic-map.md`, 32 of 51
distinct hit lines are pipe-delimited table rows (topic-id, name, notes,
prerequisite, source columns) and 18 are running prose, with 1 heading —
both random examples drawn from the spec area happened to land in table
cells. `docs/plan/explore/09-brilliant-skills-map.md` mixes 7 table rows,
6 bullets and 30 prose lines. The other top files —
`site/src/content/docs/safety/agent-risk.mdx` (56 of 59 prose, 3 bullets),
`site/src/content/docs/coding-with-agents/first-session.mdx` (43 of 43
prose) and `site/src/content/docs/customizing-agents/instructions.mdx` (38
of 40 prose, 1 heading, 1 bullet) — carry their hits almost entirely in
running prose, not tables or quoted material.
