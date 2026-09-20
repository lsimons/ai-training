# ai-tells small rules report

Forty-four `ai-tells` rules with fewer than ten hits each, gathered
together. Gathering only: no verdicts, no classification, no rewrites.
The nineteen rules with ten or more hits have their own reports in this
directory. Rules are grouped by family; within a family, by hit count.

## Inputs

- `docs/prose/reports/ai-tells/ai-tells.json` filtered on
  `Check == "ai-tells.<Rule>"`.
- `docs/prose/reports/ai-tells/wordcount.tsv` for area lookup. Area word
  totals: lessons 12134, spec 13147, plan 15852, agent-docs 3200,
  repo-docs 3139, data 18534.
- `.vale/styles/ai-tells/<Rule>.yml` for rule definitions. Every rule
  below ships at `level: error`.

## Figurative verbs

### FigurativeKeeps

**Rule.** Three regex tokens: `keeps <det> <words> <state adjective>`
(cheap, green, lean, short, stable, reversible, ...), `keeps ... clear of|away from|off the`, and `keeps ... from mistaking|reading|thinking`.
The comment calls it "the upkeep frame: a mechanism credited with keeping
something in a state". Message: "Say what the mechanism does to the
thing, not what state it keeps it in."

**Stats.** 9 hits: spec 4, lessons 2, plan 2, agent-docs 1. Phrases:
`keep it short` (2), then one each. `docs/spec/S02-topic-map.md` has 2.

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:220` — "01. Keep the guardrail list short (about 5 rules in prose); carry the rest as"
- `docs/plan/explore/09-brilliant-skills-map.md:57` — "- INC-5 Keep change reversible"
- `docs/prose/report-template.md:36` — "Keep the whole report under 250 lines. Root-relative paths, no links."
- `docs/spec/S02-topic-map.md:299` — "| `ships-with-agent` | `keeps-change-reversible` | base | Keeps every change reversible |"
- `docs/spec/S02-topic-map.md:520` — "Engineering as a `building-agents` topic only. Leaning: keep a short"
- `docs/spec/S03-lesson-authoring.md:133` — "- A checkpoint's id is its section id. Authors keep section slugs stable"
- `docs/spec/S04-progress-record.md:98` — "| A lesson or checkpoint id changes | Its entries are orphaned and dropped silently on next load; keep ids stable |"
- `site/src/content/docs/customizing-agents/instructions.mdx:3` — "description: Write the one file a coding agent reads before it touches your project, and keep it short enough that it keeps working."
- `site/src/content/docs/using-agents/delegating.mdx:135` — "A learner sends "summarize the memo, keep it short" and gets three tidy"

Five of nine are imperatives in list items or table cells; `delegating.mdx:135`
is inside a quoted learner prompt; `instructions.mdx:3` is frontmatter.

### FigurativeDraws

**Rule.** Eleven regex tokens gated on the complement: `draws on|upon`,
`draws inspiration from`, `draws a distinction|parallel|comparison|line`,
`draws to a close`, and so on. "Literal drawing is everywhere ... so the
complement after the verb is the discriminator." Message: "Give the source
or the comparison directly. Disable this rule for art or card-game prose."

**Stats.** 8 hits, all spec. Phrases: `draws on topics` (6), `draws on one` (1), `draw on topics` (1). `docs/spec/S02-topic-map.md` has 7.

- `docs/spec/S01-dictionary.md:149` — "| **Competency** | Something a learner can *do*, stated as a verb phrase, for example *Verifies AI output before relying on it*. Draws on one or more topics, possibly across areas. Owns three to six learning objectives. | skill, capability, ability, topic |"
- `docs/spec/S02-topic-map.md:169` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:206` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:241` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:282` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:325` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:362` — "| Competency id | Statement | Draws on topics |"
- `docs/spec/S02-topic-map.md:502` — "Several competencies draw on topics from two areas. That's expected;"

Six hits are the same table-column header repeated once per area in S02;
the dictionary entry defines "Competency" with the same verb.

### FigurativeStays

**Rule.** Seven regex tokens gated on the complement: `stays clean|green|stable|visible|private|...`, `<det> <noun> stays <adjective>`, `stays out of the way`, `stays clear of`, `stays in the loop`. Message: "Say the item
is unchanged, or state what it avoids. Disable this rule for lodging or
travel prose."

**Stats.** 6 hits: spec 3, lessons 2, plan 1. Six distinct phrases; no
file has more than one.

- `docs/plan/README.md:86` — "| Repo visibility | Stays private until Leo explicitly decides it is ready. Going public is a separate, explicit decision, not tied to a milestone. |"
- `docs/spec/S01-dictionary.md:249` — "sidebar. Leaning: sidebar only; area slugs stay flat."
- `docs/spec/S02-topic-map.md:255` — "| `chooses-tool-and-autonomy` | `keeps-the-human-steps` | base | Names the steps that stay human and why |"
- `docs/spec/S05-spaced-review.md:50` — "| Pass | Item moves up one stage. Passing stage 5 retires the item (`done`); it stays visible in the learner's reference |"
- `site/src/content/docs/coding-with-agents/first-session.mdx:115` — "fixture stays clean."
- `site/src/content/docs/customizing-agents/instructions.mdx:97` — "Notice how short the output stays even with every box ticked. That's the"

### FigurativeWins

