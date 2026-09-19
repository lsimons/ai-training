# S01 - Project dictionary

**Purpose:** Fix the words this project uses for its content, its knowledge
model, its interactions and its learners, so that pages, the sidebar, the
topic map, the progress record and tutor mode all mean the same thing by the
same name.

**Status:** Draft

## Introduction

*AI Training* is an open training suite for getting started with AI,
published as a static site. It has two groups of material: **Foundations**,
written at one level for every knowledge worker, and **Engineering**, for
software engineers who have finished Foundations. Learner state lives in the
browser only; there is no backend.

This spec is the project dictionary. Every other spec, every page, every
frontmatter field and every component name uses these terms. Where a term
has a well-known analogue in an existing course or platform, the analogue is
listed so the borrowing is visible. No text from those sources is reused;
only the word and the mechanic.

| Source                                   | What it lent                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harvard CS50                             | Course, lecture, short, section, problem set, lab, project, specification, walkthrough, "less comfortable" and "more comfortable", and a tutor that gives hints and never full solutions.        |
| Anthropic's interactive training modules | The screen kinds teaching, watch out, checkpoint, exercise, recap and quiz; a skip that is remembered but never counts as a pass; a rationale per option; progress in versioned browser storage. |
| Diátaxis (Daniele Procida)               | The four page kinds tutorial, how-to, reference and explanation, the compass that chooses between them, and the rules for a tutorial.                                                            |
| Execute Program                          | Prediction checkpoints, the paragraph-then-example rhythm, the course page as a lesson graph, the review and the review item, the reference that unlocks with progress.                          |
| Brilliant's coding skills map            | Verb-phrase objectives under noun-phrase topics; the behaviour written as claim, why and example; alignment to external frameworks; differentiation through position in the graph.               |
| roadmap.sh                               | Node status written back onto the map; one-paragraph node definitions; AI actions scoped to one node.                                                                                            |
| Learn Prompting                          | Citations by key against one bibliography; glossary tooltips on the first mention of a term; prompt and response shown as a styled pair.                                                         |
| A competency-map project of the author   | Competency, the levels base, expert and lead, and the typed links prerequisite, related and specialization.                                                                                      |

## Rules

1. **One word per idea.** Synonyms listed under "do not use" are banned in
   content, code, frontmatter and the sidebar.
2. **Skill is reserved for agent skills** (Claude Code skills, the Agent
   Skills specification), which are a subject taught here. A learner's
   ability is a **competency**, never a skill.
3. **Slugs are permanent.** Every unit with an identifier uses a lowercase
   kebab-case slug that never changes once published. Display names may
   change; slugs do not. There are no short codes; slugs are the only
   identifiers.
4. **Every page has a kind**, chosen with the compass in "Page kinds".
   Lessons are only ever `tutorial` or `explanation`.
5. **Every code example in a lesson is real.** It runs, and its shown output
   is asserted in CI. An example that cannot run (an agent transcript, a
   screenshot) is marked as such in the page. The tooling comes later; the
   rule holds from the first lesson.
6. **Every source is cited by key.** `(@key)` in Markdown resolves against
   one bibliography file in the repo and renders as a numbered reference
   with a per-page sources list. Concept definitions, recaps and behaviours
   cite papers and vendor documentation this way, never as bare inline URLs.
   One bibliography keeps every page's references consistent and lets a
   paper be cited rather than merely linked.
7. **The first mention of a concept in a lesson is a term.** It is marked in
   Markdown by a remark plugin, not a component, so plain Markdown stays
   plain. The term shows the concept's definition on hover and links to its
   glossary anchor. Later mentions are plain text.
8. **Prompts and responses are recorded, never live.** A prompt and its
   response are shown as a **prompt block** and a **response block** that
   name the model and the month the response was recorded. Outputs live in
   the repo and are never fetched from a third-party playground or embed at
   view time. Live embeds die with their vendors and undated outputs age
   badly; a recorded, dated output does neither.
