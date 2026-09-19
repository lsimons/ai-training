# Exploration 08: Diátaxis, and what this project takes from it

Captured 2026-09-19. Source: the Diátaxis documentation framework by Daniele
Procida, <https://diataxis.fr/>, read from the repository at
`~/git/lsimons/diataxis-documentation-framework` (`source/*.rst`). Licensed
CC BY-SA 4.0, the same license as this project's content, so its text may be
adapted with attribution and a note of changes. This note paraphrases; it
does not copy.

## The framework in short

Diátaxis says documentation serves a practitioner of a craft along two axes:
**action** versus **cognition** (doing versus knowing) and **acquisition**
versus **application** (study versus work). The four quadrants are the four
kinds of documentation, and the claim is that there are exactly four because
the two axes cover the whole territory.

| Kind         | Serves           | Answers                 | Form                                 |
| ------------ | ---------------- | ----------------------- | ------------------------------------ |
| Tutorial     | action, study    | "Can you teach me to…?" | a lesson: the learner does something |
| How-to guide | action, work     | "How do I…?"            | steps toward a real goal             |
| Reference    | cognition, work  | "What is…?"             | austere description of the machinery |
| Explanation  | cognition, study | "Why…?"                 | discursive discussion of a topic     |

The **compass** is the authoring tool: ask "action or cognition?" and "study
or work?" and the answer names the kind. The most common failure is blurring
neighbours, above all tutorials into how-to guides.

Process guidance: use it as a guide, not a plan; improve one small thing at a
time and publish it; never create empty section scaffolding; let structure
emerge from well-formed pages.

## What we adopt

A training site lives almost entirely on the study half of the map, so its
pages are tutorials and explanation. How-to and reference exist but serve
learners at work and stay outside courses and paths.

1. **Every lesson has a mode**, `tutorial` or `explanation`, declared in
   frontmatter. Tutorial-mode lessons follow the Diátaxis tutorial rules
   below. Explanation-mode lessons may discuss, compare and hold opinions,
   and their checkpoints test understanding.
2. **Tutorial rules** for tutorial-mode lessons and for exercises:
   - Open with where we are going ("In this lesson we will…"), not with "you
     will learn…". Objectives are frontmatter data that drive checkpoints
     and tutor mode; the recap states them as "You can now…".
   - Visible results early and often; every step produces something the
     learner can see.
   - Maintain the narrative of the expected: show expected output, flag the
     likely signs of going wrong. Our pitfall sections are this, kept
     short.
   - Minimise explanation; link to an explanation page or short instead.
   - One path, no choices or alternatives. Hence comfort levels apply to
     alternative exercises and shorts, never to branches inside a lesson.
   - Safe and repeatable: a contrived setting the learner can reset. For
     agent lessons that means a fixture repository or sandbox, never the
     learner's own project.
   - Concrete and particular; the general emerges from the specific.
3. **Page kinds outside courses**: `how-to` (a recipe for an already
   competent learner, real-world, may branch, no checkpoints) and
   `reference` (austere, mirrors the structure of what it describes). No
   how-to or reference section is created until there is a page to put in
   it.
4. **The topic map and glossary are reference.** Topic and competency YAML
   render as reference pages structured like the topic tree, and concept
   definitions render as a generated glossary.
5. **Tutor mode is the absent instructor.** Diátaxis notes that a written
   tutorial's teacher is "required to be present but condemned to be
   absent". Tutor mode puts the instructor back: watching, correcting,
   asking what the learner noticed.
6. **Release discipline**: publish small complete steps; the sidebar shows
   only areas that have a real lesson; no stub pages.

## What we deliberately do not adopt

- Diátaxis discourages planning and top-down structure. We keep the plan and
  the topic map because a curriculum needs sequencing and prerequisites that
  a product's documentation does not. The map is the structure of what is
  taught, not of the pages.
- Diátaxis has no concept of assessment. Checkpoints, quizzes, progress and
  comfort levels come from CS50 and the Anthropic modules
  ([explore/03](./03-cs50-pedagogy.md),
  [explore/07](./07-scorm-interactions-and-duck-tutor.md)).

## Where it landed

- [spec 001](../../spec/001-dictionary.md): kinds and compass, lesson mode,
  `how-to` and `reference` page kinds, objective placement, comfort-level
  scope, the sandbox rule.
- [spec 002](../../spec/002-topic-map.md): mode per thin-slice lesson,
  alternative exercises per comfort level, YAML rendered as reference.