**Rule.** Twenty-three regex tokens for the contest frame (`wins the day`,
`a quick|easy|cheap win`, `quick|easy|cheap|early wins`, `wins out`,
`beats a|an|the|its|out|them`) plus eighteen exceptions for literal
winners (teams, players, candidates). The comment says the precedence
sense ("last write wins") was later added too. Message: "State the benefit or the outcome directly. Disable
this rule for sports or gaming prose."

**Stats.** 3 hits, all plan, one per file.

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:226` — "track?" beat an open chat."
- `docs/plan/explore/11-roadmap-sh.md:218` — "through and the milestone bar are the cheap wins."
- `docs/plan/explore/12-learn-prompting.md:153` — "asserted output is the right answer; a static recorded output beats a dead"

### FigurativeOwns

**Rule.** Seven regex tokens for possession as responsibility (`<det> <noun> owns <det>`, `owns its own`, `keeps their own understanding of`)
with 28 exceptions for concurrency and memory objects (locks, mutexes,
threads, buffers). Message: "Say which file defines it or which tool
writes it. Disable this rule for concurrency or memory prose."

**Stats.** 2 hits, both `docs/spec/S02-topic-map.md`.

- `docs/spec/S02-topic-map.md:30` — "An area owns three to seven topics and two to four competencies. A lesson"
- `docs/spec/S02-topic-map.md:301` — "| `ships-with-agent` | `keeps-understanding` | expert | Keeps their own understanding of the code as the agent produces more of it |"

### FigurativeSits

**Rule.** Twenty-two regex tokens gated on the complement: `sits at the intersection|core|heart of`, `sits somewhere between`, `sits squarely within`, `sits alongside|atop|astride`, `sits with`, `sits beside`, `sits in <det> <noun>` and so on. Message: "Use the literal relation: is at or
rests with. Disable this rule for furniture or geography prose."

**Stats.** 2 hits: spec 1, lessons 1.

- `docs/spec/S01-dictionary.md:142` — "learner can do afterwards; they sit beside the map and point into it."
- `site/src/content/docs/coding-with-agents/first-session.mdx:219` — "Everything you have said and everything the agent has read in this session" (the match `this session\nsits in` continues on line 220)

### FigurativeSurfaces

**Rule.** Four regex tokens: `surfaces|surfaced <object>` with a long
lookahead refusing prepositions and the noun senses, `<defect noun> surfaces`, `nothing surfaced`, and `<modal> surface`. Message: "Say what
reported the problem and when. Disable this rule for marine or graphics
prose."

**Stats.** 2 hits, both spec, same phrase `surfaces extensions`.

- `docs/spec/S01-dictionary.md:122` — "| `more` | Offers a skills check at the start of a lesson (one checkpoint per served objective), skips objectives already passed, surfaces extensions. |"
- `docs/spec/S02-topic-map.md:472` — "| Comfort level `more` | Offers a skills check at the start of a lesson (one checkpoint per served objective), skips what's passed, surfaces extensions. |"

Both are the definition of the `more` comfort level, in table cells.

### FigurativeDisguises

**Rule.** Fourteen regex tokens for the substitution frame: `dressed up as`, `disguised as`, `masquerading as`, `poses as`, `pretends to be`, `in disguise`, `under the guise of`. Message: "State what the thing is, then
say how it differs from what it resembles. Disable this rule for security,
forensics, or costume prose."

**Stats.** 1 hit, spec.

- `docs/spec/S03-lesson-authoring.md:106` — "("the transcript is illustrative..."). A block that pretends to be a"

### FigurativeLands

**Rule.** Six regex tokens for figurative arrival (`<subject> lands on|in`,
`lands a`, `landed in main`) with 70 exceptions for things that literally
land (planes, birds, snow, ...). Message: "Use the literal action: is
merged or is routed to. Disable this rule for aviation or nature prose."

**Stats.** 1 hit, agent-docs.

- `docs/prose/README.md:36` — "4. The maintainer decides. The decision lands in the table below and in the"

### FigurativeNouns

**Rule.** Seventeen regex tokens for the figure carried by a noun rather
than a verb: `reach` as a retrieval path, `wrinkle`, `story` as a design,
`knob`, `surface` as a UI or product area, and others. Message: "Say what
concrete thing it stands for."

**Stats.** 1 hit, plan.

- `docs/plan/explore/11-roadmap-sh.md:129` — "Every AI surface carries "AI can make mistakes, verify important"

### FigurativeQuantities

**Rule.** Forty-nine plain tokens for quantity by metaphor: `a handful`,
`a boatload of`, `a flood of`, `a plethora of`, `a myriad of`, `how far ... may go`. Message: "Give the count, or write 'a few' or 'many'."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/using-agents/delegating.mdx:145` — "A brief says what to do. It doesn't yet say how far the agent may go"

## Bare verbs

### BareHolds

**Rule.** Five regex tokens for the plain container sense of `hold` with
an inanimate subject (`<det> <noun> holds <object>`, `holds only|every|no <noun>`, `whatever the store holds`) plus 58 exceptions for hands, arms,
people, courts, and idiom complements. The comment says FigurativeHolds
gates on idioms and this rule takes what a corpus audit found as "133
occurrences of 'hold' with an inanimate subject, every one of them
'contains,' 'stores'". Message: "Say what it contains or stores. Disable
this rule for concurrency or physical-object prose."