9. **Objectives are never printed as "you will learn".** A lesson opens with
   where it is going and its recap states the objectives as "You can
   now...". Objectives are frontmatter data that drive checkpoints and tutor
   mode.

## Page kinds

### The compass

Diátaxis places every page on two axes. Does the page serve **action**
(doing) or **cognition** (knowing)? Does it serve **study** (acquiring a
craft) or **work** (applying it)? The two answers name the kind.

|               | Study         | Work        |
| ------------- | ------------- | ----------- |
| **Action**    | `tutorial`    | `how-to`    |
| **Cognition** | `explanation` | `reference` |

A training site lives almost entirely on the study half. How-to and reference
pages exist for learners at work and stay outside courses and paths. No
how-to or reference section exists in the sidebar until there is a page to
put in it.

### The four kinds

| Kind          | In a course? | Progress? | Rules                                                                                                                                               |
| ------------- | ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tutorial`    | yes (lesson) | yes       | The learner does something and sees results early and often. One path, no alternatives. Minimal explanation, link out instead. Safe and repeatable. |
| `explanation` | yes (lesson) | yes       | Discusses a topic, makes connections, may weigh alternatives and hold opinions. Checkpoints test understanding, not recall.                         |
| `how-to`      | no           | no        | A recipe for an already competent learner toward a real goal. May branch. No checkpoints. Title starts with "How to".                               |
| `reference`   | no           | no        | Austere description, structured like the thing it describes. The topic map pages and the glossary are generated reference.                          |

### Tutorial rules

Tutorial-mode lessons and every exercise follow these rules:

- **Open with where we are going** ("In this lesson we will..."), never with
  "you will learn...".
- **Visible results early and often.** Every step produces something the
  learner can see.
- **Keep the narrative of the expected.** Show expected output and flag the
  likely signs of going wrong. Pitfall sections do this, kept short.
- **Minimise explanation.** Link to an explanation page or a short instead.
- **One path, no choices.** Differentiation happens through routing between
  lessons, never through branches inside one.
- **Safe and repeatable.** A contrived setting the learner can reset. For
  agent lessons that means a fixture repository or a sandbox, never the
  learner's own project.
- **Concrete and particular.** The general emerges from the specific.
- **Fixed rhythm.** One or two short paragraphs, then one example the
  learner runs or predicts. An example that reuses state from an earlier
  example says so.

## Content units

These describe what the site contains. Nesting is strict: group > area >
course > lesson > section.

| Term              | Definition                                                                                                                                                  | Analogue                                                    | Do not use                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| **Site**          | The whole thing: *AI Training*.                                                                                                                             | CS50x                                                       | portal, academy, suite                 |
| **Group**         | One of two top-level sidebar groups: **Foundations** (for everyone, one level) and **Engineering** (for software engineers, two comfort levels).            | -                                                           | part, half, tier                       |
| **Area**          | One of six subjects (see "Areas"). Owns competencies in the topic map and one or more courses.                                                              | CS50 course (CS50AI)                                        | topic, module, track, domain           |
| **Course**        | An ordered sequence of lessons inside one area, with stated goals, an end quiz and optionally a project. Its page is the lesson graph.                      | CS50 week series; Anthropic module; Execute Program course  | module, training, class                |
| **Lesson**        | One page, 10 to 25 minutes, of kind `tutorial` or `explanation`. The unit of progress and of tutor mode. See "Lesson".                                      | Lecture chunk; Anthropic screen set; Execute Program lesson | chapter, unit, page, module            |
| **Section**       | An H2 of a lesson. Every section has a kind. See "Section kinds".                                                                                           | Anthropic screen                                            | screen, step, slide                    |
| **Pitfall**       | A section showing a realistic failure mode right after the teaching it belongs to: setup, what went wrong, the rule. Kept short in tutorial mode.           | Anthropic "Watch Out" screen                                | watch-out, warning, gotcha, caution    |
| **Checkpoint**    | A graded interaction inside a lesson, mapped to one learning objective. See "Checkpoint".                                                                   | Anthropic checkpoint; Execute Program code example          | question, quiz, test, assessment       |
| **Exercise**      | A hands-on task the learner does outside the page, then self-grades against a model answer. See "Exercise".                                                 | Lab, practice problem                                       | assignment, homework, task, variant    |
| **Project**       | A larger exercise closing a course, with a specification and a walkthrough. Optional in release 1.                                                          | Problem set, final project                                  | capstone, assignment                   |
| **Quiz**          | The end-of-course set of checkpoint questions. Pass means all objectives touched with at most one miss.                                                     | CS50 weekly quiz; Anthropic quiz                            | exam, test                             |
| **Recap**         | The closing section of a lesson: numbered takeaways, sources, what comes next. See "Recap and the learner's reference".                                     | Key takeaways; Execute Program reference                    | summary, conclusion, TL;DR             |
| **Short**         | An optional standalone page of kind `explanation`, going deeper on one concept, linked from a lesson, not in the course sequence. Where `more` depth lives. | CS50 short; Diátaxis explanation                            | appendix, deep dive, aside             |
| **Walkthrough**   | A worked example, step by step, either as a section or as the guided solution of a project. See "Walkthrough".                                              | CS50 walkthrough                                            | demo                                   |
| **Widget**        | An interactive teaching element with no grade (explorer, simulator, builder). Sits in a `not-content` container.                                            | Anthropic tab strip, hotspot, cards                         | interactive, applet, demo              |
| **Deck**          | A Quarto slide deck in `public/presentations/`, for delivering a lesson live.                                                                               | Lecture slides                                              | slides, presentation                   |
| **Path**          | An ordered list of lessons across courses for one audience or goal. See "Path".                                                                             | Anthropic learning path                                     | track, journey, roadmap, curriculum    |
| **Comfort level** | `less` or `more` comfortable: a learner setting that changes routing, not content. See "Comfort level".                                                     | CS50 less / more comfortable; Brilliant differentiation     | difficulty, beginner/advanced, variant |

### Areas

| Group       | Area               | Slug                 | Audience           |
| ----------- | ------------------ | -------------------- | ------------------ |
| Foundations | Concepts           | `concepts`           | Everyone           |
| Foundations | Safety             | `safety`             | Everyone           |
| Foundations | Using agents       | `using-agents`       | Everyone           |
| Engineering | Coding with agents | `coding-with-agents` | Software engineers |
| Engineering | Customizing agents | `customizing-agents` | Software engineers |
| Engineering | Building agents    | `building-agents`    | Software engineers |

### Lesson

- One page, 10 to 25 minutes.
- Its **mode** is `tutorial` or `explanation`, set in frontmatter. Tutorial
  mode follows the tutorial rules above, including the fixed rhythm.
- Opens with where we are going ("In this lesson we will..."), has sections
  in the body and a recap at the end.
- Teaches one to five concepts from the topic it covers.
- Frontmatter carries the data that drives routing, checkpoints and tutor
  mode:

| Field        | Holds                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `mode`       | `tutorial` or `explanation`                                                                          |
| `covers`     | The topic ids the lesson teaches                                                                     |
| `serves`     | The learning objective ids the lesson teaches toward; each gets a checkpoint                         |
| `assumes`    | The learning objective ids the lesson relies on, each pointing at the lesson section that teaches it |
| `extends-to` | Where a confident learner goes next: the next lesson, a specialization topic or a short              |

### Section kinds

| Kind         | Purpose                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `teaching`   | Exposition. May hold widgets, reflections, terms, prompt and response blocks and runnable examples. |
| `pitfall`    | A realistic failure mode right after the teaching it belongs to: setup, what went wrong, the rule.  |
| `checkpoint` | One graded interaction (see "Interaction types"), mapped to one learning objective.                 |
| `exercise`   | The lesson's hands-on task, done outside the page.                                                  |
| `recap`      | Numbered takeaways, "You can now..." objectives, sources, what comes next.                          |

### Checkpoint

- One graded interaction, mapped to exactly one learning objective.
- Can be **passed** or **skipped**. Skipping is always available, is
  recorded, and is not a pass.
- A wrong answer is marked wrong and may show a rationale or a diagnostic
  hint. The answer itself is never revealed inside a lesson. Retries are
  unlimited.
- Once its lesson is finished, a checkpoint becomes a **review item**.
- Identified as `<lesson id>#<section slug>`; the id stays stable because
  review items hang off it.

