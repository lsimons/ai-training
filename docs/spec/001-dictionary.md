# 001 - Project dictionary

**Purpose:** Fix the words this project uses for its content, its knowledge
model and its learners, so pages, the sidebar, the topic map, the progress
model and tutor mode all mean the same thing by the same name. Based on the
CS50 vocabulary ([explore/03](../plan/explore/03-cs50-pedagogy.md)), the
Anthropic module structure
([explore/07](../plan/explore/07-scorm-interactions-and-duck-tutor.md)) and
the career-model competency schema
([explore/05](../plan/explore/05-career-model-and-deeplearning-ai.md)).

**Status:** Draft, 2026-09-19. Supersedes the "Taxonomy / project
dictionary" bullet in [the plan](../plan/README.md).

## Rules

- One word per idea. Synonyms listed under "do not use" are banned in
  content, code, frontmatter and the sidebar.
- **Skill is reserved for agent skills** (Claude Code skills, the Agent Skills
  spec), which are a subject taught here. A learner's ability is always a
  **competency**, never a skill.
- Every unit below with an identifier uses a lowercase kebab-case **slug**
  that never changes once published. Display names may change; slugs do not.
- Every page has a Diátaxis **kind**, chosen with the compass: does the page
  inform *action* or *cognition*, and does it serve *study* or *work*?
  Action + study is a `tutorial`; cognition + study is `explanation`; action
  - work is a `how-to`; cognition + work is `reference`. Lessons are only ever
    `tutorial` or `explanation`. See
    [explore/08](../plan/explore/08-diataxis.md).

## Page kinds