**Stats.** 6 hits: lessons 4, spec 1, agent-docs 1. Phrase `holds only what differs` (2). `customizing-agents/instructions.mdx` has 2.

- `docs/agents/writing-a-lesson.md:86` — "and fails if its stdout isn't `answer`. The file holds the complete,"
- `docs/spec/S04-progress-record.md:21` — "the record tracks passes on the honor system; it holds no secrets."
- `site/src/content/docs/coding-with-agents/first-session.mdx:128` — "You now hold three concrete things: the file with the bug, the test that"
- `site/src/content/docs/customizing-agents/instructions.mdx:191` — "file holds only what differs: its own test command, its own language, its"
- `site/src/content/docs/customizing-agents/instructions.mdx:251` — "file holds only what differs; closer wins."
- `site/src/content/docs/safety/agent-risk.mdx:94` — "that holds only the files in question. If it deletes the wrong thing, you"

`S04-progress-record.md:21` is also a NegatedObject hit (below).

### BareReaches

**Rule.** Four regex tokens for the arrival sense of `reach` with an
inanimate subject (`<det> <noun> reaches <object>`, `can reach`, `never reaches`) plus 44 exceptions for people, limbs, and physical movers.
Message: "Say which step handles it, or where it is sent. Disable this
rule for transit or physics prose."

**Stats.** 5 hits: lessons 4, spec 1. Phrase `an action can reach` (2).
`safety/agent-risk.mdx` has 4.

- `docs/spec/S02-topic-map.md:223` — "| `judges-agent-risk` | `names-blast-radius` | base | Names what an agent action can reach and break |"
- `site/src/content/docs/safety/agent-risk.mdx:29` — "habits for deciding how far to let it: naming what an action can reach,"
- `site/src/content/docs/safety/agent-risk.mdx:84` — "Once you have named what an agent *can* reach, the obvious move is to make"
- `site/src/content/docs/safety/agent-risk.mdx:135` — "scratch space is yours to review afterwards. An action that reaches another"
- `site/src/content/docs/safety/agent-risk.mdx:291` — "2. Blast radius is what an action *can* reach and change with the access it has, not what you asked for. Say it out loud in its uncomfortable form."

All five are the lesson's "blast radius" definition and its recap and
objective restatements.

## Negation

### NegatedObject

**Rule.** Nine regex tokens for a transitive verb with `no` or `zero`
moved onto its object: `allows|offers|provides|requires no <noun>`, `makes no <noun>`, `performs|runs|emits|logs no <noun>`, `holds|keeps|leaves|needs no <noun>`, `<verb>s nothing`, `absolutely|virtually no`, `ships with no|zero`. The comment: "the construction is grammatical English, but
AI prose reaches for it constantly because it sounds like a spec clause".
Message: "Negate the verb with 'doesn't' instead of shifting 'no' onto
the object."

**Stats.** 9 hits: plan 5, lessons 2, spec 2. Nine distinct phrases; one
per file.

- `docs/plan/README.md:46` — "| `ai-deep-learning` | DeepLearning.AI, paid | Inspiration for topic coverage and sequencing only. Embed nothing. |"
- `docs/plan/explore/04-anthropic-academy.md:108` — "`academy.claude.com/courses/<slug>` URLs, which need no partner account. Do"
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:148` — "papers but capture no URLs; fetch from outside if needed."
- `docs/plan/explore/09-brilliant-skills-map.md:120` — "yields nothing checkable until the end pushes all learning to the most"
- `docs/plan/explore/12-learn-prompting.md:70` — "now show nothing. Around 2024 they also introduced `<AIInput>` and"
- `docs/spec/S04-progress-record.md:21` — "the record tracks passes on the honor system; it holds no secrets."
- `docs/spec/S05-spaced-review.md:85` — "Check records a pass. A wrong Check records nothing yet: the learner"
- `site/src/content/docs/coding-with-agents/first-session.mdx:164` — "zero-based index, so it needs no change."
- `site/src/content/docs/concepts/how-models-work.mdx:146` — "scores; temperature reshapes the distribution and adds nothing."

## Anthropomorphism

### AnthropomorphicJustification

**Rule.** 126 plain and regex tokens for merit verbs and effort clichés
applied to a mechanism: `pays for itself`, `pays dividends`, `pulls its weight`, `punches above its weight`, `declares|announces|proves|reports itself`, `does the work`, `does most of the work`, `<det> <noun> hands the|a|it`. Message: "AI cliché: '%s'. Say
what you mean directly."

**Stats.** 3 hits: lessons 2, agent-docs 1.

- `docs/prose/README.md:64` — "| proselint | `Needless` | Now and then | 352 swap pairs with zero hits: untested, so it proves itself first |"
- `site/src/content/docs/safety/agent-risk.mdx:144` — "does most of the work and you spend a few seconds on each of the two or"
- `site/src/content/docs/using-agents/delegating.mdx:155` — "does the work and you check the outcome."

In both lesson hits the subject of "does the work" is the agent.

### AnthropomorphicAdjectives

**Rule.** Two regex tokens for character grades on a mechanism: `<det> <noun> benign|brittle|noisy|generous|healthy` and `is|are|remains|stays benign|brittle|noisy|generous|healthy|honest`. Message: "Say what the
thing does or measures instead of grading its character. Disable this
rule for medical or community prose."

**Stats.** 1 hit, plan.

- `docs/plan/explore/05-career-model-and-deeplearning-ai.md:70` — "prerequisites, no stable IDs (display-name paths are brittle), levels are prose"

## Metaphor families

### EnforcementMetaphors

**Rule.** Twenty-one regex tokens for a check presented as a sentry:
`stands down`, `<gate|guard|hook> is armed`, `keeps its teeth`,
`toothless`, `polices`, the verb `gates|gated|gating <det>|on|behind|by`,
`to gate`, and `<check|gate|rule> floods`. Message: "Say what the
check refuses or allows. Disable this rule for security or law-enforcement
prose."

**Stats.** 2 hits: spec 1, plan 1.

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:100` — "artifact, textarea gated on 10+ chars, "Reveal model answer" shows model"
- `docs/spec/S02-topic-map.md:384` — "| `runs-in-production` | `gates-on-evals` | base | Gates a deploy on evaluation results |"

