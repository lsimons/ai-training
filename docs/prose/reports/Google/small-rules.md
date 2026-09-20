# Google small rules report

Nine `Google` package rules with at most seven hits each, gathered together.
Gathering only: no verdicts, no classification, no rewrites.

## Inputs

- `docs/prose/reports/Google/Google.json` filtered on `Check == "Google.<Rule>"`.
- `docs/prose/reports/Google/wordcount.tsv` for area lookup.
- `.vale/styles/Google/<Rule>.yml` for rule definitions.

## Units

**Rule.** `extends: existence`, `level: error`, `nonword: true`. Three
regex tokens match a digit run directly followed by a byte/data unit
(`B|kB|MB|GB|TB`), a time unit (`ns|ms|min|h|d`), or a bare `s` (with a
negative lookbehind excluding decade forms like `1990s`). Message: "Put a
nonbreaking space between the number and the unit in '%s'."

**Stats.** Total hits: 7. All in area `plan` (0 in lessons, spec,
agent-docs, repo-docs, data).

| area | hits | words                         | hits/1000 words |
| ---- | ---- | ----------------------------- | --------------- |
| plan | 7    | (per-file, see wordcount.tsv) | —               |

Top matched phrases (as emitted, case-sensitive): `2h` (2), `100B` (1),
`1h` (1), `5h` (1), `7h` (1). 5 distinct phrases.

**Examples.**

