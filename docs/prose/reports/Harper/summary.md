# Harper: summary and recommendation

Two ways to add a grammar check were evaluated on the same 82,087 words
(the `mise run prose` file set): the Vale port of Harper
(vale-cli/Harper v0.1.0, 547 rules, run through `mise run prose-eval -- Harper`
with the package added to `.vale-eval.ini`) and Harper itself
(`harper-cli` 2.10.0, installed ad hoc through mise's aqua registry as
`aqua:Automattic/harper/harper-cli`, US dialect, every rule on). Data:
`Harper.json` (Vale, every enabled package), `harper-cli.json`
(Harper, every lint), `wordcount.tsv`.

The package fires so little that per-rule reports would be one paragraph
each, so this summary holds the examples instead.

## What Harper is

An open source grammar checker by Automattic, written in Rust, with about
800 linters: subject-verb agreement, wrong-word pairs ("then/than",
"their/they're"), missing articles and prepositions, compound nouns,
redundancies, and a spell checker. The Vale port compiles 455 of those
linters into 547 Vale rules and scores 95.9% recall against Harper's own
test sentences. Everything a Vale rule can't express (agreement, missing
words, long sentences, the spell check) is missing from the port by
design.

## The headline

The repository's prose has almost no grammar errors for either tool to
find.

| Measure                                                  | Vale port | harper-cli |
| -------------------------------------------------------- | --------: | ---------: |
| Rules available                                          |       547 |       ~800 |
| Rules that fired                                         |        13 |         47 |
| Hits, total                                              |        78 |      3,994 |
| Hits after removing what other tools already own (below) |        78 |        562 |
| Of those, hits that are a grammar error                  |         0 |          0 |
| Hits in lessons                                          |         2 |         69 |

The things harper-cli flags that other tools already own here: spelling
(1,003 hits; cspell's job, with its own word list), title-case headings
(278; the house style is sentence case, `Google.Headings`), sentence
capitalization (192; nearly all bullet fragments and YAML values), and
runs of spaces, unclosed quotes and `---` (1,965; Harper reads `.mdx` and
`.yaml` as plain text, so these are code blocks, JSX, and frontmatter).

## What the Vale port found

| Rule                     | Hits | What it is here                                                       |
| ------------------------ | ---: | --------------------------------------------------------------------- |
| `NumericRangeEnDash`     |   32 | `30-90`, `3-5` in the plan notes; the house has no en-dash convention |
| `RoadMap`                |   23 | "roadmap", the product name roadmap.sh and the ordinary word          |
| `ExpandConfiguration`    |    9 | "config" in AGENTS.md; a file name and a noun engineers use           |
| `ExpandTimeShorthands`   |    4 | "min" in a lesson-length table                                        |
| `ClicheAccent`           |    2 | "cliches", the name of a write-good rule                              |
| `AdjectiveDoubleDegree`  |    1 | "One or more opener paragraphs"; "more" counts, it doesn't compare    |
| `MoreAdjective2/4`       |    2 | "most common", "most likely"; the rule says itself it isn't an error  |
| `AsHow`                  |    1 | "Adopt it as how paths and the map interact"; correct as written      |
| `ExpandMemoryShorthands` |    1 | "B" for bytes, quoting a source                                       |
| `FindOut`                |    1 | "Find out" as a quiz instruction; fine                                |
| `DiscourseMarkers`       |    1 | "otherwise" mid-sentence in spec S04, no comma wanted                 |
| `OkToOkay`               |    1 | "OK" in a transcript                                                  |

No hit is a grammar error. Every one is style the house hasn't adopted, a
name matched as a word, or a false match.

## What harper-cli found beyond the port

Every rule the port can't express, with the hit read in context:

- `LongSentences` (118): sentences over 40 words. 59 are YAML competency
  descriptions, 12 are lessons. `Readability.FleschKincaid` scores the
  same thing per file.
- `OxfordComma` (105): same rule as `Google.OxfordComma`, already a
  warning.
- `SplitWords` (82): "frontmatter", "gitignored", "gitleaks", "todo".
  Jargon, all in `cspell-words.txt`.
- `DisjointPrefixes` (45): "re-read", "re-explain", "pre-commit". The
  house hyphenates these.
- `ToDoHyphen` (20): "todo" in the first-session lesson, quoting a
  tool's output.
- `OrthographicConsistency` (23): "ReAct", "CoT", "KW". Names.
- `CompoundNouns`, `PhrasalVerbAsCompoundNoun` (24): "home page",
  "Plugin", "rollout", "Callout". Half are component or product names.
- `MassNouns` (10): "a public, open-content project", "an expiry". All
  false.
- `MissingTo` (7), `MissingPreposition` (13), `MissingDeterminer` (3):
  every hit is a table cell, a heading, a bullet fragment, or text inside
  a JSX attribute.
- `TheirToTheyre` (2): "Their two or three bullets" is the possessive.
  False.
- `AnA` (1): "a SCORM 1.2 API shim". "SCORM" is said ess-corm, so "a" is
  right.
- `RepeatedWords` (1): "Language Language Model", quoting a source's own
  mistake on purpose.
- `Everyone` (1): "every one that" in the delegating lesson is the
  correct two-word form.
- `HowTo` (1), `OutOfTheWindow` (1), `TheHowWhy` (1), `WrongNegative`
  (1, "untestable" to "detestable"): false.
- `RegularIrregulars` (1): "mottos" to "mottoes". Both are accepted;
  Merriam-Webster lists "mottoes" first.

So the grammar rules the Vale port leaves out produced no true positive
across the whole repository.

## Recommendation

Adopt neither as a gate or a `ci` step. Reasons:

1. The evidence says there's nothing to catch. Zero true positives in
   82,000 words from either tool. Agent-written prose has a register
   problem, which ai-tells covers, and no grammar problem.
2. The Vale port's 78 hits are 11 style conventions the house hasn't
   adopted (en dash ranges, "configuration" over "config", "road map"),
   which would each need the same rule-by-rule decision the other
   packages got, for a package that adds no signal beyond them.
3. harper-cli needs its own file set (Markdown only; it reads MDX and YAML
   as plain text), its own dictionary next to `cspell-words.txt`, its own
   disables for title case and sentence capitalization, and its own tool
   pin. That's a second prose toolchain for zero true positives.

If a grammar check is wanted anyway, the cheaper of the two is the Vale
port: same runner, same file set, same vocabulary, pinned like the other
packages. Add it to `.vale.ini` with only the wrong-word rules that read
zero here (`ThenThan`, `TheyreToTheir`, the `ThereIsAgreement` family) as
warnings, and leave the 500 others off. That is a tripwire at no reading
cost. Either way the `.vale-eval.ini` entry stays, so
`mise run prose-eval -- Harper` can be rerun when the port ships a new
release.

Not recommended: harper-cli, harper-ls, or a Harper GitHub Action. The
place Harper earns its keep is in an editor while typing, where its fixes
are one keystroke, and that is a personal setup, not a repository gate.
