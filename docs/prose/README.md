# Prose lint: rules and decisions

Vale runs over every tracked Markdown, MDX and site-data YAML file
(`mise run prose`). This page records which rules run where and why, and
the process for deciding about a new style package.

Every Markdown file in the repository shapes the Markdown written after it:
authors and agents read these files and copy their patterns. So the
exploration notes under `docs/plan/` are in scope even though the site never
publishes them.

## Where a rule can go

| Place        | Config               | Task                      | Effect                                  |
| ------------ | -------------------- | ------------------------- | --------------------------------------- |
| Gate         | `.vale.ini`, error   | `mise run prose`, `ci`    | Fails the build                         |
| Every run    | `.vale.ini`, warning | `mise run prose`, `ci`    | Prints on every run, never fails        |
| Now and then | `.vale-extended.ini` | `mise run prose-extended` | Prints only when someone asks; advisory |
| Off          | none                 |                           | Not worth the reading time              |

## Process for a package

1. Add the package to `.vale-eval.ini` and run
   `mise run prose-eval -- <package>`. This writes every hit as JSON and word
   counts per area into `docs/prose/reports/<package>/`.
2. For each rule, an agent writes `reports/<package>/<Rule>.md` following
   `report-template.md`: stats, representative examples in context,
   concentration. Gathering only, no verdicts.
3. A reviewer reads the reports and writes `reports/<package>/summary.md`:
   a stats table, a few examples per rule, and a recommendation per rule
   with the disagreements said plainly.
4. The maintainer decides. The decision lands in the table below and in the
   config files; hits for rules that will gate get fixed first.

The reports quote the flagged sentences on purpose, so `mise run prose`
skips `docs/prose/reports/`.

A *metric* package (Readability) is a different shape: each rule computes
one score per file and Vale reports only the files over the threshold, at
line 1, with nothing to point at. For those, step 1 also runs
`mise run prose-metrics -- <package>`, which scores every file on every
rule into `reports/<package>/scores.tsv`, and step 2 is a distribution per
area plus the longest sentences of the outlier files instead of per-rule
example reports.

## Decisions

| Package    | Rule                                                                                                                                                                        | Where        | Why                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| write-good | Illusions                                                                                                                                                                   | Gate         | A doubled word is a typo every time; zero hits today                                                         |
| write-good | Cliches                                                                                                                                                                     | Every run    | Rare, and a hit is nearly always worth a rewrite                                                             |
| write-good | Weasel                                                                                                                                                                      | Every run    | Low volume; a hit asks "do I know the number?", and about a quarter deserve the rewrite                      |
| write-good | ThereIs                                                                                                                                                                     | Every run    | Rare; "There is no X" is fine and stays, the flabby opener is what it catches. Level lowered to warning      |
| write-good | TooWordy                                                                                                                                                                    | Every run    | With nine domain terms exempted in `accept.txt` (objective, evaluate, ...) what remains is worth reading     |
| write-good | So                                                                                                                                                                          | Now and then | The lessons open a consequence with "So" on purpose; this catches a run of them                              |
| write-good | Passive                                                                                                                                                                     | Now and then | Regex over "is/are/be + participle"; most hits are idiom, a minority hide who does what and are worth fixing |
| write-good | E-Prime                                                                                                                                                                     | Off          | Bans every "to be"; definitions are "X is Y" and it flags a word, not a pattern. Would bury Passive          |
| proselint  | `Annotations`, `Cursing`, `LGBTOffensive`, `Hyperbole`, `RASSyndrome`, `Oxymorons`, `Malapropisms`, `Nonwords`, `DateCase`, `DateMidnight`, `DateRedundancy`, `DateSpacing` | Gate         | Zero hits; a hit is a defect every time                                                                      |
| proselint  | `GenderBias`, `LGBTTerms`, `DenizenLabels`, `GroupTerms`, `CorporateSpeak`, `Airlinese`, `Jargon`, `Archaisms`, `Skunked`, `Hedging`, `Apologizing`, `Currency`             | Every run    | Zero hits; a hit deserves a look but may be deliberate                                                       |
| proselint  | `Needless`                                                                                                                                                                  | Now and then | 352 swap pairs with zero hits: untested, so it proves itself first                                           |
| proselint  | `But`                                                                                                                                                                       | Now and then | Paragraph-initial "But" is a device the lessons use, like So                                                 |
| proselint  | `Typography`                                                                                                                                                                | Off          | The `...` in quoted UI strings mirrors what the screen shows                                                 |
| proselint  | `Cliches`, `Very`                                                                                                                                                           | Off          | Duplicates of write-good rules that already run                                                              |
| proselint  | `Spelling`                                                                                                                                                                  | Off          | A British-to-American swap list, not a spell check; a spell checker will do this                             |
| proselint  | `Diacritical`, `P-Value`, `AnimalLabels`                                                                                                                                    | Off          | Not for this material                                                                                        |
| proselint  | `Uncomparables`                                                                                                                                                             | Off          | Crashes Vale 3.20.0 when a match spans a line break; revisit after a Vale upgrade                            |

The evaluations are in `reports/<package>/summary.md`.
