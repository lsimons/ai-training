# proselint: summary and recommendations

Reviewer's read of `all-rules.md`, written to let the maintainer decide.
Data: `proselint.json` (Vale 3.20.0, proselint v0.3.4), 47,065 prose words
in scope. The package has 34 rules; 33 ran. `Uncomparables` crashes Vale
when its two-word match wraps across a line ("most" at the end of one line,
"complete" at the start of the next), so it ran separately as a plain
regex over the same files.

## Stats

The package produced 19 hits. Thirty rules produced none.

| Rule          | Hits | What fired                                                    | Recommendation |
| ------------- | ---: | ------------------------------------------------------------- | -------------- |
| Typography    |   17 | `...` in quoted UI strings and table cells; one `2x2`         | Off            |
| Cliches       |    1 | "in a word", the same false positive write-good.Cliches finds | Off, duplicate |
| Very          |    1 | "very helpful", a quoted survey label                         | Off, duplicate |
| Uncomparables |    1 | "Anthropic most complete", in a plan note                     | Off, crashes   |
| 30 others     |    0 |                                                               | See below      |

## The rules that fired

**Typography** wants the Unicode ellipsis and multiplication sign. Every
`...` here is inside a quoted string that mirrors what the reader sees on
screen ("You can now...", "In this lesson we will...", a **Reset...**
button) or in a table cell. Changing those to `…` would make the quotes
differ from the UI they quote, and `2×2` for a taxonomy is pedantry. Off.

**Cliches** has 777 tokens against write-good's list and found the same
one sentence, the false positive "letters in a word". **Very** is one word
that write-good.Weasel already covers. Both are duplicates of rules that
already run. Off.

**Uncomparables** ("most complete", "very unique") is a reasonable rule
and its one hit is a fair one, but a rule that can crash CI on a wrapped
line cannot run anywhere. Off until Vale fixes it. The crash is documented
in `.vale-eval.ini` with a one-line reproduction.

## The thirty that did not fire

Zero hits is not zero value. A rule with no hits and a short, precise
token list is a free tripwire: it costs nothing today and the day it fires
it is almost certainly right. A rule with no hits and a long, opinionated
list is a different thing: untested noise. The thirty split like this.

**Tripwires worth having, gate (error).** A hit is a defect every time.

- Annotations: `TODO`, `FIXME`, `XXX`, `NOTE` left in text.
- Cursing, LGBTOffensive: slurs and profanity. This is a public,
  open-content project with outside contributors.
- Hyperbole: two or more `!` or `?` in a row.
- RASSyndrome ("PIN number", "PDF format"), Oxymorons ("exact estimate"),
  Malapropisms, Nonwords ("irregardless"): each hit is a mistake.
- DateCase, DateMidnight, DateRedundancy, DateSpacing: "12 a.m.",
  "3pm", "10 a.m. in the morning".

**Worth having, every run (warning).** A hit deserves a look but may be
deliberate.

- GenderBias ("chairman" to "chair"), LGBTTerms, DenizenLabels,
  GroupTerms: inclusive and correct labels. GroupTerms and DenizenLabels
  will never fire on this material, which is fine.
- CorporateSpeak ("low-hanging fruit", "synergy"), Airlinese, Jargon,
  Archaisms, Skunked ("hopefully", "decimate"), Hedging ("I would argue
  that"), Apologizing ("More research is needed"), Currency ("$10
  dollars"). Short lists, clear targets, and this material is exactly
  where corporate speak creeps in.

**Not for this repository.**

- Spelling: this is not a spelling check. It swaps British spellings for
  American ones ("colour" to "color", "organise" to "organize"). The
  prose here is British (35 "behaviour(s)" against 10 "behavior(s)", the
  latter in the Contributor Covenant text). Off.
- Diacritical: "cafe" to "café", "cliche" to "cliché". Fine in a
  restaurant review; here it would flag the word "cliche" in this very
  document. Off.
- Needless: 352 swap pairs of "prefer X over Y". Zero hits now but it is
  the TooWordy shape: a long list with opinions in it, untested here. Now
  and then, so it can prove itself before it earns every run.
- But: "do not start a paragraph with But". Like write-good.So, this is
  a device the lessons use on purpose. Now and then, beside So.
- P-Value: for statistics papers. Off.
- AnimalLabels: "bird-like" to "avine". Off.

## Where I disagree with the package

proselint ships 27 of its 34 rules at `error`. For a package that includes
"consider using the ellipsis symbol" that is the wrong default, and it is
why none of these can be enabled as a block: each rule that runs at
warning needs its own `= warning` line. The config gets long, but every
line is a decision that can be read.

The larger point is that proselint found nothing wrong here. That is
partly because the write-good rules already cover the overlap and partly
because the material is careful. The value is in the tripwires, which is
a modest but real return for one package line.

## Side finding

The prose mixes spellings: "judgement" 7 times and "judgment" twice,
"behaviour" 35 and "behavior" 10, "summarise" and "learned". Some of the
American forms are quoted text (the Contributor Covenant) and some are
not. No package checks consistency of spelling variety; a local
substitution rule with a dozen pairs would. Worth a separate decision.

## If accepted, the work is

1. `.vale.ini`: fourteen rules at `error`, thirteen at `warning`, by name.
2. `.vale-extended.ini`: the same plus `proselint.Needless = warning` and
   `proselint.But = warning`.
3. `.vale.ini`'s `Packages` gains the proselint line; `prose-sync` fetches
   both. `.gitignore` already covers the synced style.
4. Nothing to rewrite: the enabled rules have zero hits.
5. Thirty-four rows in `docs/prose/README.md`, or one row per group with
   the rules listed.
