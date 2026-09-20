# Per-rule report template

Instructions for the agent that writes `docs/prose/reports/<package>/<Rule>.md`
from `docs/prose/reports/<package>/<package>.json` and `wordcount.tsv`.
Gathering only: no verdicts, no classification, no rewrites. The reader
decides.

## Inputs

- The JSON: Vale's `--output=JSON`, a map of file path to a list of alerts.
  Filter on `Check == "<package>.<Rule>"`. Each alert has `Line`, `Span`,
  `Match` and `Message`.
- `wordcount.tsv`: `area`, `file`, `words`. Areas: `lessons` (published
  site content), `spec`, `plan` (exploration notes), `agent-docs`,
  `repo-docs`, `data`.
- The repository files themselves, for context.

## Output, in this order

1. **Rule.** One paragraph: what the rule's YAML does (read
   `.vale/styles/write-good/<Rule>.yml`), its shipped level, and the size of
   its word list or pattern.
2. **Stats.** Total hits. A table per area: hits, words, hits per thousand
   words. A table of the top matched phrases (in lowercase) with counts, up to
   fifteen rows, and the number of distinct phrases.
3. **Examples.** Twelve to fifteen, each as a bullet with `file:line`, then
   the sentence quoted with one line before and after where the sentence is
   cut. Choose them so that: every area with hits has at least one; the top
   five phrases each appear at least once; at least three are picked at
   random from the rest (say which). Quote verbatim, don't trim inside the
   sentence.
4. **Concentration.** Which files carry the most hits (top five with
   counts), and whether the hits cluster in tables, headings, quoted
   material, code-adjacent text or running prose. Facts only.

Keep the whole report under 250 lines. Root-relative paths, no links.