### MotionMetaphors

**Rule.** Fifteen regex tokens (plus sixteen exceptions for people and
animals) for motion and force verbs on data or control flow: `feeds`,
`strands`, `swamps`, `dwarfs`, `leans on`, `baked in`, `crowds out`,
`drives the`, `shapes the`, `cracks open`. Message: "Use the literal
operation: is passed to, or depends on."

**Stats.** 1 hit, agent-docs.

- `docs/prose/README.md:7` — "Every Markdown file in the repository shapes the Markdown written after it:"

## Consequence tails

### ConsequenceClause

**Rule.** One regex token: `, so <det> <full-noun subject> <present-tense verb>` with a lookahead refusing auxiliaries and pronouns, so only a
fresh-subject inference clause matches. The comment: "Every sentence
justifies itself and no fact is left for the reader to draw a conclusion
from." Message: "End the sentence before the comma and state the effect as
its own claim."

**Stats.** 3 hits: lessons 1, spec 1, plan 1.

- `docs/plan/README.md:35` — "Anthropic and is unlikely to maintain the upstream, so the fork becomes a"
- `docs/spec/S05-spaced-review.md:32` — "answer, or alternative option orders, so a review tests the idea rather"
- `site/src/content/docs/guides/writing-pages.md:45` — "(`/ai-training`) at render time, so the same Markdown works in local"

### ConsequenceParticiple

**Rule.** Four regex tokens for a comma plus a present participle that
restates the clause's effect: `, leaving|giving|letting|forcing|saving|turning|ensuring|preventing <det>`, `, making it|them|the`, `, meaning (that) the`, `, resulting in|leading to <det>`. Message: "End the sentence
there and state the effect as its own claim."

**Stats.** 2 hits, both spec, both `, leading to the`.

- `docs/spec/S02-topic-map.md:93` — "| Review due card | "Review due: N items" when review items are due, leading to the course's review page |"
- `docs/spec/S05-spaced-review.md:69` — "| Course page | A "Review due: N items" card above the lesson graph when N > 0, leading to the review page for that course. Also a small count in the sidebar group header. |"

Both describe the same review-due card, in table cells, where "leading
to" names the link target.

## Explainer framing

### ExplainerHeadings

**Rule.** `scope: heading`, `ignorecase: true`. Fourteen tokens: the regex
`what|why|how|when|where|who <det> <word> <word>` plus plain phrases `Deep Dive`, `Under the Hood`, `Demystifying`, `Why It Matters`, `Why This Matters`, and similar. Message: "AI explainer heading: '%s'. State the
topic instead."

**Stats.** 5 hits: lessons 2, spec 1, plan 1, agent-docs 1. One per file.

- `docs/plan/explore/08-diataxis.md:1` — "# Exploration 08: Diátaxis, and what this project takes from it"
- `docs/prose/README.md:12` — "## Where a rule can go"
- `docs/spec/S06-release-1.md:38` — "## What every slice lesson has"
- `site/src/content/docs/concepts/how-models-work.mdx:68` — "## Where the scores come from"
- `site/src/content/docs/safety/agent-risk.mdx:177` — "## Prompt injection: when the data gives orders"

All five are headings, as the scope requires; one is a page title (H1).

### ExplainerLeads

**Rule.** `scope: ~heading` (everything except headings). Three regex
tokens: `Here's|This is|That's (exactly) what|why|how <det> <word> <word>`,
`What|Why|How <det> ...` followed by a colon, and `What|Why|How <det> <words> is|are`. Message: "State the point directly instead of announcing
it."

**Stats.** 2 hits: spec 1, lessons 1.

- `docs/spec/S02-topic-map.md:164` — "| `concepts/what-is-an-agent` | What an agent is | model vs agent, tool, agent loop, degree of autonomy, harness | prompting, limits | `AEC-01`, usable for knowledge workers as is; `DLAI-11` M1 |"
- `site/src/content/docs/safety/agent-risk.mdx:213` — "That's why the defenses from earlier in this lesson are the right ones"

The spec hit is a topic title in a table cell.

## Filler and padding

### FillerIntensifier

**Rule.** Five regex tokens: `a|one|every|this|no|any single`, `any one`,
`the single` (except `the single most important`), `<det> lone|sole|solitary|mere`, `<det> singular`, each refusing a following hyphen.
Message: "Delete the intensifier. The determiner already states the
count."

**Stats.** 3 hits: lessons 2, spec 1. Phrases `a single` (2), `the single` (1).