### Exercise

- Done outside the page: in a terminal, an editor or a chat. The learner
  self-grades against a model answer. Honour system.
- Runs in a contrived, resettable setting (a fixture repository, a sandbox),
  never in the learner's own project.
- One per lesson, written once. May end with a one-line **stretch goal** for
  confident learners. No variants.

### Recap and the learner's reference

- The recap closes a lesson with numbered takeaways, the served objectives
  stated as "You can now...", the sources cited on the page, and what comes
  next.
- The learner's **reference** is a client-side view of the topic reference
  pages filtered to the lessons the learner has finished, showing each
  lesson's recap and its canonical example. It unlocks with progress; it is
  not documentation to read ahead.

### Walkthrough

- A worked example, step by step, as a section or as the guided solution of
  a project.
- For prompting, the arc is fixed: the naive attempt, the failure it
  produces, one change at a time (technique, order, wording), then compare.

### Comfort level

A learner setting, `less` or `more` comfortable. It changes **routing**, the
order and extras a learner is offered, never the content of a page. Content
is written once.

| Level  | Routing effect                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `less` | Inserts the sections that teach a lesson's assumed objectives ahead of the lesson. Keeps the tutor hint-heavy. Reviews come back sooner.    |
| `more` | Offers a skills check at the start of a lesson (one checkpoint per served objective), skips objectives already passed, surfaces extensions. |

