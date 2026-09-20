# Release 1 (S06)

**Purpose:** Define the first release: one lesson per area, chosen so the
structure of the site is visible end to end and every mechanism is exercised at
least once.

**Status:** Draft

## Introduction

Release 1 is a thin slice through all six areas, to be deepened afterwards.
Terms are per the [project dictionary](S01-dictionary.md); topics,
objectives and the source-material keys are per the
[topic map](S02-topic-map.md); every lesson follows
[lesson authoring](S03-lesson-authoring.md); progress and reviews work as
in the [progress record](S04-progress-record.md) and
[spaced review](S05-spaced-review.md).

Making the repository public is a separate, explicit decision. It is not
tied to this release.

## The slice

One lesson per area, each exercising a different interaction type.

| Area               | Lesson (working title)                 | Mode        | Covers topic                     | Serves objectives                                                                       | Basis                                       | Interaction to prove     |
| ------------------ | -------------------------------------- | ----------- | -------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| concepts           | How a language model works             | explanation | concepts/how-models-work         | `explains-models/explains-generation`, `names-failure-modes`                            | new; `AEC-02` first half                    | `choice`, widget         |
| safety             | Why agent safety is different          | explanation | safety/agent-risk                | `judges-agent-risk/names-blast-radius`, `chooses-human-in-loop`, `recognizes-injection` | `AEC-10` first half, rewritten for everyone | `scenario`, pitfall      |
| using-agents       | Delegating a task to an agent          | tutorial    | using-agents/delegating          | `delegates-and-checks/writes-a-brief`, `chooses-autonomy`, `reviews-against-brief`      | new; a real delegation in a sandbox         | `sort` (autonomy levels) |
| coding-with-agents | Your first session with a coding agent | tutorial    | coding-with-agents/first-session | `ships-with-agent/runs-a-session`, `gives-the-right-context`                            | `AEC-12` public rewrite; fixture repository | `predict`, `exercise`    |
| customizing-agents | Project instructions: AGENTS.md        | tutorial    | customizing-agents/instructions  | `configures-agent/writes-project-instructions`                                          | `AEC-15` with the builder widget            | `repair`, widget         |
| building-agents    | Building your first agent              | tutorial    | building-agents/agent-loop       | `builds-agent-loop/defines-a-tool`, `implements-the-loop`                               | `AEC-13`                                    | `predict`, `order`       |

Each lesson is the first and only lesson of its area's course, so release 1
has six courses of one lesson each.

## What every slice lesson has

- Served, assumed and extends-to objectives in frontmatter, pointing at
  real ids in the topic map.
- One pitfall, at least one checkpoint per served objective, one exercise
  with a stretch goal, and a recap.
- In tutorial mode: the paragraph-then-example rhythm, `predict` for every
  example that runs, and a resettable fixture.
- Behaviors written for every objective it serves, so the tutor and the
  checkpoints have something exact to test.

## What release 1 exercises

| Mechanism       | Exercised by                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Lesson graph    | One course page per area, each a one-node graph with a milestone bar and completion ring                      |
| Topic map       | One topic per area colored from lesson state, and the rest of the map drawn from the YAML with no lessons yet |
| Interactions    | `predict`, `choice`, `scenario`, `sort`, `order`, `repair` with `self-grade`, two widgets                     |
| Routing         | Checkpoint fail cards and extension cards on the six lessons; comfort level on the three Engineering lessons  |
| Progress record | Read, finished and skipped states; export and import                                                          |
| Spaced review   | Finishing any slice lesson schedules its checkpoints; one review page per course                              |
| Tutor mode      | Tested against these six lessons only                                                                         |

Routing is thin in release 1. It needs the objective graph to be real and
needs somewhere to route to, and six lessons give little of either. The data
model and the components allow for it; it becomes useful as the graph fills
in.

## Not in release 1

- Projects. Every course may close with one later, but none does yet.
- Course quizzes. A one-lesson course has nothing to quiz beyond its
  checkpoints.
- Shorts, how-to pages and reference pages other than the generated topic
  pages and glossary.
- Stub pages. The sidebar shows only the six real lessons.
- Paths as rendered maps. The paths are defined as data, and the
  three-lane rendering can wait until courses have more than one lesson.

## Done

Release 1 is done when the six lessons are live on the site with everything
in "What every slice lesson has", the mechanisms above work in a browser
with an empty progress record and with an imported one, and the CI gate is
green.

## Related specs

- [S01 Project dictionary](S01-dictionary.md)
- [S02 Topic map and competencies](S02-topic-map.md): the topics, objectives
  and source keys named above.
- [S03 Lesson authoring](S03-lesson-authoring.md): what each lesson must
  contain.
- [S04 Progress record](S04-progress-record.md) and
  [S05 Spaced review](S05-spaced-review.md): the mechanisms the slice
  exercises.

## Open questions

1. Whether the two `explanation` lessons should get an honor-system
   `predict` (predict what the agent does, then run it) so `predict` is
   proven outside code too. Leaning: yes for the safety lesson.
2. Whether release 1 needs the example runner in CI, or whether marking
   examples as unverified is acceptable for six lessons. Leaning: build it;
   the rule is cheaper to keep from the start.