- `docs/spec/S05-spaced-review.md:86` — "may retry or Give Up, and Give Up records the single fail. Once a"
- `site/src/content/docs/customizing-agents/instructions.mdx:41` — "it, or to have one contain a single line pointing at the other."
- `site/src/content/docs/safety/agent-risk.mdx:88` — "For the mailbox agent: read-only access to a single folder, or the ability"

### FillerPhrases

**Rule.** Sixty-seven plain tokens, `ignorecase: true`: `a wide range of`,
`a variety of`, `countless`, `numerous`, `in order to`, `serves to`,
`tends to`, `has the ability to`, `honestly,`, `honestly?`, and so on. Message: "Delete this phrase. The
sentence reads the same without it."

**Stats.** 2 hits: spec 1, lessons 1.

- `docs/spec/S02-topic-map.md:306` — "| `works-in-team` | `attributes-honestly` | base | Attributes agent work honestly in commits and reviews |"
- `site/src/content/docs/customizing-agents/instructions.mdx:221` — "way for a procedure the agent tends to forget. And when a rule isn't a"

The spec hit is a learning-objective statement in a table cell where
"honestly" is the objective's content, mirrored in its slug.

### EmptyPadding

**Rule.** `extends: sequence`, `ignorecase: true`. Two tokens: the word
`various|certain|respective|given|particular` followed by a part-of-speech
tag `NN|NNS` (a noun). The comment notes `named` moved to NamedAdjective.
Message: "AI empty modifier: '%s %s'. Delete the modifier and keep the
noun."

**Stats.** 2 hits: spec 1, lessons 1.

- `docs/spec/S05-spaced-review.md:134` — "2. Whether Foundations courses should review at all, given knowledge-worker"
- `site/src/content/docs/using-agents/delegating.mdx:30` — "depends on a particular product."

In the spec hit "given" is the preposition opening a reason clause
("given knowledge-worker time"), tagged by the sequence rule as a
modifier on the following noun.

## Rhythm and sentence shape

### MicDrop

