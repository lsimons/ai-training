# Exploration 09: Brilliant's coding skills map and standards alignment

Captured 2026-09-19. Sources, all Brilliant Worldwide, Inc., proprietary:

- <https://brilliant.org/coding-skills/>: the interactive skills map. Its
  data is embedded in the page as JSON (`__NEXT_DATA__`, keys `aiTiers`,
  `foundationsTiers`, `aiSkillTitles`), which is how the outline below was
  read.
- <https://brilliant.org/help/schools-and-educators/brilliant-for-educators-standards-alignment/>
- <https://brilliant.org/help/schools-and-educators/differentiation-guide/>
- <https://brilliant.org/help/schools-and-educators/how-brilliant-fits-into-a-math-lesson/>
- <https://brilliant.org/help/standards-alignment/common-core-math-coverage/>

Use: shape, structure and vocabulary as inspiration, with citation. Codes and
titles are quoted here as facts for research. The skill panel texts are
Brilliant's prose and must not be copied into the site.

## 1. The coding skills map

Marketing framing: "designed for college students, early-career
professionals, and ambitious beginners". Two halves: **Foundations of
Computer Science** (7 big ideas, 42 learning objectives, 196 skills) and
**Coding with AI** (7 big ideas, 37 learning objectives, 106 skills).

### Four-level shape

| Level              | Form                                                                                                             | Example                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Tier               | A named band on the map with a one-paragraph note. Three per half.                                               | "The build loop"                                                                                                               |
| Big idea (pillar)  | A **noun phrase** with a three-letter code and a one-sentence summary of why it matters now.                     | VER "Verification": generation is cheap, so verification is the new bottleneck                                                 |
| Learning objective | A **verb phrase** with a numbered code, 2 to 8 per big idea.                                                     | INC-2 "Sequence increments for early feedback"                                                                                 |
| Skill              | A **declarative claim** (one sentence), a **why** paragraph, and one concrete **example**. 2 to 6 per objective. | Under INC-2: "Steps are ordered so that each one can be checked on its own", why, then the add-item-before-remove-item example |

