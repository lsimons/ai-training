# write-good.So

## Rule

`.vale/styles/write-good/So.yml` extends Vale's `existence` check with one
regex, `(?:[;-]\s)so[\s,]|\bSo[\s,]`, matching either a lowercase "so"
right after a semicolon or hyphen, or a capitalized "So" anywhere followed
by a space or comma — in practice this flags "So" (or "so") starting a
sentence or clause. The rule ships at `level: error`. It has no word list;
it is a single two-branch pattern.

## Stats

Total hits: 4.

| Area       | Hits | Words  | Hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| plan       | 1    | 15,885 | 0.063             |
| lessons    | 3    | 12,232 | 0.245             |
| spec       | 0    | 13,187 | 0                 |
| repo-docs  | 0    | 4,900  | 0                 |
| agent-docs | 0    | 1,627  | 0                 |
| data       | 0    | 16,402 | 0                 |

Top matched phrases (lowercased):

| Phrase | Count |
| ------ | ----- |
| so     | 4     |

1 distinct phrase.

## Examples

- `docs/plan/explore/11-roadmap-sh.md:48`

  > So the map is a **drawing, not a graph**. Grouping is by position and by
  > connector lines; only 41 of 279 nodes in AI Engineer are joined by real

- `site/src/content/docs/building-agents/agent-loop.mdx:36`

  > The model cannot run code. What it can do is emit text that says "call
  > this function with these arguments". So a tool has two halves: the
  > function you will run, and the description the model reads to decide when

- `site/src/content/docs/guides/writing-pages.md:61`

  > instead of the usual docs layout. It is a separate landing page - not the first
  > sidebar entry - so the sidebar starts with your actual content.

- `site/src/content/docs/safety/agent-risk.mdx:47`

  > So the question shifts. With an assistant you ask "is this answer right?".
  > With an agent you have to ask, before it runs, "if this goes wrong, what

All 4 hits are shown above; every area with a hit (plan, lessons) has an
example, and the single distinct phrase ("so") appears in all of them.

## Concentration

Each of the 4 hits is in a different file, so no file carries more than
one. All 4 sit in running prose: three start a new sentence with a
capitalized "So" mid-paragraph, and one (`writing-pages.md:61`) is the
lowercase clause-initial form after a hyphen ("- so"). None are in tables,
headings, quoted material or code-adjacent text.
