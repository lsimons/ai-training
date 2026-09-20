# Spaced review (S05)

**Purpose:** Define how the site brings a learner back to what they learned,
without a backend: which items are reviewed, on what schedule, where reviews
surface, and what's stored.

**Status:** Draft

## Introduction

Terms are per the [project dictionary](S01-dictionary.md): a **checkpoint**
becomes a **review item** when its lesson is finished, and a **review** is a
short session of the items due today. The course page and the routing rules
that reviews feed are in the [topic map](S02-topic-map.md); the review
schedule is stored in the [progress record](S04-progress-record.md).

Retention is the point of a training site, and interactive lessons alone
produce recognition, not recall. Reviews re-ask a lesson's checkpoints at
growing intervals after the lesson is finished, take a few minutes, and are
the only mechanism that brings a learner back to old material.

## What gets reviewed

- Every **checkpoint** in a lesson becomes a **review item** when the lesson
  is finished, regardless of whether it was passed or skipped in the lesson.
- Reviewable interaction types: `predict`, `choice`, `match`, `sort`,
  `order`, `scenario`.
- Not reviewed: `repair`, `self-grade`, `exercise` and `reflection`. They
  are too long or not gradable.
- Authors may mark a checkpoint `review: false` (a one-off that doesn't
  bear repeating) or supply **variants**: alternative stems with the same
  answer, or alternative option orders. Variants make a review test the idea
  rather than recognition of the wording.

## Schedule

Five stages, shown to the learner as five pills.

| Stage | Due after last pass |
| ----- | ------------------- |
| 1     | 1 day               |
| 2     | 3 days              |
| 3     | 7 days              |
| 4     | 21 days             |
| 5     | 60 days, then done  |

| Event                 | Effect                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Lesson finished       | Each of its checkpoints enters at stage 1, due one day later                                                       |
| Pass                  | Item moves up one stage. Passing stage 5 retires the item (`done`) and keeps it visible in the learner's reference |
| Fail or Give Up       | Item drops to stage 1, due tomorrow                                                                                |
| "See this sooner"     | Item drops one stage                                                                                               |
| "See this less often" | Item rises one stage                                                                                               |
| Comfort level `less`  | New items enter at stage 1 and are due in the learner's next session, even the same day                            |
| Comfort level `more`  | New items enter at stage 2                                                                                         |

- The frequency control is the only manual knob, and it is per item, offered
  after answering.
- Comfort level has no other coupling to reviews.
- A session shows at most **12 due items**, oldest due first. The page
  says how many remain.
- The site doesn't limit lessons per day, and only offers a suggestion after two lessons in
  one sitting.

## Where reviews surface

| Place                      | Surface                                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Course page                | A "Review due: N items" card above the lesson graph when N > 0. The card links to the review page for that course. Also a small count in the sidebar group header.                                                             |
| Landing page and path page | One line per course with due items                                                                                                                                                                                             |
| Tutor mode                 | At session start, if items are due, the tutor asks one recall question before anything else. The tutor reads the exported progress file if the learner has exported it, otherwise it asks the learner to open the review page. |
| Routing                    | Per the topic map: an item failed twice in a row marks its objective "behind" in the path lanes and offers the section that teaches it                                                                                         |

## The review page

One page per course at `/<area>/<course>/review/`.

1. A short reminder of answer formats for this course.
2. Items one at a time, each showing the stem, the interaction, **Run** or
   **Check**, **Hint**, **Give Up**.
   - Hint is the checkpoint's diagnostic hint, never the answer.
   - Give Up is enabled after one attempt, shows the answer and rationale,
     and counts as a fail. Give Up exists only here, never in lessons.
   - Each item records exactly one result per review session. A correct
     Check records a pass. A wrong Check doesn't record a result yet: the learner
     may retry or Give Up, and Give Up records the fail. Once a
     result is recorded, Check and Give Up are both disabled.
3. After each answer: the lesson link, the five-pill stage, and the frequency
   control.
4. **Finish review** returns to the course page.

A progress bar in the header counts the items in this session.

## Storage

The schedule is stored in the progress record's `reviews` map, keyed by
checkpoint id, with the structure shown in the progress record spec.

| Field     | Meaning                                                                                |
| --------- | -------------------------------------------------------------------------------------- |
| `stage`   | 1 to 5, or `done`                                                                      |
| `due`     | ISO calendar day in the learner's local time zone; the item is due when `due <= today` |
| `last`    | `pass` or `fail` (Give Up records `fail`)                                              |
| `history` | Results, oldest first, capped at the last 20                                           |

- Because the schedule is inside the progress record, it moves with the
  learner by export and import, and it resets when the record resets.
- The site has no server and doesn't send notifications or email, so a learner who
  doesn't come back isn't reminded. This is a known limit. Tutor mode is the only active
  reminder, and only when the learner opens a session.

## Content changes

| Change                         | Effect                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| A checkpoint's id changes      | Its review item is orphaned and dropped silently on next load, as for every progress entry       |
| A checkpoint's answer changes  | Authors bump a `revision` field on the checkpoint; items with an older revision reset to stage 1 |
| Progress record version bumped | All reviews reset with the rest of the record                                                    |

## Related specs

- [S01 Project dictionary](S01-dictionary.md): checkpoint, review, review
  item, comfort level, interaction types.
- [S02 Topic map and competencies](S02-topic-map.md): the course page that
  shows the review due card, and the routing rule for items failed twice.
- [S04 Progress record](S04-progress-record.md): where the schedule is
  stored and how it moves between browsers.

## Open questions

1. Whether skipped-in-lesson checkpoints should enter review at all, or first
   require a pass in the lesson. Leaning: enter, because skipping is often "I
   know this", and a review is how we find out.
2. Whether Foundations courses should review at all, because knowledge-worker
   learners may take one course and leave. Leaning: yes, but keep sessions
   to five items for Foundations.
3. Whether to allow reviewing across courses in one session. Leaning: no
   until there are learners with more than one course finished.
4. Intervals and the pass rule are first guesses, to tune once there are
   learners.
