# write-good: summary and recommendations

Reviewer's read of the per-rule reports in this directory, written to let
the maintainer decide per rule. Numbers come from `write-good.json` after
excluding the `CLAUDE.md` symlink (the per-rule reports predate that fix,
so their repo-docs counts run slightly high). Prose words in scope: 46,269
(the 18,534 words of YAML data carry no hits for any of these rules).

## Stats

| Rule      | Hits | Per 1,000 words | Where the hits are                          | Recommendation                      |
| --------- | ---: | --------------: | ------------------------------------------- | ----------------------------------- |
| E-Prime   |  957 |           20.68 | Everywhere; every form of "to be"           | Off                                 |
| Passive   |  245 |            5.30 | Everywhere; decided already                 | Now and then (decided)              |
| TooWordy  |  159 |            3.44 | 2 phrases carry 108 hits, both domain terms | Every run, with domain terms exempt |
| Weasel    |   20 |            0.43 | plan 9, lessons 8, spec 3                   | Every run                           |
| ThereIs   |    5 |            0.11 | spec 3, lessons 2; all "There is/are no X"  | Every run                           |
| So        |    4 |            0.09 | lessons 3, plan 1; sentence-initial "So"    | Now and then                        |
| Cliches   |    1 |            0.02 | Decided already; the 1 is a false positive  | Every run (decided)                 |
| Illusions |    0 |            0.00 | Doubled word ("the the")                    | Gate                                |

"Every run" means `.vale.ini` at warning level: printed by `mise run prose`
and CI, never failing. So and ThereIs ship at `error` level, so enabling
either anywhere needs an explicit `= warning` (or it gates).

## Rule by rule

### Illusions: gate

Structural check for the same word twice in a row. Zero hits, and a hit is
a typo every time. Nothing to disagree with. Set it to `error` so it fails
the build; that costs nothing today and catches a real class of mistake.

### Weasel: every run

Twenty hits from a 23-word list, six distinct words. In context:

- `docs/spec/000-specs.md:7`: "Each spec reads completely on its own."
  "Completely" adds nothing; "on its own" already says it.
- `docs/plan/explore/06-lesson-inventory.md:116`: table cell "very
  hands-on". The kind of hedge the rule exists for.
- `site/src/content/docs/concepts/how-models-work.mdx:30`: "short chunks of
  text that are usually a word, part of a word or a punctuation mark."
  True and precise; the hedge is the fact.
- `docs/spec/S02-topic-map.md:308`: "Runs several agent sessions without
  losing coherence." A number would be false precision here.
- `site/src/content/docs/safety/agent-risk.mdx:219`: "even when you trust
  the agent completely." Rhetorical, and it works.

About a quarter of the hits are worth a rewrite. At this volume the rule is
a useful question ("do I know the number?") rather than noise, and it stays
useful only if the volume stays low, which "every run" encourages.

### ThereIs: every run

Five hits. Four are the negative existential form: "There is no server, no
account and no telemetry" (`docs/spec/S04-progress-record.md:18`), "There
are no short codes" (`docs/spec/S01-dictionary.md:230`), "There is no daily
limit on lessons" (`docs/spec/S05-spaced-review.md:62`). The fifth opens a
section: "There is one more reason agent safety is different, and it is the
one people find hardest to believe until they see it"
(`site/src/content/docs/safety/agent-risk.mdx:179`).

