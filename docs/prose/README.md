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

## Decisions

| Package    | Rule    | Where        | Why                                                                                                          |
| ---------- | ------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| write-good | Cliches | Every run    | Rare, and a hit is nearly always worth a rewrite                                                             |
| write-good | Passive | Now and then | Regex over "is/are/be + participle"; most hits are idiom, a minority hide who does what and are worth fixing |