| Kind          | Serves           | In a course? | Progress? | Rules                                                                                                                                               |
| ------------- | ---------------- | ------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tutorial`    | action, study    | yes (lesson) | yes       | The learner does something and sees results early and often. One path, no alternatives. Minimal explanation, link out instead. Safe and repeatable. |
| `explanation` | cognition, study | yes (lesson) | yes       | Discusses a topic, makes connections, may weigh alternatives and hold opinions. Checkpoints test understanding, not recall.                         |
| `how-to`      | action, work     | no           | no        | A recipe for an already competent learner toward a real goal. May branch. No checkpoints. Title starts with "How to".                               |
| `reference`   | cognition, work  | no           | no        | Austere description, structured like the thing it describes. The topic map pages and the glossary are generated reference.                          |

No how-to or reference section exists in the sidebar until there is a page
to put in it.

## Content units

These describe what the site contains. Nesting is strict: group > area >
course > lesson > section.

| Term              | Definition                                                                                                                                                                                                                                                                                                                                                                                                                   | CS50 / Anthropic analogue                               | Do not use                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| **Site**          | The whole thing: *AI Training*.                                                                                                                                                                                                                                                                                                                                                                                              | CS50x                                                   | portal, academy, suite                 |
| **Group**         | One of two top-level sidebar groups: **Foundations** (for everyone, one level) and **Engineering** (for software engineers, two comfort levels).                                                                                                                                                                                                                                                                             | -                                                       | part, half, tier                       |
| **Area**          | One of six subjects: Concepts, Safety, Using agents (Foundations); Coding with agents, Customizing agents, Building agents (Engineering). An area owns competencies in the topic map and one or more courses.                                                                                                                                                                                                                | Course (CS50AI)                                         | topic, module, track, domain           |
| **Course**        | An ordered sequence of lessons inside one area, with stated goals, an end quiz and optionally a project. Release 1 has one course per area.                                                                                                                                                                                                                                                                                  | CS50 week series; Anthropic module                      | module, training, class                |
| **Lesson**        | One page, 10 to 25 minutes, of kind `tutorial` or `explanation` (its **mode**, set in frontmatter). Opens with where we are going ("In this lesson we will..."), has sections in the body and a recap at the end. Frontmatter lists the topics it covers, the objectives it **serves**, the objectives it **assumes** (prerequisites, used for routing) and where it **extends to**. The unit of progress and of tutor mode. | Lecture chunk; Anthropic screen set; Diátaxis tutorial  | chapter, unit, page, module            |
| **Section**       | An H2 of a lesson. Every section has a **kind**: `teaching`, `pitfall`, `checkpoint`, `exercise`, `recap`.                                                                                                                                                                                                                                                                                                                   | Anthropic screen                                        | screen, step, slide                    |
| **Pitfall**       | A section that shows a realistic failure mode right after the teaching it belongs to: setup, what went wrong, the rule. Kept short in tutorial mode.                                                                                                                                                                                                                                                                         | Anthropic Watch Out screen                              | watch-out, warning, gotcha, caution    |
| **Checkpoint**    | A graded interaction inside a lesson (see interaction types below). Can be passed or skipped; skipping is recorded and is not a pass. Every checkpoint maps to one learning objective.                                                                                                                                                                                                                                       | Anthropic checkpoint                                    | question, quiz, test, assessment       |
| **Exercise**      | A hands-on task the learner does outside the page (in a terminal, an editor, a chat), then self-grades against a model answer. Honour system. Runs in a contrived, resettable setting (a fixture repository, a sandbox), never in the learner's own project. One per lesson, written once; may end with a one-line **stretch goal** for confident learners. No variants.                                                     | Lab, practice problem                                   | assignment, homework, task, variant    |
| **Project**       | A larger exercise closing a course, with a specification and a walkthrough. Optional in release 1.                                                                                                                                                                                                                                                                                                                           | Problem set, final project                              | capstone, assignment                   |
| **Quiz**          | The end-of-course set of checkpoint questions. Pass means all objectives touched with at most one miss.                                                                                                                                                                                                                                                                                                                      | CS50 weekly quiz; Anthropic quiz                        | exam, test                             |
| **Recap**         | The closing section of a lesson: numbered takeaways, sources, what comes next.                                                                                                                                                                                                                                                                                                                                               | Key takeaways                                           | summary, conclusion, TL;DR             |
| **Short**         | An optional standalone page of kind `explanation`, going deeper on one concept, linked from a lesson, not in the course sequence. Also where `more` comfortable depth lives.                                                                                                                                                                                                                                                 | CS50 short; Diátaxis explanation                        | appendix, deep dive, aside             |
| **Walkthrough**   | A worked example, step by step, either as a section or as the guided solution of a project.                                                                                                                                                                                                                                                                                                                                  | CS50 walkthrough                                        | demo                                   |
| **Widget**        | An interactive teaching element with no grade (explorer, simulator, builder). Sits in a `not-content` container.                                                                                                                                                                                                                                                                                                             | Anthropic tab strip, hotspot, cards                     | interactive, applet, demo              |
| **Deck**          | A Quarto slide deck in `public/presentations/`, for delivering a lesson live.                                                                                                                                                                                                                                                                                                                                                | Lecture slides                                          | slides, presentation                   |
| **Path**          | An ordered list of lessons across courses for one audience or goal, shown as a map with three lanes (behind, on target, ahead) and "you are here". Examples: *Knowledge worker*, *Engineer*, *Agent builder*.                                                                                                                                                                                                                | Anthropic learning path                                 | track, journey, roadmap, curriculum    |
| **Comfort level** | `less` or `more` comfortable, a learner setting that changes **routing**, not content. `less` inserts prerequisite refreshers ahead of each lesson and keeps the tutor hint-heavy. `more` offers a skills check at the start of a lesson, skips passed objectives, and surfaces extensions. Foundations has no levels. See "Differentiation by routing" in [spec 002](./002-topic-map.md).                                   | CS50 less / more comfortable; Brilliant differentiation | difficulty, beginner/advanced, variant |

## Knowledge model

These describe what the site teaches, independent of how it is laid out.
Topics and concepts are the nodes and edges of the topic map; competencies
sit beside it and point into it ([spec 002](./002-topic-map.md)).

| Term                   | Definition                                                                                                                                                                                                                                                                                                                                                                                   | Do not use                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Concept**            | A named idea a learner can understand and explain, e.g. *context window*, *prompt injection*. Smallest node. Belongs to exactly one topic. A lesson teaches one to five concepts.                                                                                                                                                                                                            | term, idea, notion                 |
| **Topic**              | A named cluster of two to six concepts inside an area, e.g. *Prompting*, *Tool use*. A noun. The unit a lesson covers and the node that carries links. An area owns three to seven topics.                                                                                                                                                                                                   | subject, module, theme, competency |
| **Competency**         | Something a learner can *do*, stated as a verb phrase, e.g. *Verifies AI output before relying on it*. Draws on one or more topics, possibly across areas. Owns three to six learning objectives. An area owns two to four competencies. Never a noun naming a subject.                                                                                                                      | skill, capability, ability, topic  |
| **Level**              | `base`, `expert`, `lead`: base can do it with guidance and knows the vocabulary; expert does it reliably and explains the trade-offs; lead sets the practice for others and judges when not to use it.                                                                                                                                                                                       | grade, rank, seniority, maturity   |
| **Behaviour**          | One observable statement under a learning objective, written as a triple: a one-sentence **claim**, a short **why**, and one concrete **example**. Two to six per objective. The unit checkpoints and tutor questions point at.                                                                                                                                                              | indicator, criterion, skill        |
| **Learning objective** | A verb-phrase node under a competency, e.g. *Writes a task brief with goal, context and done-criteria*, tagged with one level. Three to six per competency; each owns behaviours. Lessons serve, assume and extend to objectives; checkpoints prove them; tutor mode quizzes from them; the recap states them as "You can now...". Never printed as "you will learn" at the top of a lesson. | goal, outcome, aim, standard       |
| **Goal**               | A learner-chosen destination expressed as a competency level, e.g. "Building agents: base". Paths are the routes to goals.                                                                                                                                                                                                                                                                   | objective, target                  |
| **Link**               | A typed edge between topics: `prerequisite` (learn this first), `related` (see also), `specialization` (a narrower, deeper version). Concepts inherit their topic's links.                                                                                                                                                                                                                   | dependency, relation, tag          |
| **Source**             | An external resource a lesson or competency points to: `book`, `course`, `reference`, `video`. Carries license notes when the material may not be copied.                                                                                                                                                                                                                                    | link, resource, reading            |
| **Alignment**          | A row mapping an external framework's item (framework, code, what it asks) to the learning objectives here that address it. Kept per competency. Lets a learner or employer find us by a code they already know.                                                                                                                                                                             | standard, crosswalk, mapping       |

## Interaction types

Checkpoint kinds available to authors. Names are the component names.

| Type           | Behaviour                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `choice`       | Single-select multiple choice. Rationale per option; wrong picks show their own rationale, never the answer. Unlimited retries. |
| `multi-choice` | Select exactly N correct items with no false positives.                                                                         |
| `match`        | Assign one option to each statement row. Per-row feedback, rationale on full pass.                                              |
| `sort`         | Place chips into labelled buckets, click-to-select then click-a-bucket. Keyboard operable.                                      |
| `order`        | Put steps in sequence. A `sort` with one ordered bucket.                                                                        |
| `scenario`     | A short situation plus a decision as `choice`, with consequences shown per option.                                              |
| `repair`       | Fix a broken artefact in a textarea, reveal the model answer, then `self-grade`.                                                |
| `self-grade`   | After a reveal: pass, partial, retry. Only pass counts.                                                                         |
| `reflection`   | Free text prompt, saved locally, never graded. Not a checkpoint; a `teaching` section element.                                  |

## Learners and roles

| Term           | Definition                                                                                                                                                                                                                                     | Do not use              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Learner**    | The person using the site.                                                                                                                                                                                                                     | student, user, reader   |
| **Author**     | Someone writing or editing lessons.                                                                                                                                                                                                            | teacher, instructor     |
| **Tutor**      | Claude acting in tutor mode inside Claude Code, with the site running locally. Hints, not answers.                                                                                                                                             | assistant, duck, bot    |
| **Maintainer** | Someone with commit rights on this repo.                                                                                                                                                                                                       | admin, owner            |
| **Progress**   | The learner's local record: per lesson `read`, per checkpoint `passed`, `skipped` or `attempted`, per quiz score, chosen comfort level, chosen goals. Browser local storage under a versioned key, exportable and importable as one JSON file. | state, history, profile |

## Identifiers

- Area slugs: `concepts`, `safety`, `using-agents`, `coding-with-agents`,
  `customizing-agents`, `building-agents`.
- Lesson id: `<area>/<course>/<lesson>` slug path, equal to the page route.
- Topic id: `<area>/<topic>`, a noun slug. Competency id:
  `<area>/<competency>`, a verb-led slug such as `safety/verifies-output`.
  Objective id: `<competency id>/<objective>`, verb-led, e.g.
  `safety/verifies-output/checks-sources`. Concept id: `<concept>` (global,
  unique). No short codes; slugs are the only identifiers.
- Checkpoint id: `<lesson id>#<section slug>`.
- Progress storage key: `ai-training-progress-v<N>`; bump `N` when the
  meaning of stored fields changes, not when content is added.

## Open questions

- Whether `how-to` pages should record `read` progress after all, so a path
  can include one. Leaning: no; paths hold lessons only.
- Whether "Foundations" and "Engineering" appear in URLs or only in the
  sidebar. Leaning: sidebar only, area slugs stay flat.
- Whether a lesson can belong to more than one path. Leaning: yes; paths are
  lists of lesson ids, nothing more.
