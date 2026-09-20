# write-good.ThereIs

## Rule

`.vale/styles/write-good/ThereIs.yml` extends Vale's `existence` check with
one regex, `(?:[;-]\s)There\s(is|are)|\bThere\s(is|are)\b`, matching "There
is"/"There are" right after a semicolon or hyphen, or anywhere as a
capitalized "There is"/"There are". `ignorecase: false`, so a lowercase
"there is" mid-sentence is not flagged. The rule ships at `level: error`.
It has no word list; it is a single two-branch pattern.

## Stats

Total hits: 5.

| Area       | Hits | Words  | Hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| spec       | 3    | 13,187 | 0.227             |
| lessons    | 2    | 12,232 | 0.163             |
| plan       | 0    | 15,885 | 0                 |
| repo-docs  | 0    | 4,900  | 0                 |
| agent-docs | 0    | 1,627  | 0                 |
| data       | 0    | 16,402 | 0                 |

Top matched phrases (lowercased):

| Phrase    | Count |
| --------- | ----- |
| there is  | 4     |
| there are | 1     |

2 distinct phrases.

## Examples

- `docs/spec/S01-dictionary.md:230`

  > Every unit is identified by a lowercase kebab-case **slug**. Slugs never
  > change once published; display names may. There are no short codes.

- `docs/spec/S04-progress-record.md:18`

  > - **Browser only.** The record is one JSON document in browser local
  >   storage. There is no server, no account and no telemetry.
  > - **Nothing leaves the browser** unless the learner exports the file.

- `docs/spec/S05-spaced-review.md:62`

  > says how many remain.
  >
  > - There is no daily limit on lessons, only a suggestion after two lessons in
  >   one sitting.

- `site/src/content/docs/guides/slides.md:13`

  > There is a worked example at
  > [`site/public/presentations/example.qmd`](/presentations/example.qmd). Open the

- `site/src/content/docs/safety/agent-risk.mdx:179`

  > There is one more reason agent safety is different, and it is the one people
  > find hardest to believe until they see it.

All 5 hits are shown above; every area with a hit (spec, lessons) has an
example, and both distinct phrases ("there is", "there are") appear.

## Concentration

Each of the 5 hits is in a different file, so no file carries more than
one. Three of five are spec files (`S01-dictionary.md`, `S04-progress-record.md`,
`S05-spaced-review.md`); two are lesson pages. Two hits sit inside a
Markdown bullet list item (`S04-progress-record.md:18`,
`S05-spaced-review.md:62`); the rest are in ordinary running prose. None
are in tables, headings, quoted material or code-adjacent text.
