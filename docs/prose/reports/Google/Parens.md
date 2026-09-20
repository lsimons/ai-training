# Google.Parens

## Rule

`.vale/styles/Google/Parens.yml` extends `existence` at `level: suggestion`
with `nonword: true` and message "Use parentheses judiciously." (link:
`https://developers.google.com/style/parentheses`). It has one token pattern:
`\((?![A-Z]{3,5}\))[^)]+\)` — any parenthetical, except one whose entire
contents is a bare 3-5 letter uppercase acronym (to avoid conflicting with
`Acronyms.yml`, per the comments in the file citing issues #30 and #59).

## Stats

Total hits: 427.

Of these, 60 have a `Match` value that is partly or fully replaced with
`*` padding in `docs/prose/reports/Google/Google.json` — Vale substitutes
inline code spans with same-width filler before its NLP pass, so the JSON
match text for those alerts is not the literal source text. The phrase
table below counts only the remaining 367 alerts, whose `Match` text is
literal source text.

| Area       | Hits | Words  | Hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| plan       | 300  | 15,884 | 18.89             |
| spec       | 47   | 13,184 | 3.56              |
| repo-docs  | 37   | 3,489  | 10.60             |
| lessons    | 25   | 12,227 | 2.04              |
| agent-docs | 18   | 2,707  | 6.65              |
| data       | 0    | 18,534 | 0.00              |

Top matched phrases (lowercase, unmasked matches only):

| Phrase                                  | Count |
| --------------------------------------- | ----- |
| (5)                                     | 4     |
| (bun)                                   | 3     |
| (4)                                     | 3     |
| (network)                               | 2     |
| (readability)                           | 2     |
| (content)                               | 2     |
| (starlight setup)                       | 2     |
| (5 scorm modules)                       | 2     |
| (7)                                     | 2     |
| (few-shot)                              | 2     |
| (sponsored)                             | 2     |
| (out of scope)                          | 2     |
| (lesson)                                | 2     |
| (one checkpoint per served objective)   | 2     |
| (scoped to the current lesson or topic) | 1     |

Distinct unmasked phrases: 349 (out of 367 unmasked hits — most
parentheticals are unique running text, not a repeated closed word list).

## Examples

- `AGENTS.md:18` (repo-docs; top phrase "(bun)"; table row)

  > | `mise run site-install-frozen` | Same, but fails if `bun.lock` is out of date |
  > | `mise run site-install` | Install the site dependencies (bun); may update `bun.lock` |
  > | `mise run site-install-frozen` | Same, but fails if `bun.lock` is out of date |

- `AGENTS.md:26` (repo-docs; top phrase "(network)"; table row)

  > | `mise run lint` | prek hooks over every file + `actionlint` |
  > | `mise run prose-sync` | Fetch the pinned Vale style package (network) |
  > | `mise run prose` | Vale prose lint; misspellings gate, style warnings advise |

- `AGENTS.md:31` (repo-docs; top phrase "(Readability)"; table row)

  > | `mise run prose-eval -- <pkg>` | Every hit of a Vale package as JSON, for deciding rule by rule |
  > | `mise run prose-metrics -- <pkg>` | Every file's score on a Vale metric package (Readability) |
  > | `mise run ci` | Full gate: install + lint + prose + spell + examples + check + build |

- `AGENTS.md:121` (repo-docs; alert's `Match` is masked as `(**********)`, actual source text below)

  > - Content is CC BY-SA 4.0 (`LICENSE`); code is Apache-2.0 (`LICENSE-CODE`).
  >   Source material has different terms; `docs/plan/README.md` has the table.

- `docs/plan/explore/03-cs50-pedagogy.md:89` (plan; top phrase "(4)")

  > blocks despite the rule. Fix: **show, not tell**. V2 used few-shot examples
  > (4), V3 fine-tuned GPT-4o-mini on 50 TF-authored conversations. Blind A/B
  > evaluation by 29 teaching fellows on 50 real student queries, scored with

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:18` (plan; top phrase "(5)")

  > `ai-anthropic-partners/courses/<path>/<module>/scorm/NN-<title>.html`:
  > developer foundations (5), architect professional (5), associate foundations
  > (8), partner basecamp (7). The first 18 share one component library (the

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:165` (plan; multi-line parenthetical)

  > Student to CS50 proxy to model provider. The proxy does PII scrubbing,
  > prompt-injection detection (ask the model "is this an injection?" on unusual
  > queries; aim is downward pressure, not 100%), request anonymization, RAG

- `docs/plan/explore/11-roadmap-sh.md:84` (plan)

  > AI Engineer (role roadmap, 5794 px tall): introduction (what an AI engineer
  > is versus an ML engineer, impact on product), working with LLMs and common

- `docs/spec/000-specs.md:14` (spec; table row; picked at random from the rest)

  > | S01 | [Project dictionary](S01-dictionary.md) | Fix the words this project uses for its content, its knowledge model, its interactions and its learners, so that every page, data file and component means the same thing by the same name. | Draft |
  > | S02 | [Topic map and competencies](S02-topic-map.md) | Name what the site teaches (topics and concepts, with prerequisite links), name what a learner should be able to do afterwards (competencies, objectives, behaviors), and say how the map differentiates between learners. | Draft |
  > | S03 | [Lesson authoring](S03-lesson-authoring.md) | Fix the rules every lesson page follows: page kind, anatomy and frontmatter, examples, citations, terms and prompts, checkpoints, exercises and widgets. | Draft |

- `site/src/content/docs/customizing-agents/instructions.mdx:177` (lessons)

  > This is the current `AGENTS.md` of `invoice-mailer`. The agent keeps running
  > `python -m pytest` (wrong), committing to `main`, and wrapping mail calls in
  > retry loops. Rewrite the file so that each of those stops, and so that

- `.claude/skills/tutor/SKILL.md:35` (agent-docs; heading line)

  > ## Verbs (scoped to the current lesson or topic)

- `docs/agents/writing-a-lesson.md:53` (agent-docs; picked at random from the rest)

  > All checkpoints take `id` (stable slug, unique in the page; it becomes the
  > section id and the progress key), `objective`, `title`, and `hint` (a

- `docs/plan/explore/09-brilliant-skills-map.md:156` (plan; picked at random from the rest)

  > minutes of interactive problems plus a **skills check**), **targeted skill**
  > (the lesson-sized ability a standard is matched to), **standard** (external
  > code).

## Concentration

Top five files by hit count:

| File                                                        | Hits |
| ----------------------------------------------------------- | ---- |
| `docs/plan/explore/11-roadmap-sh.md`                        | 47   |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` | 42   |
| `docs/plan/explore/12-learn-prompting.md`                   | 33   |
| `AGENTS.md`                                                 | 30   |
| `docs/plan/explore/03-cs50-pedagogy.md`                     | 28   |

Across all 427 hits, 66 fall on a line that starts with `|` (a markdown
table row) and 10 fall on a line that starts with `#` (a heading); the
remaining 351 are in running prose. Within the top five files, table-row
hits are rare (`11-roadmap-sh.md`: 1, `07-scorm-interactions-and-duck-tutor.md`:
0, `12-learn-prompting.md`: 0, `AGENTS.md`: 5, `03-cs50-pedagogy.md`: 0) —
`AGENTS.md`'s hits concentrate in its task-reference table
(`| task | what it does |`), where the second column often carries a
parenthetical aside. Code-adjacent hits (`Match` masked with `*` because
the parenthetical contains inline code) are concentrated in `AGENTS.md`
(10 of its 30) and thin elsewhere (`03-cs50-pedagogy.md`: 2,
`12-learn-prompting.md`: 1, `11-roadmap-sh.md`: 3,
`07-scorm-interactions-and-duck-tutor.md`: 0). `docs/plan/explore/` overall
carries 300 of the 427 hits (the `plan` area, exploration notes), matching
its long dense summary-of-source-material prose style, which uses
parenthetical asides to pack in counts, tallies and cross-references.