**Rule.** Sixty-two regex tokens, `nonword: true`, for a short clipped
sentence used as a closing beat: `It|This|That matters|works|scales|compounds.`, `It's by design|on purpose.`, `Nothing is accidental.`,
`Full stop.`, `And it works.`, and the fragment forms that fired here:
`Not? <word>.` ("No backend."), `<Cap>, not <word>.` ("Hints, not
answers."), and `One|Single|Zero|Clean|... <word>, <adjective> <word>.`
("One path, no alternatives."). Message: "Integrate the point into the
surrounding text or cut it."

**Stats.** 9 hits: spec 6, lessons 1, plan 1, agent-docs 1. Phrases:
`hints, not answers.` (2), `no variants.` (2), then one each.
`docs/spec/S01-dictionary.md` has 4.

- `.claude/skills/tutor/SKILL.md:12` — "- **Hints, not answers.** Never give the answer to a checkpoint or exercise."
- `docs/plan/README.md:87` — "| Learner progress | Browser local storage plus export/import of a JSON file. No backend. |"
- `docs/spec/S01-dictionary.md:39` — "| `tutorial` | action, study | yes (lesson) | yes | The learner does something and sees results early and often. One path, no alternatives. Minimal explanation, link out instead. |"
- `docs/spec/S01-dictionary.md:41` — "| `how-to` | action, work | no | no | A recipe for an already competent learner toward a real goal. May branch. No checkpoints. Title starts with "How to". |"
- `docs/spec/S01-dictionary.md:102` — "confident learners. No variants."
- `docs/spec/S01-dictionary.md:206` — "| **Tutor** | Claude acting in tutor mode inside Claude Code, with the site running locally. Hints, not answers. See "Tutor verbs". | assistant, duck, bot |"
- `docs/spec/S02-topic-map.md:473` — "| Exercise | One per lesson, written once, ending with an optional one-line stretch goal. No variants. |"
- `docs/spec/S03-lesson-authoring.md:74` — "- **One path, no choices.** Differentiation happens through routing between"
- `site/src/content/docs/coding-with-agents/first-session.mdx:257` — "5. One task, one session. Reset the fixture and start fresh."

Six of nine are in table cells (dictionary and spec tables); two are
bolded list-item leads; the lesson hit is a numbered recap item.

### StackedAnaphora

**Rule.** Fifty-three regex tokens for repeated sentence or clause
openers: `No X. No Y. No Z`, `No X, no Y, no Z`, `Not X. Not Y.`, `One X, one Y, one Z`, `Every X, every Y`, `An X that ... An X that ...`, and
similar. Message: "Vary the sentence openings or combine into one
statement."

**Stats.** 7 hits: lessons 3, spec 3, agent-docs 1. Seven distinct
phrases; `S01-dictionary.md` and `agent-risk.mdx` have 2 each.

- `docs/agents/writing-a-lesson.md:47` — "evidences. One `<Pitfall>`, one `<Exercise>`, one `<Recap>`" (match continues "at the end" on line 48)
- `docs/spec/S01-dictionary.md:18` — "This spec is the project dictionary. Every other spec, every page, every" (match continues "frontmatter field and every component name uses these terms" on line 19)
- `docs/spec/S01-dictionary.md:52` — "| **Group** | One of two top-level sidebar groups: **Foundations** (for everyone, one level) and **Engineering** (for software engineers, two comfort levels). | part, half, tier |"
- `docs/spec/S05-spaced-review.md:108` — "- No server, no notifications, no email. A learner who doesn't come back is"
- `site/src/content/docs/coding-with-agents/first-session.mdx:257` — "5. One task, one session. Reset the fixture and start fresh."
- `site/src/content/docs/safety/agent-risk.mdx:134` — "**Who else does it touch?** An action that only changes the agent's own" (match spans lines 134-136: "An action that only changes ... An action that reaches another person, a customer, a shared system or money is one to approve beforehand")
- `site/src/content/docs/safety/agent-risk.mdx:197` — "reason as before: hands. An assistant that reads a hostile page might give" (match spans lines 197-199: "An assistant that reads a hostile page ... An agent that reads a hostile page and has your mailbox might send your mail somewhere")

`first-session.mdx:257` is also a MicDrop hit. `S01-dictionary.md:52`
matched on "One of two ... one level ... two comfort levels" inside a
table cell.

### ParallelStaccato

**Rule.** Eight regex tokens, `nonword: true`, for two consecutive
two-or-three-word sentences (`<Cap> <word>. <Cap> <word>.`, `The <word> <word>s. The <word> <word>s.`) and for a clause followed by `<Noun> doesn't.` or `<Noun> does not.`. Message: "Combine these clipped parallel
sentences or vary the structure."

**Stats.** 3 hits: lessons 1, spec 1, agent-docs 1.

- `docs/prose/report-template.md:23` — "2. **Stats.** Total hits. A table per area: hits, words, hits per thousand"
- `docs/spec/S01-dictionary.md:41` — "| `how-to` | action, work | no | no | A recipe for an already competent learner toward a real goal. May branch. No checkpoints. Title starts with "How to". |"
- `site/src/content/docs/concepts/how-models-work.mdx:53` — "Two things to notice. The distribution is fixed by the input; only the" (match spans lines 53-55: "The distribution is fixed by the input; only the pick is random. And temperature doesn't add knowledge, it only flattens or sharpens the same distribution.")

`S01-dictionary.md:41` is also a MicDrop hit.

### CoordinatedReveal

**Rule.** Five regex tokens for a claim restated after `, and` with a
totality word: `reverses|flips|inverts ... , and`, `, and <det> <noun> never|always|only ever <verb>`, `, and only the|a`, `, and nothing else|but|more`, `every <noun> that <verb>s it`. Message: "The totality word
replaces a contrast the sentence never states. Say what it rules out, or
drop the word."

**Stats.** 2 hits: lessons 1, agent-docs 1.

- `docs/prose/README.md:55` — "| write-good | Cliches | Every run | Rare, and a hit is nearly always worth a rewrite |"
- `site/src/content/docs/using-agents/delegating.mdx:78` — "Here that's easy: the memo, pasted in full, and nothing else. State it"

### PseudoCleft

**Rule.** Six regex tokens for a free relative as subject plus copula:
`What you|we get|see is <det>`, `What changed|changes|remains is`, `All you need is`, `All you do is`, `The only thing that changes is`, `Where this pays off is`. Message: "Put the claim first as its own sentence and
delete the 'What ... is' frame."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/safety/agent-risk.mdx:42` — "What changes is what happens next. An assistant's output goes to you. An"

### EmphaticCopula

**Rule.** `scope: raw`, `nonword: true`. Twenty-eight regex tokens for a
single-asterisk or underscore italic on one of fourteen common words:
`is`, `are`, `was`, `were`, `the`, `and`, `not`, `or`, `actually`,
`really`, `never`, `always`, `truly`, `literally`, each as `*x*` and
`_x_`. Message: "Remove the italics. Emphasizing a common word rarely
adds meaning."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/using-agents/delegating.mdx:69` — "*not* do carries as much weight as what it must do, and why "summarize this""

The italic `*can*` spans in `agent-risk.mdx:84` and `:291` (see
BareReaches) did not fire; `can` is not in the list.

## Vocabulary

### OverusedVocabulary

**Rule.** 168 plain tokens, case-sensitive, described in the comment as
the "miscellaneous vocabulary bucket" of single words no phrase rule
owns: `delve`, `robust`, `notably`, `dynamic`, `dynamically`, `genuine`,
`genuinely`, `underscores`, `intricacies`, `groundbreaking`,
`seamlessly`, `streamline`, and so on.
Message: "Replace with a more specific or common word."

**Stats.** 8 hits: plan 7, repo-docs 1. Phrases: `dynamically` (2), then
`genuinely`, `notably`, `genuine`, `dynamic`, `robust`, `delve` (1 each).
`06-lesson-inventory.md` has 3.

- `AGENTS.md:188` — "genuinely broken."
- `docs/plan/explore/02-agent-engineer-course.md:59` — "Exercise", "Try it yourself", notably lessons 12 and 13)."
- `docs/plan/explore/02-agent-engineer-course.md:76` — "- Builds the lesson list dynamically from frontmatter, not hardcoded."
- `docs/plan/explore/06-lesson-inventory.md:46` — "| 15 | `15-agents-md.md` | AGENTS.md contents, monorepo hierarchies, comparison, full example | 2.6k, 15 m | 5, 4 | Engineer | `agents-md-builder` (genuine authoring tool, best widget to carry over); **try-it exercise** |"
- `docs/plan/explore/06-lesson-inventory.md:80` — "- Lesson list discovered dynamically from frontmatter; never hardcoded."
- `docs/plan/explore/06-lesson-inventory.md:95` — "Transfers directly to ai-training tutor mode: dynamic discovery, hint ladder,"
- `docs/plan/explore/12-learn-prompting.md:29` — "knowledge, 🟣 robust domain expertise) in every page title. It is the"
- `docs/plan/explore/12-learn-prompting.md:92` — ""delve", a "Conclusion" paragraph that restates the page, a Pitfalls page"