- `docs/plan/explore/03-cs50-pedagogy.md:45` — "- **Week content**: **lecture** (about 2h, clippable via the CS50 video"
- `docs/plan/explore/03-cs50-pedagogy.md:47` — " (about 1h, hands-on practice with a teaching fellow), **problem set / pset**"
- `docs/plan/explore/06-lesson-inventory.md:109` — "| 2 | Generative AI for Everyone | beginner, 5h | Intro; projects; business and society | 1, 2 | KW |"
- `docs/plan/explore/06-lesson-inventory.md:110` — "| 3 | AI Prompting for Everyone | beginner, 7h | Finding information; AI as thought partner (incl. sycophancy); multimedia and code | 1, 3, 2 | KW |"
- `docs/plan/explore/06-lesson-inventory.md:112` — "| 5 | Claude Code: A Highly Agentic Coding Assistant | intermediate, 2h | Setup, features, testing, parallel work, GitHub and hooks, notebook to dashboard, Figma | 3, 4, 5 | Engineer |"
- `docs/plan/explore/06-lesson-inventory.md:116` — "| 9 | MCP: Build Rich-Context AI Apps | intermediate, 2h | Why MCP through remote deployment; hands-on throughout | 5, 6 | Engineer |"
- `docs/plan/explore/12-learn-prompting.md:87` — "100B parameters"; "there exist few to no defenses" against injection)." (line 86-87: "text-davinci-003, and some claims now wrong (CoT "only yields gains at about\\n100B parameters"...")

**Concentration.** `docs/plan/explore/06-lesson-inventory.md` carries 4 of
7 hits, `docs/plan/explore/03-cs50-pedagogy.md` carries 2, and
`docs/plan/explore/12-learn-prompting.md` carries 1. All hits are in
`docs/plan/explore/`, none elsewhere. Four of the seven are inside Markdown
table cells (the lesson-inventory duration column); the rest are inline in
running prose.

## Latin

**Rule.** `extends: substitution`, `level: error`, `ignorecase: true`,
`nonword: true`, action `replace`. Two swap entries: `eg`/`e.g.` →
"for example", `ie`/`i.e.` → "that is", each matched with a lookahead for a
following space/comma/semicolon or end of string (so it still catches the
abbreviation at the end of a heading, table cell, or block). Message:
"Use '%s' instead of '%s'."

**Stats.** Total hits: 7. Areas: `plan` 2, `spec` 5. None in lessons,
agent-docs, repo-docs, data.

Top matched phrases (lowercase): `e.g.` (7). 1 distinct phrase.

**Examples.**

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:67` — "- One JSON blob in localStorage under a **versioned key** (e.g. `dev-m2-vF2`)"
- `docs/plan/explore/09-brilliant-skills-map.md:153` — "Vocabulary: **course** (subject, e.g. Fractions), **level** (a group of"
- `docs/spec/S01-dictionary.md:146` — "| **Concept** | A named idea a learner can understand and explain, e.g. *context window*, *prompt injection*. The smallest node. Belongs to exactly one topic. Has a one-paragraph definition and a glossary anchor. | idea, notion |"
- `docs/spec/S01-dictionary.md:148` — "| **Topic** | A named cluster of two to eight concepts inside an area, e.g. *Prompting*, *Tool use*. A noun. The unit a lesson covers and the node that carries links. Has its own reference page. | subject, module, theme, competency |"
- `docs/spec/S01-dictionary.md:149` — "| **Competency** | Something a learner can *do*, stated as a verb phrase, e.g. *Verifies AI output before relying on it*. Draws on one or more topics, possibly across areas. Owns three to six learning objectives. | skill, capability, ability, topic |"
- `docs/spec/S01-dictionary.md:150` — "| **Learning objective** | A verb-phrase node under a competency, e.g. *Writes a task brief with goal, context and done-criteria*, tagged with one level. Owns behaviors. What lessons serve and assume and checkpoints prove. | goal, outcome, aim, standard |"
- `docs/spec/S01-dictionary.md:153` — "| **Goal** | A learner-chosen destination expressed as a competency at a level, e.g. "Building agents: base". Paths are the routes to goals. | objective, target |"

**Concentration.** `docs/spec/S01-dictionary.md` carries 5 of 7 hits;
`docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` and
`docs/plan/explore/09-brilliant-skills-map.md` carry 1 each. All five
`S01-dictionary.md` hits sit inside Markdown table cells (the dictionary's
definition column); the two `plan` hits are inline running prose.

## Timeless

**Rule.** `extends: existence`, `level: suggestion`, `ignorecase: true`.
Three tokens: `currently`, `latest`, `soon`. A comment notes `now`/`new`
were excluded (too many non-time-anchored senses) and `recently` was
excluded (every corpus hit was "recently used"). Message: "Avoid
time-based words like '%s' in product documentation."

**Stats.** Total hits: 5. Areas: `repo-docs` 1, `spec` 1, `lessons` 3.

Top matched phrases (lowercase): `latest` (3), `currently` (2). 2 distinct
phrases.

**Examples.**

- `AGENTS.md:111` — "\`deploy.yml\` publishes \`site/dist\` to GitHub Pages, currently on manual"
- `docs/spec/S02-topic-map.md:400` — "Pointing at the approved spreadsheet, not "the latest numbers", prevents the agent from pulling last quarter's figures from an old email."
- `site/src/content/docs/coding-with-agents/first-session.mdx:155` — "Fix the off-by-one in \`done()\` in \`todo.py\`: \`done 1\` currently marks the"
- `site/src/content/docs/safety/agent-risk.mdx:113` — "Weeks later you ask the same agent to "send Sam the latest figures". It"
- `site/src/content/docs/using-agents/delegating.mdx:80` — "one, not the right one, and "the latest information" is an invitation to"

**Concentration.** One hit each in five distinct files; no file has more
than one. Two of the three `lessons` hits and the `spec` hit occur inside
quoted example phrases ("the latest numbers", "the latest figures", "the
latest information") rather than as the site's own claims; the other two
(`AGENTS.md`, `first-session.mdx`) are plain running prose / code-adjacent
narration.

## LyHyphens

**Rule.** `extends: existence`, `level: error`, `ignorecase: false`,
`nonword: true`, action `edit` (regex replace `-` with a space). One
token: `\b[^\s-]+ly-\w+\b`, matching a hyphenated compound whose first
part ends in "ly". Message: "'%s' doesn't need a hyphen."

**Stats.** Total hits: 5. Areas: `plan` 2, `spec` 3.

Top matched phrases (lowercase): `supply-chain` (4), `early-career` (1). 2
distinct phrases.

**Examples.**

- `docs/plan/explore/09-brilliant-skills-map.md:20` — "Marketing framing: "designed for college students, early-career"
- `docs/plan/explore/09-brilliant-skills-map.md:99` — " - SEC-5 Assess and manage software supply-chain risk"
- `docs/spec/S02-topic-map.md:277` — "| \`coding-with-agents/quality\` | Quality with agents | testing, documentation, dependency hygiene, security review of agent output, supply-chain risk | verification, safety/agent-risk | \`DLAI-7\`; \`Brilliant SEC\` |"
- `docs/spec/S02-topic-map.md:305` — "| \`verifies-agent-work\` | \`screens-for-security\` | base | Screens agent output for security and supply-chain problems |"
- `docs/spec/S02-topic-map.md:444` — "| Brilliant Coding with AI | SEC-3, SEC-5 | Evaluate AI code for vulnerabilities; supply-chain risk | \`coding-with-agents/verifies-agent-work/screens-for-security\` |"

**Concentration.** `docs/spec/S02-topic-map.md` carries 3 of 5 hits (all
`supply-chain`), `docs/plan/explore/09-brilliant-skills-map.md` carries 2.
Three of five hits sit inside Markdown table cells; the other two
(`early-career`, one `supply-chain`) are inline running prose / list
items.

## Exclamation

**Rule.** `extends: existence`, `level: error`, `nonword: true`, action
`edit` (`trim_right`, `!`). One token: `\w+!(?:\s|$)`, a word immediately
followed by an exclamation point. Message: "Don't use exclamation points
in text."

**Stats.** Total hits: 2. All in area `repo-docs`.

Top matched phrases (lowercase): `project!` (1), `sorry!` (1). 2 distinct
phrases.

**Examples.**

- `CONTRIBUTING.md:3` — "Thank you for investing your time in contributing to our project!"
- `CONTRIBUTING.md:62` — "Since this is a small hobby project, we may not notice your contribution for a while if we are busy elsewhere. Sorry!"

**Concentration.** Both hits are in `CONTRIBUTING.md`, the only file with
any hit. One is the opening welcome line, the other the closing line of
the "notice" section; both are running prose, not headings or tables.

## OptionalPlurals

**Rule.** `extends: existence`, `level: error`, `nonword: true`, action
`edit` (`trim_right`, `(s)`). One token: `\b\w+\(s\)`, a word directly
followed by a parenthesized "s". Message: "Don't use plurals in
parentheses such as in '%s'."

**Stats.** Total hits: 1. Area `agent-docs` (1). No hits elsewhere.

Top matched phrases (lowercase): `paragraph(s)` (1). 1 distinct phrase.

**Examples.**

- `docs/agents/writing-a-lesson.md:43` — "Opener paragraph(s), then H2 sections. Teaching prose is plain Markdown."

**Concentration.** Single hit, single file (`docs/agents/writing-a-lesson.md`),
in running prose at the start of a paragraph.

## Ranges

**Rule.** `extends: existence`, `level: warning`, `nonword: true`. One
token: `(?:from|between)\s\d+\s?-\s?\d+`, matching "from" or "between"
followed by a numeric range written with a hyphen. Message: "Don't add
words such as 'from' or 'between' to describe a range of numbers."

**Stats.** Total hits: 1. Area `plan` (1). No hits elsewhere.

Top matched phrases (lowercase): `from 2026-07` (1). 1 distinct phrase.

**Examples.**

- `docs/plan/explore/02-agent-engineer-course.md:86` — "Urdalen, 32 by Leo Simons (from 2026-07-19 onwards), 18 by dependabot." (the match spans "from 2026-07"; the full digits continue "-19")

**Concentration.** Single hit, single file
(`docs/plan/explore/02-agent-engineer-course.md`), in running prose
describing a git-history date range (the pattern matched a date, not a
numeric range).

## Ordinal

**Rule.** `extends: existence`, `level: error`, `nonword: true`. One
token: `\d+(?:st|nd|rd|th)`, matching a digit run followed by an ordinal
suffix. Message: "Spell out all ordinal numbers ('%s') in text."

**Stats.** Total hits: 1. Area `plan` (1). No hits elsewhere.

Top matched phrases (lowercase): `2nd` (1). 1 distinct phrase.

**Examples.**

- `docs/plan/explore/06-lesson-inventory.md:23` — "| 02 | \`02-how-agents-think.md\` | Tokens and context, reasoning strategies, model choice, system prompts, sampling | 4.6k, 25 m | 1 | Both, 2nd half eng | \`context-window-explorer\`; ELI5 |"

**Concentration.** Single hit, single file
(`docs/plan/explore/06-lesson-inventory.md`), inside a Markdown table cell
(the lesson-inventory "audience" column).

## Slang

**Rule.** `extends: existence`, `level: error`, `ignorecase: true`. Five
tokens: `tl;dr`, `ymmv`, `rtfm`, `imo`, `fwiw`. Message: "Don't use
internet slang abbreviations such as '%s'."

**Stats.** Total hits: 1. Area `spec` (1). No hits elsewhere.

Top matched phrases (lowercase): `tl;dr` (1). 1 distinct phrase.

**Examples.**

- `docs/spec/S01-dictionary.md:62` — "| **Recap** | The closing section of a lesson: numbered takeaways, sources, what comes next. See "Recap and the learner's reference". | summary, conclusion, TL;DR |"

**Concentration.** Single hit, single file (`docs/spec/S01-dictionary.md`),
inside a Markdown table cell (the dictionary's synonym column for
"Recap").