The map draws big ideas as boxes in tier bands; clicking one lists its
objectives; clicking an objective opens the skill panel. Cross-references
appear inside skill text ("the same judgment about relevant information from
SPC-5, applied at the moment work is handed off"), so codes are used as
citations between nodes. No prerequisites, levels or grades are encoded.

### Coding with AI: full outline

Tier **The governing practices**: development should be informed by judgment
about what's worth building and guided by building in shippable increments.

- **TAS Taste, what's worth building.** As building gets cheap, deciding
  what's worth building and what a good result is comes first.
  - TAS-1 Judge an idea using relevant information and domain knowledge
  - TAS-2 Determine what a successful outcome requires
  - TAS-3 Weigh value against cost and alternatives
  - TAS-4 Decide under uncertainty
- **INC Developing Incrementally.** Incremental, verifiable development keeps
  understanding and coherence over work increasingly produced by AI.
  - INC-1 Develop in working increments
  - INC-2 Sequence increments for early feedback
  - INC-3 Maintain understanding of what's being developed
  - INC-4 Maintain architectural coherence across increments
  - INC-5 Keep change reversible

Tier **The build loop**: every piece of work needs specification,
implementation and verification; as AI takes implementation, human skill
concentrates in specifying, verifying and designing workflows, and then one
level up: specifying how to specify, delegate, and verify.

- **SPC Specification & Design.** Framing the problem and defining success,
  including how it gets verified, before anything is built.
  - SPC-1 Design how users will interact with the artifact
  - SPC-2 Design the data model
  - SPC-3 Decompose a problem into modular components
  - SPC-4 Analyze dependencies among components
  - SPC-5 Manage the information and constraints the work requires
  - SPC-6 Design how the work will be verified
  - MEM-1 Manage what's held in memory through the work
  - MEM-2 Turn repeated work into reusable knowledge
- **BLD Designing Workflows.** Building turns into directing agents,
  adjusting, and designing workflows.
  - BLD-1 Direct an AI agent to implement a specification
  - BLD-2 Adjust when the work reveals new information
  - BLD-3 Recognize when to divide and delegate work
  - BLD-4 Organize work into a structured workflow
  - BLD-5 Oversee a workflow to completion
- **VER Verification.** Value concentrates in detecting and correcting
  output, especially output that's "almost right".
  - VER-1 Verify a system across multiple dimensions
  - VER-2 Verify a program against its specification
  - VER-3 Read and review code written by others
  - VER-4 Observe a running system to confirm and diagnose its behavior
  - VER-5 Debug by systematically isolating the fault
  - VER-6 Automate verification into bounded, self-checking loops
  - VER-7 Measure quality and evaluate AI systems

Tier **Cross-cutting practices**: security and abstraction apply throughout.

- **SEC Security & adversarial thinking.** AI expands the attack surface and
  readily produces insecure code.
  - SEC-1 Analyze how a system can be misused or attacked
  - SEC-2 Apply established secure-coding practices
  - SEC-3 Evaluate AI-generated code for security vulnerabilities
  - SEC-4 Mitigate security risks specific to AI and agent systems
  - SEC-5 Assess and manage software supply-chain risk
- **ABS Reasoning across levels of abstraction.** Moving between levels and
  re-applying reasoning one level up is how competence survives tool change.
  - ABS-1 Reason at the level a problem lives at
  - ABS-2 Design abstractions that isolate change
  - ABS-3 Re-apply reasoning as the level of tooling rises

Skill density per objective ranges from 2 (most) to 6 (SPC-5, VER-1).

### The computer science half, outline only

Tiers Program Design (CFL Control Flow & Logic, MOD Functions & Modularity),
Computational Problem-Solving (IND Inductive Thinking, PSV Problem-Solving
Principles), Algorithms & Data Structures (EFF Analyzing Efficiency, DSI Data
Structures & Interfaces, ALG Algorithm Design). Same shape. Not our subject,
but it shows the framework is meant to span from classic CS to AI-era
practice in one map, which is roughly our Foundations-to-Engineering span.

### Three representative skills, paraphrased

- INC-2: order steps so each can be checked on its own, because an order that
  yields nothing checkable until the end pushes all learning to the most
  expensive moment. Example: get "add item" working before "remove item".
  Second skill: tackle the riskiest unknown first, because deferred risk
  grows.
- VER-7: a rubric turns "good" into scorable criteria; a good metric can't
  be satisfied without the real improvement it stands for; an evaluation
  scores a system on a representative input set, leaving borderline cases to
  people. Example: fifty questions with reference answers, scored
  automatically.
- BLD-1: directing an agent means stating the goal, the information the work
  needs and the limits it must stay within, because an agent fills in what's
  unsaid; domain knowledge is what lets you judge and correct its output.

## 2. Standards alignment

Two views over the same mapping:

- **Lesson by lesson**: Course | Lesson | Standards | Grade levels. Many
  standards map to one lesson ("Adding Fractions" aligns with 4.NF.3 and
  5.NF.1). Searchable by standard code.
- **Standard by standard** (the Common Core coverage page): CC standard |
  What the standard asks | Brilliant targeted skill (course in bold) | Skill
  details (linked lessons, each described in about 125 characters). Example:
  3.MD.3 "Draw and interpret scaled bar graphs" maps to the course Exploring
  Data Visually and the skills "Read and compare bars on a bar chart" and
  "Reading and comparing bar charts". Roughly 200 standards, grades 3 to
  high school. A standard is listed only where content addresses it fully or
  in part; no partial flag.

Frameworks covered besides Common Core: Digital SAT, ACT, AP Precalculus,
NY Regents, NC Math 1-3, GCSE, A Level, IB, GRE, and GMAT Quant. The coding
map isn't yet aligned to anything external.

Vocabulary: **course** (subject, for example Fractions), **level** (a group of
lessons capped by a 10 to 15 problem **level review**), **lesson** (5 to 10
minutes of interactive problems plus a **skills check**), **targeted skill**
(the lesson-sized ability a standard is matched to), **standard** (external
code).

## 3. Differentiation and lesson flow

- Differentiation by content and process, not by separate lessons: in one
  classroom three learners run in parallel on prerequisite review, the
  current objective, and an extension topic, all inside the same course
  graph. Practice adapts to learning history; skills checks and level
  reviews verify progress. "The teacher still decides" which objective
  matters and how to verify understanding.
- A lesson slots into a class period as a 5 to 10 minute warm-up before
  instruction, an investigation during it, or practice and enrichment after.
  Interactive exploration first, symbols later; compare multiple solution
  paths rather than drilling one.

## 4. Comparison with our specs

| Brilliant                         | Ours ([spec S01](../../spec/S01-dictionary.md), [spec S02](../../spec/S02-topic-map.md)) | Note                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Tier                              | Group / area                                                                             | Theirs are thematic bands; ours are audience bands. Both are three to six.                                                  |
| Big idea (noun)                   | Topic                                                                                    | Same register. Theirs carry a one-sentence "why now" summary; ours carry concepts and edges.                                |
| Learning objective (verb, coded)  | Competency                                                                               | Same register. Theirs are coded and finer: 37 versus our 18 for a narrower subject.                                         |
| Skill (claim, why, example)       | Behavior                                                                                 | We've one draft base behavior per competency; they have 2 to 6 well-formed skills per objective. This is the level we lack. |
| Standard                          | (none)                                                                                   | An external framework a lesson is matched to. We've no alignment layer.                                                     |
| Targeted skill and lesson         | Learning objective and checkpoint                                                        | Same idea: a lesson-sized unit that proves a standard.                                                                      |
| Lesson, 5 to 10 min, skills check | Lesson, 10 to 25 min, checkpoints                                                        | Ours are two to three times longer. Their level review is our course quiz.                                                  |

## 5. Implications

Decision 2026-09-19: 1, 3, 4, 5 and 7 applied in spec S02; 2 (short codes)
and 6 (shorter lessons) declined. Slugs stay the only identifiers, and 10 to
25 minute lessons are fine for professional learners and cheaper to produce.
Item 7 is applied as routing: one exercise per lesson with a stretch goal,
prerequisite and extension routing from checkpoints, comfort level as a
routing default.

1. **Adopt the skill triple.** Each behavior under a competency should be a
   one-sentence claim, a short why, and one concrete example. This is what
   makes the map usable by authors and by tutor mode. It also gives
   checkpoints something exact to test.
2. **Add short codes beside slugs.** `INC-2` is readable in a citation inside
   another skill's text, in a checkpoint id and in a sidebar badge; a slug is
   not. Give competencies a three-letter code per topic-ish cluster and a
   number, keep slugs for URLs.
3. **Split competencies finer.** Our 18 are big-idea sized. Brilliant's 37
   objectives for coding-with-AI alone suggest each of ours should carry
   three to six coded objectives, and the objectives are what lessons and
   checkpoints point at.
4. **Add an alignment layer.** A small table per competency: external
   framework, code, what it asks, our targeted objectives. Candidates:
   Brilliant's Coding with AI codes, Andrew Ng's AI engineering skills map,
   later any corporate or national AI literacy framework. Cheap to keep and
   lets a learner or employer find us by a code they already know.
5. **Content gaps this exposes in area 4 and 6.** Taste (what's worth
   building), specification and design as a first-class topic, verification
   as its own topic rather than a corner of quality, reversibility as a
   habit, and abstraction across tool levels. Security as a cross-cutting
   band is the engineer's version of our Safety area; SEC-4 and VER-7 belong
   with `building-agents/production` and `evaluation`.
6. **Lesson length.** Their 5 to 10 minute unit with a skills check argues
   for splitting our lessons into sections that each end in a checkpoint,
   which spec S01 already allows; watch total lesson length.
7. **Differentiation model.** Their "three learners in parallel in one
   graph" is the comfort-level idea done through the map rather than through
   alternate content: prerequisite review, current objective, extension.
   Worth adopting as how paths and the map interact.