Foundations has no comfort levels; it is written at one level for everyone.

### Path

- An ordered list of lesson ids across courses, for one audience or goal.
  Examples: *Knowledge worker*, *Engineer*, *Agent builder*.
- Rendered as a map with three lanes and a "you are here" marker:

| Lane      | Holds                                              |
| --------- | -------------------------------------------------- |
| behind    | Lessons teaching assumed objectives not yet passed |
| on target | The path's next lesson                             |
| ahead     | Extensions from finished lessons                   |

- Paths are advisory. Nothing is ever locked.

## Knowledge model

These describe what the site teaches, independent of how it is laid out.
Topics and concepts are the nodes and edges of the **topic map**; they say
what is taught. Competencies, learning objectives and behaviours say what a
learner can do afterwards; they sit beside the map and point into it.

| Term                   | Definition                                                                                                                                                                                                 | Do not use                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Concept**            | A named idea a learner can understand and explain, e.g. *context window*, *prompt injection*. The smallest node. Belongs to exactly one topic. Has a stable anchor in the glossary.                        | term, idea, notion                 |
| **Topic**              | A named cluster of two to six concepts inside an area, e.g. *Prompting*, *Tool use*. A noun. The unit a lesson covers and the node that carries links. Has its own reference page.                         | subject, module, theme, competency |
| **Competency**         | Something a learner can *do*, stated as a verb phrase, e.g. *Verifies AI output before relying on it*. Draws on one or more topics, possibly across areas. Owns three to six learning objectives.          | skill, capability, ability, topic  |
| **Learning objective** | A verb-phrase node under a competency, e.g. *Writes a task brief with goal, context and done-criteria*, tagged with one level. Owns behaviours. What lessons serve and assume and checkpoints prove.       | goal, outcome, aim, standard       |
| **Behaviour**          | One observable statement under a learning objective, written as a triple: claim, why, example. The unit a checkpoint question or a tutor question tests.                                                   | indicator, criterion, skill        |
| **Level**              | `base`, `expert` or `lead`, tagged on a learning objective. See "Levels".                                                                                                                                  | grade, rank, seniority, maturity   |
| **Goal**               | A learner-chosen destination expressed as a competency at a level, e.g. "Building agents: base". Paths are the routes to goals.                                                                            | objective, target                  |
| **Link**               | A typed edge between topics. See "Links".                                                                                                                                                                  | dependency, relation, tag          |
| **Source**             | An external resource a lesson or competency points to, typed `book`, `course`, `reference` or `video`. Carries license notes when the material may not be copied.                                          | link, resource, reading            |
| **Alignment**          | A row mapping an external framework's item (framework, code, what it asks) to the learning objectives here that address it. Kept per competency, so a learner or employer can find us by a code they know. | standard, crosswalk, mapping       |

