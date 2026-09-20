# ai-tells: summary and recommendations

Reviewer's read of the per-rule reports in this directory, written to let
the maintainer decide. Data: `ai-tells.json` (Vale 3.20.0, ai-tells
v1.37.0), 66,006 words in scope of which 47,472 are prose (the `data` YAML
gets no hits from any ai-tells rule). The package has 137 rules, every one
shipped at `error`; 63 fired, 717 hits.

## What this package is

A catalog of the patterns that mark prose as machine-written: vocabulary
("delve", "tapestry"), formulas ("It's not X, it's Y"), rhythm (the
tricolon, the clipped closing sentence), figurative verbs on inanimate
subjects ("the config lives in", "the table holds"), and punctuation (the
em-dash, the semicolon as its replacement). Its README says it targets
technical documentation, and the YAML comments record, rule by rule, how
often each token fires on the Go and Python standard libraries and which
kinds of prose should disable it. The author's stated aim is to clean up
AI-assisted documentation, not to disguise it.

## The headline

The repository's prose is written almost entirely by agents, and the
maintainer expected the package to fire a lot. It didn't:

| Measure                                             |  Value |
| --------------------------------------------------- | -----: |
| Rules with zero hits                                | 74/137 |
| Hits from the two punctuation counters              |    202 |
| Hits from everything else                           |    515 |
| Everything-else hits per 1,000 words of prose       |   10.8 |
| Same, lessons only                                  |   11.8 |
| Lesson with the most hits (`safety/agent-risk.mdx`) |     51 |

