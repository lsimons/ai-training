# Google: summary and recommendations

Reviewer's read of the per-rule reports in this directory, written to let
the maintainer decide. Data: `Google.json` (Vale 3.20.0, Google v0.7.1),
66,025 words in scope of which 47,491 are prose (the `data` YAML gets no
hits from any Google rule). The package has 36 rules; 27 fired, 2,255 hits.

## What this package is

The Google developer documentation style guide, as regexes. Unlike
write-good (clarity) and proselint (usage errors), most of it is *house
style*: second person, present tense, sentence-case headings, contractions
encouraged, punctuation inside quotes, Oxford comma, no "we". Half the
rules therefore ask "does this project want Google's voice?" rather than
"is this sentence bad?". Where the project has already answered in its
specs (S03: lessons open with "In this lesson we will..."), the rule
conflicts with the spec, and the spec wins unless the maintainer changes it.

Three rules are tunable through the project vocabulary: `Acronyms`,
`Headings` and `Colons` honor `accept.txt`, verified with a test file
(MCP in the vocabulary silences "Spell out MCP"; CS50 silences the heading
and colon hits on it).

## Stats

| Rule             | Hits | Lessons | Recommendation                      |
| ---------------- | ---: | ------: | ----------------------------------- |
| Semicolons       |  510 |      60 | Now and then, lessons only          |
| Parens           |  427 |      25 | Off                                 |
| Acronyms         |  274 |       4 | Every run, lessons only, with vocab |
| Passive          |  247 |      40 | Off, exact duplicate                |
| Contractions     |  191 |      83 | Off, voice decision                 |
| OxfordComma      |   93 |      14 | Off, style decision                 |
| Colons           |   85 |       0 | Off                                 |
| We               |   84 |      14 | Off, conflicts with S03             |
| Quotes           |   83 |      23 | Off, punctuation decision           |
| Will             |   58 |      32 | Off, conflicts with S03             |
| FirstPerson      |   42 |      18 | Off                                 |
| Headings         |   40 |       0 | Every run                           |
| WordListCase     |   39 |      14 | Off                                 |
| Ellipses         |   16 |       1 | Off                                 |
| Spacing          |   10 |       0 | Off, all one false positive         |
| WordList         |    9 |       0 | Off                                 |
| Anthropomorphism |    9 |       5 | Off                                 |
| ExcessiveClaims  |    8 |       1 | Now and then                        |
| Units            |    7 |       0 | Now and then                        |
| Latin            |    7 |       0 | Every run                           |
| Timeless         |    5 |       3 | Every run                           |
| LyHyphens        |    5 |       0 | Off, all false positives            |
| Exclamation      |    2 |       0 | Every run                           |
| OptionalPlurals  |    1 |       0 | Every run                           |
| Ranges           |    1 |       0 | Now and then                        |
| Ordinal          |    1 |       0 | Now and then                        |
| Slang            |    1 |       0 | Gate                                |
| 9 with no hits   |    0 |       0 | See below                           |

## The rules that measure density, not defects

**Semicolons** (510) and **Parens** (427) fire on every semicolon and
every parenthetical. Neither can tell a good one from a bad one; the
message is "use judiciously". What they measure is density: the plan
notes run 16 semicolons and 19 parentheticals per thousand words, the
lessons 5 and 2. In a lesson a semicolon asks the learner to hold two
ideas in one sentence, and the Readability pass found the long-sentence
files are exactly the semicolon-heavy ones.

- Semicolons, **now and then, lessons only** (the same
  `[site/src/content/docs/**]` scoping as Readability). Sixty hits in the
  lessons is a sweepable list; the 450 in specs and notes would bury
  `prose-extended`'s Passive output, which is the reason that task exists.
  Example worth the look, `safety/agent-risk.mdx:79`: "That is the point;
  it tells you what to shrink." Example not worth it, `delegating.mdx:34`:
  "It is fictional; read it once now so that you can judge the agent's
  work later."
- Parens, **off**. This project uses parentheses by design: spec codes,
  source keys, counts, citations (`AEC-13`, "(5 SCORM modules)"). Sixty of
  the matches are inline code Vale masked out before matching. There is
  nothing to sweep for.

## The rules that conflict with the project's own voice