### Sizes

| Unit               | Owns                                            |
| ------------------ | ----------------------------------------------- |
| Area               | three to seven topics; two to four competencies |
| Topic              | two to six concepts                             |
| Competency         | three to six learning objectives                |
| Learning objective | two to six behaviours                           |
| Lesson             | one topic covered; one to five concepts taught  |

### Concept definitions

- One plain paragraph of at most about 80 words.
- No lists and no links inside the paragraph.
- Written so it reads well both in the glossary and as the hover text of a
  term in a lesson or a node on the map.
- Depth belongs in the topic page prose and in cited sources, not in the
  definition.

### Levels

| Level    | Meaning                                                     |
| -------- | ----------------------------------------------------------- |
| `base`   | Can do it with guidance and knows the vocabulary.           |
| `expert` | Does it reliably and explains the trade-offs.               |
| `lead`   | Sets the practice for others and judges when not to use it. |

### Behaviour triple

| Part        | Form                                                        |
| ----------- | ----------------------------------------------------------- |
| **Claim**   | One sentence stating what a competent person does or knows. |
| **Why**     | A short reason the claim matters.                           |
| **Example** | One concrete instance, ideally a before and after.          |

### Links

| Type             | Meaning                                 | Rendered as                        |
| ---------------- | --------------------------------------- | ---------------------------------- |
| `prerequisite`   | Learn the target topic first            | The arrow in the map               |
| `related`        | See also                                | A plain connector                  |
| `specialization` | A narrower, deeper version of the topic | A connector toward the deeper node |

Concepts inherit their topic's links.

## Interaction types

Checkpoint kinds available to authors. Names are the component names.

| Type           | Behaviour                                                                                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `predict`      | Show real code or a real command, ask the learner to type what it evaluates to or outputs, then run it to grade. Wrong: mark only; Hint gives a diagnostic nudge, never the answer. Unlimited retries. **Preferred wherever code runs.** Honour-system variant: predict what the agent will do, then run it and self-grade. |
| `choice`       | Single-select multiple choice. Rationale per option; wrong picks show their own rationale, never the answer. Unlimited retries. Use only where nothing runs.                                                                                                                                                                |
| `multi-choice` | Select exactly N correct items with no false positives.                                                                                                                                                                                                                                                                     |
| `match`        | Assign one option to each statement row. Per-row feedback, rationale on full pass.                                                                                                                                                                                                                                          |
| `sort`         | Place chips into labelled buckets, click-to-select then click-a-bucket. Keyboard operable.                                                                                                                                                                                                                                  |
| `order`        | Put steps in sequence. A `sort` with one ordered bucket.                                                                                                                                                                                                                                                                    |
| `scenario`     | A short situation plus a decision as `choice`, with consequences shown per option.                                                                                                                                                                                                                                          |
| `repair`       | Fix a broken artefact in a textarea, reveal the model answer, then `self-grade`.                                                                                                                                                                                                                                            |
| `self-grade`   | After a reveal: pass, partial, retry. Only pass counts.                                                                                                                                                                                                                                                                     |
| `reflection`   | Free text prompt, saved locally, never graded. Not a checkpoint; a `teaching` section element.                                                                                                                                                                                                                              |

Rules that hold across all types:

- A hint is a diagnostic question or nudge, never the answer.
- The answer is never revealed inside a lesson. **Give Up**, which reveals
  the answer and counts as a fail, exists only in a review.
