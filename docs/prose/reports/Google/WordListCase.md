# Google.WordListCase

## Rule

`.vale/styles/Google/WordListCase.yml` extends Vale's `substitution` style,
`level: warning`, with `ignorecase: true` — the case-insensitive half of
Google's word-list substitutions, so a sentence-initial match ("Touch the
screen") is caught alongside lowercase use. Its `swap` map has 54 entries,
mostly single words or short phrases (`above`, `admin`, `application`,
`chapter`, `disabled?`, `file name`, `touch`) mapped to a preferred
replacement, plus a few regex patterns (e.g. OAuth 2.0, WiFi, `.apk`). The
rule fires on `Match`, not on any code fence exclusion, so matches inside
table cells, headings and filenames count the same as running prose.

## Stats

Total hits: 39.

| area       | hits | words | hits / 1000 words |
| ---------- | ---- | ----- | ----------------- |
| lessons    | 14   | 12227 | 1.15              |
| spec       | 12   | 13184 | 0.91              |
| plan       | 9    | 15884 | 0.57              |
| agent-docs | 2    | 2707  | 0.74              |
| repo-docs  | 2    | 3489  | 0.57              |
| data       | 0    | 18534 | 0.00              |

Top matched phrases (lowercase):

| phrase      | count |
| ----------- | ----- |
| above       | 18    |
| touch       | 9     |
| disabled    | 4     |
| file name   | 2     |
| disable     | 1     |
| application | 1     |
| regex       | 1     |
| file path   | 1     |
| chapter     | 1     |
| admin       | 1     |

10 distinct phrases.

## Examples

- `AGENTS.md:37` (repo-docs, top phrase "touch"): "| `mise run site-favicon` | Regenerate the favicon + apple-touch-icon
  |" — the surrounding table rows are `mise run site-slides` above and
  `mise run site-clean` below.
- `AGENTS.md:149` (repo-docs, top-five phrase "disable"): "`starlight-links-validator`
  fails `mise run site-build` on a dead one, so\\n the build is the check.
  Do not disable it.\\n- Spelling is American English, checked by `mise run spell` (cspell) over"
- `docs/plan/README.md:91` (plan, top phrase "above"): "1. ~~Interview Leo
  on project approach and goals.~~ Done 2026-09-19, see above.\\n2. ~~Build
  a topic map.~~ First draft 2026-09-19 in" — preceded by a blank line.
- `docs/prose/README.md:56` (agent-docs, phrase "regex"): table row "|
  write-good | Passive | Now and then | Regex over "is/are/be
  - participle"; most hits are idiom, a minority hide who does what and
    are worth fixing |", between the "So" row above and the "E-Prime" row
    below.
- `docs/spec/S01-dictionary.md:207` (spec, phrase "admin"): "| **Maintainer**
  | Someone with commit rights on this repo. | admin, owner |" — between the **Tutor** and **Progress** dictionary rows.
- `docs/spec/S01-dictionary.md:55` (spec, random pick, phrase "chapter"): "|
  **Lesson** | One page, 10 to 25 minutes, of kind `tutorial` or
  `explanation`. The unit of progress and of tutor mode. See "Lesson".
  | chapter, unit, page, module |" — between the **Course** and
  **Section** dictionary rows.
- `docs/spec/S02-topic-map.md:527` (spec, top phrase "above"): " is not.
  Decide when writing the lesson.\\n4. Whether Foundations should carry any
  `expert` objectives at all. Two are drafted above (`keeps-a-check-habit`,
  `sets-oversight`);\\n drop them if Foundations stops at `base` by
  design."
- `docs/spec/S05-spaced-review.md:87` (spec, top phrase "disabled"): "
  may retry or Give Up, and Give Up records the single fail. Once a\\n
  result is recorded, Check and Give Up are both disabled.\\n3. After each
  answer: the lesson link, the five-pill stage, and the frequency"
- `site/src/content/docs/coding-with-agents/first-session.mdx:30` (lessons,
  top phrase "touch"): "repository is a fixture that ships with this
  course, so nothing you do here\\ncan touch your own work." — followed by a
  blank line.
- `site/src/content/docs/safety/agent-risk.mdx:194` (lessons, top phrase
  "file name"): "An email signature can contain it. A calendar invite
  description can contain\\nit. A file name can contain it. Anywhere text
  can go, an instruction can go." — followed by a blank line.
- `docs/plan/explore/08-diataxis.md:14` (plan, random pick, phrase
  "application"): "**action** versus **cognition** (doing versus knowing)
  and **acquisition**\\nversus **application** (study versus work). The four
  quadrants are the four\\nkinds of documentation, and the claim is that
  there are exactly four because"
- `docs/prose/report-template.md:10` (agent-docs, random pick, phrase "file
  path"): "\\n- The JSON: Vale's `--output=JSON`, a map of file path to a
  list of alerts.\\n Filter on `Check == "<package>.<Rule>"`. Each alert
  has `Line`, `Span`,"

## Concentration

Top files by hit count:

| file                                                                                                                                                                                                                                | hits |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `site/src/content/docs/coding-with-agents/first-session.mdx`                                                                                                                                                                        | 6    |
| `site/src/content/docs/safety/agent-risk.mdx`                                                                                                                                                                                       | 4    |
| `docs/spec/S01-dictionary.md`                                                                                                                                                                                                       | 3    |
| `docs/plan/explore/11-roadmap-sh.md`                                                                                                                                                                                                | 3    |
| `AGENTS.md`, `docs/spec/S02-topic-map.md`, `docs/spec/S05-spaced-review.md`, `docs/spec/S06-release-1.md`, `docs/spec/000-specs.md`, `docs/plan/explore/08-diataxis.md`, `site/src/content/docs/using-agents/delegating.mdx` (tied) | 2    |

The "above" hits (18 of 39, the majority) cluster in narrative
cross-references inside numbered lists and headings ("see above", "drafted
above"), each pointing back to an earlier list item or heading rather than
a spatial screen reference. "touch" hits split between running-prose uses
about files or scope ("must not touch", "does it touch", "which files it
may touch") and two occurrences embedded in non-prose tokens: a table cell
in `docs/spec/S02-topic-map.md` and the filename fragment
`apple-touch-icon` in an `AGENTS.md` table row. "disabled"/"disable" and
"file name" hits are all in running prose. Two of the ten dictionary-table
rows in `docs/spec/S01-dictionary.md` ("chapter", "admin") are matches
inside the table's definition column rather than free prose.