**We** (84), **Will** (58), **FirstPerson** (42). Spec S03 says a lesson
opens with "In this lesson we will..." and never "you will learn"; the
tutor skill's commands are "quiz me" and "test me"; the lessons quote
prompts in the first person ("summarize the three articles I bookmarked").
Google writes reference documentation in the second person and present
tense, and these rules enforce that. Of the 84 We hits, 49 are plan notes
comparing "ours" with a source ("Their unit is a technology; ours is a
competency") and 16 are the Code of Conduct and CONTRIBUTING, which are
supposed to say "we". **Off**, all three. If the maintainer ever wants
present tense in lesson bodies ("the agent reads" not "the agent will
read"), Will is the one to revisit; 32 of its hits are in lessons, and
about half are the spec-mandated opener.

**Contractions** (191). Google *wants* contractions: "don't", not "do
not". The lessons are contraction-free throughout (83 hits, "cannot" 26,
"do not" 32) and so are the specs. The top hit, "what is" (34), is wrong
as "what's" in most of its sentences ("Tick what is true for a project
you know"). This is a voice decision. The current voice is consistent, so
**off**; if the maintainer wants a warmer register in lessons, turn it on
for lessons only and expect to rewrite around the "what is" hits.

**OxfordComma** (93). The project omits it consistently, in specs, notes
and lessons alike ("read, search, draft, propose and prepare"). Google
requires it. Either is correct English; consistency is what matters and
the project has it. **Off** unless the maintainer prefers the comma, in
which case it is 93 mechanical edits and then a fair gate.

**Quotes** (83, shipped as error). American punctuation puts the comma or
period inside the closing quote; the project puts it outside, everywhere.
This is the one Google rule that is an *American* convention, so it
deserves a moment given the American-spelling decision. Against turning
it on: the lessons quote prompts and commands, and the punctuation would
land inside the thing the learner is told to type. Every one of the 17
hits in `safety/agent-risk.mdx` is such a quote: "tidy up the downloads
folder", "send Sam the latest figures", "summarize this page in two
sentences". Programmers' logical quoting is a recognized American
technical-writing style for exactly this reason. **Off**; the project
uses logical quotation on purpose, and that is worth one line in the
authoring guide so nobody "fixes" it.

## The rules worth having

**Headings** (40, sentence case). The lessons already comply: zero hits.
The hits are `AGENTS.md`'s three title-case headings ("Quick Reference",
"Commit Message Convention", "Session Completion"), spec and note headings
that name a proper noun or code (`### Area concepts: Concepts`, "CS50",
"S01", "Test my Knowledge" quoting a product), and six in
`CODE_OF_CONDUCT.md`, which is the Contributor Covenant verbatim.
**Every run** as a warning. Fix the three in `AGENTS.md`; add the proper
nouns to `accept.txt`, which this rule honors; and take
`CODE_OF_CONDUCT.md` out of the prose file list like `site/examples/`, as
third-party text nobody here wrote (it also carries this package's
Exclamation, We, Will and ExcessiveClaims hits, and Readability's worst
score).

**Acronyms** (274) requires every three-to-five-letter capital run to be
spelled out once per file, "Term (ACR)". 209 hits are the plan notes'
Brilliant skill codes (SPC, VER, INC, SEC, BLD), which are codes, not
acronyms, and 57 are the specs' source keys. The lessons have four: PDF,
SMTP, LSD (the theme name), SCSS. But the rule's idea is the right one for
a course: the first lesson to say MCP or RAG should define it, and future
lessons will say both a lot. **Every run, lessons only**, with the
acronyms an engineer reads without help (API, CLI, HTTP, JSON, PDF, SMTP,
SCSS, MDX, CSS, URL) in `accept.txt`, and MCP, RAG, LLM deliberately
*not* exempted so the rule asks for the definition. The exemption list
will grow; each entry is a one-line decision that this audience knows the
term.

**Latin** (7, "e.g." to "for example"). Zero in lessons; five in the
dictionary's table cells, two in notes. Clear rule, easy fix, and "e.g."
in a lesson for knowledge workers is exactly what it should catch.
**Every run**, and fix the seven.

**Timeless** (5: "currently", "latest"). Three of five are inside quoted
example prompts ("send Sam the latest figures"), which is the lesson
making a point about vague requests. The other two are real: `AGENTS.md`
"currently on manual dispatch only" is a sentence that will rot.
**Every run**; a hit asks "will this be true next year?".

**Exclamation** (2, both in CONTRIBUTING: "our project!", "Sorry!").
Google bans them outright; proselint.Hyperbole, already gating, only
catches two or more in a row. A single one in a welcome line is fine; in
a lesson it is not. **Every run** as a warning, leave CONTRIBUTING alone.

**OptionalPlurals** (1, "paragraph(s)") and **Slang** (1, `tl;dr`). Fair
hits both. OptionalPlurals **every run**; Slang **gate**, after wrapping
the dictionary's one `tl;dr`, which sits in a do-not-use column, in a code
span so Vale skips it.

**Now and then**: **ExcessiveClaims** (8, every hit "best" in "best-first
search", "Best course per topic", "what is best"; none a claim, but
"guarantees" or "fastest" in a lesson would deserve a look), **Units**
(7, "2h" and "5h" in the notes' duration tables; Google wants a
nonbreaking space, which nobody will type in Markdown, but "2 hours" in a
lesson reads better), **Ordinal** (1, "2nd" in a table) and **Ranges** (1,
a false positive: "from 2026-07-19" matched as a numeric range, which will
recur wherever a note says "from <ISO date>").

## Off, with the reason

- **Passive**: 247 hits, and every one shares file, line and count with
  write-good.Passive, which already runs in `prose-extended`. Duplicate.
- **Colons** (85): lowercase after a colon. The hits are labels ("**Status:**
  Draft"), headings the scope should have excluded, and proper nouns after
  a colon. Zero in lessons. The vocabulary would fix the proper nouns but
  not the labels.
- **WordListCase** (39) and **WordList** (9): Google's product vocabulary.
  "CLI" to "command-line tool", "Cloud" to "Google Cloud Platform",
  "touch" (matching `apple-touch-icon`), "admin", "chapter" (in the
  dictionary's do-not-use column, doing its job). The one debatable entry
  is "above" (18 hits) to "earlier"; Google's reason is that pages reflow,
  which applies here too, but it is not worth the other 21.
- **Ellipses** (16): every hit is a quoted template or button ("You can
  now...", "**Reset...**"), the same set proselint.Typography found and
  the same reason to leave them.
- **Spacing** (10): all ten are the "g.A" inside "DeepLearning.AI". The
  rule is `nonword`, so the vocabulary cannot exempt it. A pity: a real
  missing space after a period is a typo worth gating. Revisit if the
  package ever lets it take exceptions.
- **LyHyphens** (5): "supply-chain" and "early-career". The regex takes
  any word ending in -ly for an adverb; both are nouns. All false.
- **Anthropomorphism** (9): "sees" and "tells" with human subjects ("the
  learner sees") or as idiom ("tells a chat assistant from an agent").
  One arguable hit ("the rehype plugin only sees Markdown"). Not enough.

## The nine that did not fire

Gate the tripwires, as with proselint: **AMPM** ("3pm"), **DateFormat**
(slash dates and "19 September 2026"; the project writes ISO dates, which
the rule does not match), **EmDash** (a spaced em or en dash), **Gender**
("he/she", "s/he"), **Periods** ("A.B.C."), **HeadingPunctuation** (a
period ending a heading). Each hit would be a defect.

**GenderBias** duplicates proselint.GenderBias, already an every-run
warning: off. **Spelling** is a British-spelling list, cspell's job: off.
**Jargon** (four tokens: "break-glass", "camel case", "out-of-the-box",
"swim lane"): harmless, but proselint.Jargon already runs and this list
adds nothing the audience would stumble on. Off.

## If the maintainer disagrees

The recommendations that are taste rather than evidence, and what the
other choice costs:

- **Quotes on, lessons only**: 23 edits now, and a convention to explain
  to every author about quoted prompts. Mixed logical and typographic
  quoting inside one page would be the likely result.
- **OxfordComma on**: 93 edits, then a clean gate. Cheap if wanted.
- **Contractions on, lessons only**: 83 hits, of which the "what is" and
  "that is" ones mostly should not change; the rest would warm the voice.
- **Semicolons every run instead of now and then**: 60 permanent warnings
  in the lessons until someone rewrites them, plus one per new semicolon.
