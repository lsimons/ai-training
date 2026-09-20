# ai-tells.FigurativeLives

## Rule

`.vale/styles/ai-tells/FigurativeLives.yml` extends the `existence` rule
with `nonword: true`, `ignorecase: true`, and `level: error`. Its
`tokens` list holds six regular expressions: a determiner-gated form
(`the|a|its|...` + optional modifier + subject word + `lives|lived|living`

- one of `in|at|on|under|inside|within|here|there|upstream|downstream|elsewhere|alongside|as`), a determiner-less sentence-start form with a
  long negative lookahead that refuses pronouns, demonstratives, and
  auxiliaries as the subject, a bare-plural form with the base verb `live`
  and adverbial complements only, the address question `where the <noun> lives`, and two mortality idioms (`lives and dies`, `the legacy lives on`). Thirty `exceptions` name beings that literally reside: families,
  people, users, developers, maintainers, species, cats, bacteria, and so
  on. The comment calls "lives" "an AI fingerprint for location by
  residence: the config 'lives in' a file, the logic 'lives' upstream",
  says the plain form is "is defined" or "is stored", and admits the
  measured cost: "established programmer idiom is still the substitution
  this rule names", with eight matches across the Go and Python standard
  libraries ("this module lives in", "the package lives in") that "fire
  anyway" because the maintainer asked for it. Message: "AI overused verb:
  '%s'. Say where the item is defined or stored. Disable this rule for
  biography or housing prose."

## Stats

Total hits: 11.

| area       | hits | words | hits / 1000 words |
| ---------- | ---: | ----: | ----------------: |
| repo-docs  |    3 |  3139 |              0.96 |
| lessons    |    3 | 12134 |              0.25 |
| spec       |    3 | 13147 |              0.23 |
| plan       |    2 | 15852 |              0.13 |
| agent-docs |    0 |  3200 |              0.00 |
| data       |    0 | 18534 |              0.00 |
| **total**  |   11 | 66006 |              0.17 |

Top matched phrases:

| phrase                              | count |
| ----------------------------------- | ----: |
| `progress lives in`                 |     2 |
| `content lives in`                  |     2 |
| `every repo task lives in`          |     1 |
| `a problem lives at`                |     1 |
| `state lives in`                    |     1 |
| `where the bibliography file lives` |     1 |
| `the schedule lives in`             |     1 |
| `a worked example lives at`         |     1 |
| `theme lives in`                    |     1 |

Distinct phrases: 9. Ten of the eleven are the residence form with `in`
or `at`; one is the address question (`where the bibliography file lives`). In nine of eleven the complement is a file path or a storage
location (`.mise.toml`, `browser local storage`, `site/src/content/docs/`,
`the progress record's reviews map`, `reveal.scss`).

## Examples

All eleven hits, in file order.

- `AGENTS.md:13` — "Every repo task lives in `.mise.toml`; `mise tasks`
  lists them. Run `mise trust` / and `mise install` once per clone."
- `AGENTS.md:134` — "- Learner progress lives in browser local storage
  only. No backend, no / telemetry."
- `README.md:48` — "`mise tasks` lists them all. Content lives in
  `site/src/content/docs/`; static / assets and slide decks in
  `site/public/`."
- `docs/plan/explore/02-agent-engineer-course.md:69` — "- Progress lives
  in Claude's auto-memory directory as `teach-progress.md` / (indexed
  from `MEMORY.md`): a table of Lesson / Read / Quiz / Score / Weak"
- `docs/plan/explore/09-brilliant-skills-map.md:102` — "- ABS-1 Reason
  at the level a problem lives at"
- `docs/spec/S01-dictionary.md:15` — "written at one level for every
  knowledge worker, and **Engineering**, for / software engineers who
  have finished Foundations. Learner state lives in the / browser only;
  there is no backend."
- `docs/spec/S03-lesson-authoring.md:165` — "2. Where the bibliography
  file lives and in what format (BibTeX or YAML). / Decide when building
  the citation plugin."
- `docs/spec/S05-spaced-review.md:96` — "The schedule lives in the
  progress record's `reviews` map, keyed by / checkpoint id, with the
  shape shown in the progress record spec."
- `site/src/content/docs/contributing.md:22` — "Content lives in
  `site/src/content/docs/`; static assets in `site/public/`."
- `site/src/content/docs/guides/slides.md:13` — "A worked example lives
  at / [`site/public/presentations/example.qmd`](/presentations/example.qmd).
  Open the"
- `site/src/content/docs/guides/slides.md:36` — "The reveal.js theme
  lives in `site/public/presentations/reveal.scss` and maps / the deck's
  fonts and accent color onto the site's LSD Warm palette. Adjust the"

## Concentration

Top files by hit count:

| file                                            | hits |
| ----------------------------------------------- | ---: |
| `AGENTS.md`                                     |    2 |
| `site/src/content/docs/guides/slides.md`        |    2 |
| `README.md`                                     |    1 |
| `docs/plan/explore/02-agent-engineer-course.md` |    1 |
| `docs/plan/explore/09-brilliant-skills-map.md`  |    1 |

No file carries more than two hits. All eleven are in running prose or
list items; none in headings or table cells. Eight of eleven are
code-adjacent: the sentence's complement is an inline-code file path or
directory (`AGENTS.md`, `README.md`, `contributing.md`, `slides.md` twice,
`02-agent-engineer-course.md`, `S05-spaced-review.md`). The three
`lessons` hits are the two guide pages (`slides.md`, `contributing.md`)
that document the repository rather than teach; no lesson page under
`concepts/`, `safety/`, `using-agents/`, `coding-with-agents/`, or
`customizing-agents/` has a hit. `09-brilliant-skills-map.md:102` quotes
an external skill title ("Reason at the level a problem lives at"). The
same two sentences are near-duplicated across `README.md:48` and
`contributing.md:22` ("Content lives in ..."), and across `AGENTS.md:134`
and `S01-dictionary.md:15` ("progress/state lives in the browser").