`12-learn-prompting.md:92` quotes the word "delve" while listing AI tells
observed in the source material; `12-learn-prompting.md:29` quotes a
source site's own label.

### NounString

**Rule.** `extends: sequence`. Five tokens: a negated anchor followed by
four consecutive `NN|NNS`-tagged words (excluding `yesterday`, `today`,
`tomorrow`, `tonight`). The comment: "three-noun compounds saturate
technical prose ('config file path')", so the line sits at four. Message:
"Rewrite the stack as a phrase that shows how the nouns relate."

**Stats.** 4 hits: spec 2, plan 2. One per file.

- `docs/plan/explore/04-anthropic-academy.md:101` — "| Customizing agents | Intro to agent skills, Intro to subagents, Intro to MCP | MCP advanced topics; API course prompt engineering section |"
- `docs/plan/explore/09-brilliant-skills-map.md:99` — "- SEC-5 Assess and manage software supply-chain risk"
- `docs/spec/S02-topic-map.md:117` — "| `Learn Prompting` | The community prompt engineering guide | CC BY-NC-SA 4.0 (current) | Vocabulary only; prompting concepts are written from the original papers |"
- `docs/spec/S05-spaced-review.md:92` — "A header progress bar counts items in this session."

Two matches include a tagged verb (`manage`, `counts`) inside the
four-word window (`and manage software supply-chain risk`, `a header progress bar counts`).

### HouseStyle

**Rule.** `extends: substitution`, `action: replace`, `ignorecase: true`.
Nine swap pairs replacing the `house` compound with `project`: `house style(s)`, `house tic(s)`, `house formula(s)`, `house voice`, `house idiom(s)`. The comment: "Agent prose picks up the figure whenever it
writes about a repo's rules, this repository's own comments included."
Message: "AI house compound: use %s instead of '%s'."

**Stats.** 2 hits: repo-docs 1, agent-docs 1.

- `AGENTS.md:167` — "but never fail the build; they're the house style, adopted from the"
- `docs/prose/README.md:74` — "| Google | `Will` | Every run | Present tense is the house voice; the lessons and specs were rewritten. Quoted product text in the notes keeps its `will` |"

The project's own Vale style directory is named `House`
(`.vale/styles/House/`); Vale masks code spans, so `House.Quotes` in
backticks never fires.

### HedgingPhrases

**Rule.** Seventy-one plain tokens, `ignorecase: true`: `It's important to note that`, `It is essential to understand`, `It is crucial to note`,
`It is critical to recognize`, `As such`, and so on. Message: "Delete this throat-clearing and state your
point directly."

**Stats.** 2 hits, both spec, both `as such`.

- `docs/spec/S01-dictionary.md:66` — "| **Prompt block** | A prompt shown to the learner, paired with a **response block** holding the recorded model response; both name the model and the month recorded. In release 1 both may instead be marked `illustrative`: written by the author, labeled as such by the component and in the page's prose. | chat transcript, example |"
- `docs/spec/S03-lesson-authoring.md:93` — "marked as such in the page. Until the example runner exists the rule still"

In both, "as such" is the anaphoric "labeled/marked as such" (as
illustrative), not the sentence-initial hedge.

### SycophancyMarkers

**Rule.** Twenty plain tokens, `ignorecase: true`: `Great question`, `I'm glad you asked`, `Absolutely`, `Certainly`, `Of course`, and similar.
Message: "Delete this. It sounds robotic and insincere."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/using-agents/delegating.mdx:60` — "decent one. Almost certainly not this format, and you have no way to"

### ColloquialAssessments

**Rule.** Twenty-five regex tokens, `nonword: true`: `the joke|point|argument|... lands`, `really|actually lands`, `lands flat`, `where it lands`, `the obvious move`, and similar. Message:
"State the assessment directly."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/safety/agent-risk.mdx:84` — "Once you have named what an agent *can* reach, the obvious move is to make"

### AffirmativeFormulas

**Rule.** Sixty-three regex tokens, case-sensitive, for the closing
flourish: `And that's the beauty of it`, `Here's the kicker`, `The key insight is`, `The lesson (here) is ...`, `Let that sink in`, `The truth is`, `Pro tip`, `Hot take`, and similar. Message: "Cut the flourish and
state the point plainly."

**Stats.** 1 hit, spec.

- `docs/spec/S05-spaced-review.md:19` — "growing intervals after the lesson is finished, take a few minutes, and are" (match continues "the only mechanism that brings a learner back to old material" on line 20)

The token that fired is `[Tt]he lesson (?:here )?is [^.!?]+`, which
reads to the next sentence end; here "the lesson" is the project's noun
for a page, and the span is the rest of the sentence after it.

## Discourse and metacommentary

### SelfReference

**Rule.** Forty-six plain tokens, `ignorecase: true`: `as mentioned above`, `as noted earlier`, `as discussed before`, `as we saw`, `as we'll see`, `recall that`, `remember that`, and similar. Message: "Rewrite the passage to work
without the cross-reference."

