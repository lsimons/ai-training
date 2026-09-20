# Lesson authoring (S03)

**Purpose:** Fix the rules every lesson page follows: how its kind is chosen,
what it contains and declares, how examples, citations, terms, and prompts are
written, and how checkpoints, exercises, and widgets behave.

**Status:** Draft. Changed after the release 1 review: checkpoints are "at
least one per served objective" instead of exactly one, because tutorial
mode also demands a `predict` for every example that runs; and prompt
blocks may be marked `illustrative` in release 1 (see "Examples").

## Introduction

Terms are per the [project dictionary](S01-dictionary.md). The topics a
lesson covers and the objectives it serves and assumes come from the
[topic map](S02-topic-map.md). This spec is written for authors; the
components that render a lesson implement it.

## Choosing the page kind

A page has one of the four kinds. Choose the kind with the Diátaxis
compass: does the page serve **action** (doing) or **cognition** (knowing),
and does it serve **study** (acquiring a craft) or **work** (applying it)?

|               | Study         | Work        |
| ------------- | ------------- | ----------- |
| **Action**    | `tutorial`    | `how-to`    |
| **Cognition** | `explanation` | `reference` |

- Lessons are only ever `tutorial` or `explanation`; the choice is the
  lesson's **mode**.
- How-to and reference pages serve learners at work and stay outside
  courses and paths. The sidebar gets a how-to or reference section once
  there is a page to put in it.
- The topic map pages and the glossary are generated reference; authors do
  not write them by hand.

## Lesson anatomy

| Part        | Rule                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length      | 10 to 25 minutes.                                                                                                                                  |
| Opener      | Where we're going, in the present tense: "In this lesson we build...". Never `you will learn`.                                                     |
| Sections    | H2s, each with a section kind. Body sections alternate teaching with pitfalls and checkpoints.                                                     |
| Pitfall     | At least one, placed right after the teaching it belongs to. It gives the setup and what went wrong, then states the rule. Short in tutorial mode. |
| Checkpoints | At least one per served objective. A checkpoint's `objective` names the one objective it evidences.                                                |
| Exercise    | Exactly one.                                                                                                                                       |
| Recap       | Numbered takeaways, the served objectives as "You can now...", and "Next": the course's next lesson, else the next course.                         |

Objectives are frontmatter data that drive checkpoints, routing, and tutor
mode. They're never printed as a `you will learn` list; the opener and the
recap carry that role.

### Frontmatter

| Field        | Holds                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `title`      | The display title                                                                                    |
| `mode`       | `tutorial` or `explanation`                                                                          |
| `covers`     | The topic ids the lesson teaches                                                                     |
| `serves`     | The learning objective ids the lesson teaches toward; each gets at least one checkpoint              |
| `assumes`    | The learning objective ids the lesson relies on, each pointing at the lesson section that teaches it |
| `extends-to` | Where a confident learner goes next: the next lesson, a specialization topic, or a short             |

## Tutorial mode

Tutorial-mode lessons follow these rules:

- **Visible results early and often.** Every step produces something the
  learner can see.
- **Keep the narrative of the expected.** Show expected output and flag the
  likely signs of going wrong. Pitfall sections do this.
- **Minimize explanation.** Link to an explanation page or a short instead.
- **One path.** The lesson doesn't offer choices. Differentiation happens through routing between
  lessons, never through branches inside one.
- **Safe and repeatable.** A contrived setting the learner can reset.
- **Concrete and particular.** The general emerges from the specific.
- **Fixed rhythm.** One or two short paragraphs, then one example the
  learner runs or predicts. An example that reuses state from an earlier
  example says so.

## Explanation mode

Explanation-mode lessons may discuss, compare, and hold opinions. Their
checkpoints test understanding, not recall; `choice` and `scenario` are
allowed because nothing runs. The anatomy above still applies, including the
pitfall and the exercise.

## Examples

- **Every code example is real.** It runs, and its shown output is asserted
  in CI. An example that can't run (an agent transcript, a screenshot) is
  marked that way in the page. Until the example runner exists the rule still
  holds: an example that can't run says so.
- **Prefer `predict`** for any example that runs. Use `choice` only where
  nothing runs.
- **Prompts and responses are recorded, never live.** A prompt block and
  its response block name the model and the month the response was
  recorded. Outputs live in the repo and are never fetched from a
  third-party playground or embed at view time. Live embeds die with their
  vendors and undated outputs age badly.
- **Illustrative transcripts are allowed in release 1, marked.** Until
  transcripts are recorded, an author may write one and set
  `model="illustrative" recorded="illustrative"`. The component must label
  the block as illustrative, and the page must say so in prose next to it
  ("the transcript is illustrative..."). A block that looks like a
  recording but isn't one is a defect.
- **Prompting walkthroughs follow one arc:** the naive attempt, the failure
  it produces, one change at a time (technique, order, wording), then
  compare.

## Citations and terms

- **Sources are cited by key.** `(@key)` in Markdown resolves against
  one bibliography file in the repo and renders as a numbered reference.
  The sources list is on the topic page. Concept definitions, recaps, and
  behaviors cite papers and vendor documentation this way, never as bare
  inline URLs.
- **The first mention of a concept is a term.** A remark plugin marks it in
  Markdown rather than a component, so plain Markdown stays plain. The term
  renders the concept's glossary definition on hover and links to its
  glossary anchor. Later mentions are plain text.

## Checkpoints

- A hint is a diagnostic question or nudge, never the answer.
- The answer is never revealed inside a lesson. Wrong `choice` picks show
  their own rationale; wrong `predict` answers are only marked wrong.
- Grading is all-or-nothing with unlimited retries. Only a pass counts.
- Skip is always available, is recorded, and is visibly distinct from a
  pass.
- Every checkpoint is keyboard operable and announces its feedback to
  assistive technology.
- A checkpoint's id is its section id. Authors keep section slugs stable
  once published, because progress and review items hang off them.

## Exercises

- Done outside the page: in a terminal, an editor, or a chat.
- Runs in a contrived, resettable setting (a fixture repository, a
  sandbox), never in the learner's own project.
- The learner self-grades against a model answer. Honor system.
- One per lesson, written once, optionally ending with a one-line stretch
  goal. No variants per comfort level.

## Widgets

- A widget teaches and never grades.
- Widgets sit in a `class="not-content"` container so the page styles do
  not apply to them.
- Widget scripts never emit a literal `</script>` or `</pre>` inside a JS
  string, because it breaks the Markdown formatter and the renderer.

## Related specs

- [S01 Project dictionary](S01-dictionary.md): page kinds, section kinds,
  interaction types, term, prompt block.
- [S02 Topic map and competencies](S02-topic-map.md): the topic and
  objective ids a lesson declares, and how `assumes` and `extends-to` route.

## Open questions

1. Whether explanation-mode lessons may skip the exercise when the topic
   has nothing to do by hand. Leaning: no; a reflection-style exercise is
   still an exercise.
2. Where the bibliography file is stored and in what format (BibTeX or YAML).
   Decide when building the citation plugin.