- Grading is all-or-nothing with unlimited retries. Only a pass counts.
- Every checkpoint is keyboard operable and announces feedback to assistive
  technology.

## Learners and roles

| Term            | Definition                                                                                                                                                                           | Do not use              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **Learner**     | The person using the site.                                                                                                                                                           | student, user, reader   |
| **Author**      | Someone writing or editing lessons.                                                                                                                                                  | teacher, instructor     |
| **Tutor**       | Claude acting in tutor mode inside Claude Code, with the site running locally. Hints, not answers. See "Tutor verbs".                                                                | assistant, duck, bot    |
| **Maintainer**  | Someone with commit rights on this repo.                                                                                                                                             | admin, owner            |
| **Progress**    | The learner's local record. See "Progress record".                                                                                                                                   | state, history, profile |
| **Review**      | A short session of review items due today, reached from the course page or tutor mode. Items are checkpoints from finished lessons, re-asked. Has **Give Up**, which lessons do not. | recap, test, drill      |
| **Review item** | One checkpoint in the review schedule, with a stage on a fixed interval ladder and a learner-adjustable frequency.                                                                   | card, flashcard         |

### Tutor verbs

The tutor offers a fixed set of verbs scoped to the current topic or lesson.
Every answer is grounded in the concept definitions and behaviours of that
node, never in general knowledge alone, and cites the node's reference page.

| Verb                     | Does                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| *explain*                | Explains the node from its concept definitions                          |
| *key points*             | Lists the node's behaviours as short claims                             |
| *explain like I am five* | Re-explains with an everyday analogy                                    |
| *why it matters*         | States the why of the node's behaviours                                 |
| *quiz me*                | Asks the node's checkpoints, one at a time                              |
| *test me*                | Asks open questions and grades free-text answers against the behaviours |

### Progress record

The learner's local record, kept in browser local storage under a versioned
key, exportable and importable as one JSON file. It holds:

| Per        | Fields                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| lesson     | `read`, `finished` or `skipped`. Skipped means "I know this", set by the learner, shown on the map, not counted as finished. |
| checkpoint | `passed`, `skipped` or `attempted`, plus its review schedule: stage, due date, last result.                                  |
| quiz       | Score.                                                                                                                       |
| learner    | Chosen comfort level, chosen goals.                                                                                          |

## Identifiers

| Unit         | Identifier                                          | Example                                                |
| ------------ | --------------------------------------------------- | ------------------------------------------------------ |
| Area         | `<area>`                                            | `safety`                                               |
| Course       | `<area>/<course>`                                   | `using-agents/delegating`                              |
| Lesson       | `<area>/<course>/<lesson>`, equal to the page route | `using-agents/delegating/writes-a-brief`               |
| Section      | `<lesson id>#<section slug>`                        | `using-agents/delegating/writes-a-brief#fix-the-brief` |
| Checkpoint   | Its section id                                      | as above                                               |
| Topic        | `<area>/<topic>`, a noun slug                       | `concepts/prompting`                                   |
| Competency   | `<area>/<competency>`, verb-led                     | `safety/verifies-output`                               |
| Objective    | `<competency id>/<objective>`, verb-led             | `safety/verifies-output/checks-claims`                 |
| Concept      | `<concept>`, global and unique                      | `context-window`                                       |
| Progress key | `ai-training-progress-v<N>`                         | `ai-training-progress-v1`                              |

- Bump `N` in the progress key when the meaning of stored fields changes,
  not when content is added.
- No short codes anywhere. A reference from one behaviour to another uses
  the objective slug.

## Open questions

1. Whether `how-to` pages should record `read` progress after all, so a path
   can include one. Leaning: no; paths hold lessons only.
2. Whether "Foundations" and "Engineering" appear in URLs or only in the
   sidebar. Leaning: sidebar only; area slugs stay flat.
3. Whether a lesson can belong to more than one path. Leaning: yes; paths
   are lists of lesson ids, nothing more.