**Stats.** 2 hits: lessons 1, plan 1, both `remember that`.

- `docs/plan/explore/10-execute-program.md:89` — "blank answer. Remember that the SELECT statement returns the rows from the"
- `site/src/content/docs/safety/agent-risk.mdx:269` — "Then remember that everything the agent reads is an input it might treat as"

The plan hit quotes a source course's exercise text.

### SequencingMarkers

**Rule.** Thirty-six plain tokens, case-sensitive: `Firstly`, `Secondly`,
`Lastly`, `The first takeaway`, `The first lesson`, `The second lesson`,
`The first step is`, and so on. Message: "Use natural transitions or
write an actual list."

**Stats.** 2 hits: plan 1, agent-docs 1.

- `docs/plan/explore/04-anthropic-academy.md:65` — "Documented in `docs/spec/001-lesson-page.md`, section "The second lesson kind:"
- `docs/prose/README.md:78` — "| Google | `Acronyms` | Every run, lessons only | The first lesson to say MCP or RAG should define it. Acronyms this audience knows are in `accept.txt`; the notes' skill codes aren't acronyms |"

In both, "lesson" is the project's noun for a page, not an ordinal
transition; the plan hit is a quoted section title.

### StructureAnnouncements

**Rule.** Sixteen plain tokens, `ignorecase: true`: `key takeaway(s)`,
`main takeaway(s)`, `the takeaway (here) is`, `(a) quick recap`, `to recap (briefly)`, `(a) quick summary`, `(a) quick overview`, `to put it plainly`, `to put this in perspective`.
Message: "Present the content instead of narrating that you're about to."

**Stats.** 1 hit, plan.

- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:63` — "Key Takeaways, Complete. No Watch Out screens."

The hit is a screen name listed from the source SCORM package.

### Metacommentary

**Rule.** `scope: raw`, `nonword: true`. Sixty-four regex tokens: `This <noun> matters.`, `This matters because`, `This is important because`,
`This distinction matters`, `Think of it|this as`, and the open form
`Think of <X> as <Y>.`, and similar. Message: "Delete it or
replace it with substantive content."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/customizing-agents/instructions.mdx:43` — "Think of the file as the briefing you would give a capable contractor on" (match continues "their first morning." on line 44)

### PointVerdict

**Rule.** Two regex tokens: a copula followed by `the (whole|entire|very|real|only) point` (refusing `what|which|why` before it), and `The whole|entire point of|is`. Message: "Say what the thing does or what it is for
instead of grading it as the point."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/safety/agent-risk.mdx:79` — "The second phrasing is uncomfortable. That's the point; it tells you what"

### AbstractionSubject

**Rule.** Three regex tokens: `This|That|These|Those asymmetry|tension|gap|split|distinction|inversion|coupling|... is|buys|costs|...`. The
comment: "the prior sentence compressed into an abstract noun with a
demonstrative on it, and that noun made the subject of a comment".
Message: "State what the demonstrative stands for, then say what it
does."

**Stats.** 1 hit, lessons.

- `site/src/content/docs/using-agents/delegating.mdx:61` — "say whether it is right except that it reads well. That gap is what a brief"

## Rules with zero hits

Of the 137 rule files in `.vale/styles/ai-tells/`, 63 produced at least
one hit and 74 produced none. The 74, by family:

**Figurative verbs (22):** FigurativeBreeds, FigurativeCasts,
FigurativeClears, FigurativeDemands, FigurativeEarns, FigurativeFalls,
FigurativeFires, FigurativeHolds, FigurativeLends, FigurativeLoud,
FigurativeMints, FigurativePays, FigurativeQuiet, FigurativeReaches,
FigurativeRides, FigurativeRuns, FigurativeSees, FigurativeSettles,
FigurativeStrikes, FigurativeSweeps, FigurativeTravels, FigurativeTrips.

**Metaphor families (6):** DepletionMetaphors, EvasionMetaphors,
FusionMetaphors, GrowthMetaphors, JourneyMetaphors, MortalityMetaphors.

**Headings (4):** AnnouncementHeadings, MarketingHeadings,
MicDropHeadings, WrapUpHeadings.

**Siblings of rules that did fire (6):** EmptyPaddingStacked,
NegatedPair, OverusedVocabularyVerbs, StackedHedges, UniversalObject,
VerbTricolonDensity.

**Vocabulary and puffery (9):** AIAdjectiveNounPairs, AICompoundPhrases,
PromotionalPuffery, StrategyBuzzwords, ResonateOveruse, UnpackExplore,
UrgencyInflation, AbsoluteAssertions, VagueAttributions.

**Discourse markers and openers/closers (10):** ClosingPleasantries,
ConclusionMarkers, ListIntroductions, OpeningCliches, RestatementMarkers,
NarrativePivots, HollowAcknowledgment, RhetoricalDevices,
RhetoricalSelfAnswer, SummativeAppositive.

**Hedging and contrast (7):** DefensiveHedges, DespiteChallenges,
FalseBalance, FalseExclusivity, IncompleteComparison, StrawmanContrast,
RedundantPrecaution.

**Sentence shape and syntax (8):** NamedAdjective,
NominalizedScopeChange, OrganicConsequence, ParticipialPadding,
ScopePartition, ServesAsDodge, ShellNounCopula, UnderRegime.

**Punctuation (2):** DoubleHyphen, EmDashUsage.