The vocabulary and formula tells are absent: no "delve" outside a quote,
no "It's not just X", no "Great question", no em-dash, no puffery, no
listicle heading. What fires is the *register*: figurative verbs
("shape", "carries", "worth", "lives in"), clause rhythm (semicolons, "no
X, no Y", "Hints, not answers."), and lead-ins ("Three questions sort
actions quickly."). Those are the house voice, chosen on purpose in some
places and picked up by habit in others.

The worst file is instructive. `agent-risk.mdx` carries 51 hits, but 13
are the phrase "blast radius", the lesson's defined term and the name of
one of its learning objectives; 11 are VerbTricolon matches of which most
are noun lists; 4 are the term's definition ("what an action can
reach"). Take those out and the lesson sits at the average. So the
maintainer's second guess, that per-file density would need a tool of its
own, isn't borne out: the per-file table below is the density check, and
the count is low enough that rereading is the fix, not a metric.

Per-file, excluding SemicolonUsage and ColonUsage (prose files with five
or more hits):

| File                                                         | Hits | Words | Per 1,000 |
| ------------------------------------------------------------ | ---: | ----: | --------: |
| `docs/prose/report-template.md`                              |    9 |   249 |      36.1 |
| `docs/spec/000-specs.md`                                     |   19 |   764 |      24.9 |
| `site/src/content/docs/safety/agent-risk.mdx`                |   51 |  2861 |      17.8 |
| `docs/prose/README.md`                                       |   20 |  1327 |      15.1 |
| `docs/spec/S01-dictionary.md`                                |   39 |  2649 |      14.7 |
| `site/src/content/docs/coding-with-agents/first-session.mdx` |   23 |  1787 |      12.9 |
| `docs/spec/S03-lesson-authoring.md`                          |   16 |  1248 |      12.8 |
| `docs/plan/explore/09-brilliant-skills-map.md`               |   24 |  1938 |      12.4 |
| `docs/spec/S05-spaced-review.md`                             |   14 |  1137 |      12.3 |
| `docs/spec/S02-topic-map.md`                                 |   70 |  5879 |      11.9 |
| `site/src/content/docs/customizing-agents/instructions.mdx`  |   23 |  1941 |      11.8 |
| `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md`  |   19 |  1716 |      11.1 |
| `site/src/content/docs/using-agents/delegating.mdx`          |   21 |  2167 |       9.7 |
| `site/src/content/docs/concepts/how-models-work.mdx`         |   10 |  1160 |       8.6 |
| `AGENTS.md`                                                  |    5 |  1840 |       2.7 |

The two prose-lint documents top the table because they write *about*
tells and quote them.

## Stats

| Rule                      | Hits | Lessons | Recommendation                            |
| ------------------------- | ---: | ------: | ----------------------------------------- |
| SemicolonUsage            |  150 |      26 | Now and then                              |
| VerbTricolon              |   95 |      37 | Off, surface-form regex                   |
| ColonUsage                |   52 |       0 | Off, as Google.Colons                     |
| AnthropomorphicCognition  |   42 |       4 | Off, "teaches"                            |
| CataphoricForecasting     |   32 |       8 | Now and then                              |
| FigurativeShape           |   23 |       4 | Now and then                              |
| FigurativeIdioms          |   21 |      17 | Now and then, "blast radius"              |
| FormalTransitions         |   19 |       6 | Off, conflicts with Google.Latin          |
| FigurativeWorth           |   18 |       0 | Now and then                              |
| ContrastiveNegation       |   17 |       1 | Now and then                              |
| FigurativeCarries         |   16 |       2 | Now and then                              |
| LabelAndExplain           |   15 |       7 | Off, the Pitfall convention               |
| ShipOveruse               |   14 |       3 | Off, project vocabulary                   |
| UniversalSubject          |   13 |       1 | Now and then                              |
| BareNames                 |   13 |       4 | Off, project vocabulary                   |
| FormalRegister            |   12 |       1 | Off, "implement"                          |
| ContrastiveFormulas       |   12 |       1 | Now and then                              |
| FigurativeLives           |   11 |       3 | Every run, fixed                          |
| NegatedSubject            |   10 |       4 | Now and then                              |
| MicDrop                   |    9 |       1 | Now and then                              |
| NegatedObject             |    9 |       2 | Now and then                              |
| FigurativeKeeps           |    9 |       2 | Off, "keep it short"                      |
| OverusedVocabulary        |    8 |       0 | Every run, fixed                          |
| FigurativeDraws           |    8 |       0 | Off, a spec column header                 |
| StackedAnaphora           |    7 |       3 | Now and then                              |
| BareHolds                 |    6 |       4 | Off, the YAML says so                     |
| FigurativeStays           |    6 |       2 | Now and then                              |
| ExplainerHeadings         |    5 |       2 | Off, the headings are right               |
| BareReaches               |    5 |       4 | Off, the term's definition                |
| NounString                |    4 |       0 | Now and then                              |
| 33 rules with 1 to 3 hits |   55 |      20 | See below                                 |
| 74 rules with no hits     |    0 |       0 | 14 gate, 32 every run, 28 with the family |

## The punctuation counters

**SemicolonUsage** (150) is a subset of Google.Semicolons: 147 of its 150
hits contain a Google hit, and it skips 383 of Google's 530. The subset it
keeps is the one the package cares about, a comma-free clause tacked on
after the semicolon ("Paths are advisory; nothing is ever locked."). The
project already decided semicolons are a now-and-then sweep for the
lessons; this rule is the sharper version of that sweep and belongs
beside it. Twenty-six lesson hits is a list one can read in an afternoon.
**Now and then.**

**ColonUsage** (52) has no lesson hits. Twelve are the `**Purpose:**` and
`**Status:** Draft` labels at the top of every spec, which the YAML itself
names as a known limitation; fourteen are a product or course name after
a colon; five are a single capital letter inside a quoted title. Google's
version was turned off for the same reason. **Off.**

## The rules that flag the project's own words

These fire on vocabulary the specs chose, so a hit is never a fix:

- **AnthropomorphicCognition** (42): 34 of the 42 matches contain "teach".
  This is a teaching site; "the section that teaches it" appears in six
  places because spec S02 defines lessons that way. The YAML says to
  disable it for prose about people; a lesson is the next thing over.
  The other eight ("the model answers with", "the license forbids") are
  literal. **Off.**
- **ShipOveruse** (14): 13 of 14 are the software-release sense, and Ship
  is the name of a development phase in this project. **Off.**
- **BareNames** (13) and **BareReaches** (5): "Names what an agent action
  can reach and break" is learning objective `names-blast-radius`. Every
  hit is that objective, its lesson, or its recap. **Off.**
- **LabelAndExplain** (15): "The rule: ..." closes every Pitfall and "A
  good result: ..." opens every exercise self-check, by spec S03. **Off.**
- **FormalTransitions** (19): 13 of the hits are "for example", which is
  what Google.Latin asks for instead of "e.g.". The other six ("That's
  why", "Hence") are fair but too few to carry a rule that fights one
  already running. **Off.**
- **FormalRegister** (12): 10 are the `implement` family, ordinary software
  vocabulary; the other 13 stems (utilize, facilitate, ...) never appear.
  **Off.**
- **HouseStyle** (2): wants "project style" for "house style". The
  project's own Vale style directory is named `House`. **Off.**
- **EnforcementMetaphors** (2): "gate" is what this repository calls a
  check that fails the build. **Off.**
- **FigurativeDraws** (8): six are the column header "Draws on topics" in
  S02. **Off.**
- **FigurativeKeeps** (9): "keep it short", "keep ids stable". Plain
  English. **Off.**
- **BareHolds** (6): "the file holds the complete program". The YAML calls
  this the loudest rule in the package on ordinary technical writing and
  says to disable it where the container sense is kept. **Off.**
- **ExplainerHeadings** (5): "Where a rule can go", "Where the scores come
  from". Those are the right headings. **Off.**
- **AffirmativeFormulas** (1) and **SequencingMarkers** (2): all three hits
  are "The first lesson", "The second lesson", "the lesson is", where
  lesson is the project's noun for a page. **Off.**

## The rule the regex can't carry

**VerbTricolon** (95) infers "verb" from surface form: a word ending in
`-s`, `-ing` or `-ed`, or any word after a colon. Of the 16 examples in
its report, five are three parallel verbs, one is three clauses, one is
one verb plus two "its", and nine are noun phrases after a colon, five of
them the first three items of a list of four or five ("A brief has four
parts: the goal, the context..., the limits..., and how you know it is
done" fires). The lessons carry 37 hits, the most of any rule, and most
are false. The rule of three is a real tell, but this regex can't find it
in Markdown that uses colons to introduce lists. **Off**, with
VerbTricolonDensity.

## The register rules

**Now and then**, together, as one sweep. These are the house voice: the
lead-in count ("Two things people get wrong here."), the noun "shape" for
a structure (23, including the three near-identical "shows the shape of a
good exchange" disclaimers), "worth a rewrite" (18, eight of them a
Brilliant skill name), "carries" (16), the ", no X." fragment and "no X,
no Y" stack (17), "Every X has" in spec rules (13), the appositive "a Y,
not a Z" (12, three of them in the prose README's own table), "Nothing
here needs code." (10), "Hints, not answers." (9), the anaphora and
staccato (10), the consequence tails (5), and the one-hit rhythm rules.
Each is fine once; the point of the sweep is a lesson with a run of them.
Two notes for the sweeper:

- **FigurativeIdioms** (21): 17 are "blast radius", 13 of them in the
  safety lesson where it is the heading, the bolded defined term, a recap
  bullet and an exercise prompt. The term stays; the four other hits
  ("doubles as", "bury", "the whole trick") are the ones to read.
- The rest of the **Figurative** and **Metaphors** families (22 verb rules
  and 6 metaphor rules with zero hits) go in the same place, so the sweep
  sees the whole family and no zero-hit figurative rule sits in the gate
  waiting to fire on "the test runs".

## The rules that were fixed

**Every run.** Five rules fired on habit rather than on a decision, and
the rewrite was mechanical:

- **FigurativeLives** (11): "Content lives in `site/...`" became "is in";
  "Learner progress lives in browser local storage" became "is stored
  in"; ten fixed, the eleventh quotes a Brilliant skill title.
- **OverusedVocabulary** (8): "dynamically" (twice), "notably",
  "genuinely", "dynamic" replaced with the specific word; "robust" and
  "delve" stay because the notes quote the source site.
- **SelfReference** (2): "Then remember that everything the agent reads"
  became "Then take everything the agent reads as"; the plan hit quotes
  an exercise.
- **FillerPhrases** (2): "the agent tends to forget" became "often
  forgets"; the other is the objective `attributes-honestly`.
- **StructureAnnouncements** (1): "Key Takeaways" is a SCORM screen name
  quoted from the source, so that warning persists.

## The zero-hit rules

74 rules had no hits. Fourteen name a phrase nobody types by accident and
**gate**: EmDashUsage (any unspaced dash; Google.EmDash already catches
the spaced one), DoubleHyphen, ClosingPleasantries ("I hope this helps"),
OpeningCliches ("In today's fast-paced"), ConclusionMarkers ("In
conclusion"), UnpackExplore ("Let's unpack"), DespiteChallenges,
RhetoricalSelfAnswer ("The result? A..."), PromotionalPuffery ("nestled in"), UrgencyInflation ("cannot
be overstated"), and the four listicle-heading rules.

Thirty-two run at **every run** as warnings, where a hit deserves a look
but may be deliberate: RestatementMarkers ("In other words"),
AICompoundPhrases ("rich tapestry", but also "real consequences", the
first hit on new content, which moved it out of the gate),
AIAdjectiveNounPairs ("comprehensive tests"), StrategyBuzzwords,
AbsoluteAssertions, VagueAttributions, the hedging and contrast rules,
the heading rules, and the syntax rules (ParticipialPadding,
ShellNounCopula, UnderRegime, ...). Twenty-eight are figurative verb and
metaphor rules and go with their family, now and then.

## Disagreements said plainly

- The package would have the maintainer rewrite "blast radius", "Hints,
  not answers" and "the section that teaches it". This summary says those
  are decisions, not tells, and turns the rules off or moves them to the
  sweep. A reader who wants the site to read as un-machine-like as
  possible would keep FigurativeIdioms and MicDrop on every run and
  accept the persistent hits.
- FormalTransitions is off because of "for example", but its "That's
  why" hits (four, all lessons) are the real thing. If someone wants
  them, the rule has no per-token switch; a House rule with just that
  token would do it.
- The semicolon question is now answered twice (Google.Semicolons for
  density, SemicolonUsage for the tacked-on clause). One could drop the
  Google rule from the sweep and keep only this one; this summary keeps
  both because they answer different questions.