The negative form is idiomatic and the rewrites ("The record has no
server") are only slightly tighter. I would not fix these five. But the
rule is rare enough to cost nothing in the output, and a new "There is a
worked example at" (`site/src/content/docs/guides/slides.md:13`) is exactly
the flabby opener the rule is for. Every run, at warning.

### So: now and then

Four hits. Three are deliberate: "So a tool has two halves"
(`site/src/content/docs/building-agents/agent-loop.mdx:36`), "So the
question shifts" (`site/src/content/docs/safety/agent-risk.mdx:47`), "So
the map is a drawing, not a graph" (`docs/plan/explore/11-roadmap-sh.md:48`).
Each follows a setup and delivers the consequence; that is the
conversational register the lessons use on purpose. The fourth is a false
positive: "a separate landing page - not the first sidebar entry - so the
sidebar starts with your actual content"
(`site/src/content/docs/guides/writing-pages.md:61`), a clause after a
dash, which the regex treats as sentence-initial.

Here I disagree with the rule for this repository: the lessons are meant to
read like someone explaining, and sentence-initial "So" is part of that
voice. It belongs with Passive in the extended config, where it can catch a
run of three "So"s in a row without arguing about each one.

### TooWordy: every run, with the domain terms exempted

A 214-token list; 21 tokens hit, 159 times. The distribution decides this
one:

| Token                        | Hits | What it is here                                         |
| ---------------------------- | ---: | ------------------------------------------------------- |
| objective                    |   55 | Defined term: learning objective (spec S01)             |
| it is                        |   53 | "It is the same list the CI job runs"; ordinary English |
| multiple                     |   13 | Mostly "multiple choice", a checkpoint kind             |
| evaluate, implement, monitor |   18 | Domain verbs: evals, "implement a specification"        |
| it was                       |    4 | "puts every file back the way it was"                   |
| the other twelve tokens      |   16 | The rule's real targets, mostly                         |

The genuine hits are few but real: "whether or not one exists"
(`site/src/content/docs/concepts/how-models-work.mdx:103`), "Think in terms
of blast radius" (`site/src/content/docs/coding-with-agents/first-session.mdx:171`),
"all of Foundations" (`docs/spec/S02-topic-map.md:509`), "may refer back to"
(`docs/spec/000-specs.md:30`). The rule also contradicts Weasel: it flags
"multiple" while Weasel flags "several".

As shipped the rule is 90 percent domain vocabulary and I would not run it.
But Vale adds every term in the vocabulary accept list to the exceptions
of rules that support them, and a test confirmed that adding `objective`
and `it is` to `accept.txt` removes those hits from TooWordy. Exempt
`objective`, `it is`, `it was`, `multiple`, `evaluate`, `implement`,
`monitor`, `advise`, `demonstrate` and what remains is a dozen hits worth
reading, roughly the shape of Weasel. That is worth having on every run.
The cost is nine slightly odd lines in the vocabulary file, each with a
comment saying which rule they exempt.

### E-Prime: off

E-Prime is a prescription, not a style rule: write English without any
form of "to be". 957 hits, 21 per thousand words, in every file. The
examples show what it would remove:

- `docs/spec/000-specs.md:3`: "This document is the entry point for the
  specifications."
- `site/src/content/docs/concepts/how-models-work.mdx:43`: "how likely is
  each one to come next?"
- `site/src/content/docs/guides/slides.md:28`: "if it is missing, install
  it once with `quarto install tinytex`."
- `AGENTS.md:3`: "This file is the canonical agent configuration."

A dictionary spec, a glossary and teaching prose are made of definitions,
and a definition is "X is Y". Rewriting these would make the text worse,
and there is no subset of the hits worth finding: it flags a word, not a
pattern. It should not go in the extended config either, because at four
times the volume of Passive it would bury the one rule that config exists
to surface.

If what the rule is reaching for is "too much static description, not
enough action", a per-file density number (be-verbs per thousand words,
which `prose-eval` already computes per area) says that in one line where
E-Prime says it in a thousand.

## If accepted, the work is

1. `.vale.ini`: `write-good.Illusions = error`, `write-good.Weasel = YES`,
   `write-good.ThereIs = warning`, `write-good.TooWordy = YES`.
2. `.vale-extended.ini`: the same plus `write-good.So = warning`.
3. `accept.txt`: the nine TooWordy exemptions, commented.
4. Rewrite the handful of real Weasel and TooWordy hits (about fifteen
   sentences).
5. Record the six decisions in `docs/prose/README.md`.
