# Spaced review (S05)

**Purpose:** Define how the site brings a learner back to what they learned,
without a backend: which items are reviewed, on what schedule, where reviews
surface, and what's stored.

**Status:** In progress - the schedule, one review page per course, Give Up,
stage pills, the per-item frequency control, `review: false`, `revision`
resets, the course review card, the sidebar due count, the due lines on the
landing and progress pages, the tutor's recall question and every reviewable
interaction type (`match` and `multi-choice` included) are implemented
(2026-09-20). Alternates on the review page and the `served` history field
are implemented (2026-09-24). Deferred: the routing rule for items failed
twice.

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

- Every `first` **checkpoint** in a lesson becomes a **review item** when
  the lesson is finished, regardless of whether it was passed or skipped in
  the lesson. A `review` or `practice` alternate (S01 "Checkpoint") never
  becomes a review item of its own.
- Reviewable interaction types: `predict`, `choice`, `multi-choice`,
  `match`, `sort`, `order`, `scenario`.
- Not reviewed: `repair`, `self-grade`, `exercise` and `reflection`. They
  are too long or not gradable.
- Authors may mark a checkpoint `review: false` (a one-off that doesn't
  bear repeating).
- Authors may write `review` alternates: checkpoints in the same lesson
  with the same objective, often of another interaction type, that the
  review page asks in place of the item's own checkpoint. An alternate
  makes a review test the idea rather than recognition of the wording.

### Which checkpoint a review asks

The review item is keyed on its `first` checkpoint, so its schedule,
stage and history don't depend on what was asked. When the item is due,
the review page picks what to ask from the candidates: the item's own
checkpoint, then its lesson's `review` alternates with the same objective,
in page order.

1. Count how often each candidate was asked, from the item's `history`: an
   entry with `served` counts for that alternate, and an entry without it
   counts for the item's own checkpoint.
2. The first alternate that was never asked is picked.
3. When every alternate was asked, the candidate asked least often is
   picked. Among those, the page picks the one whose last ask is oldest,
   and the item's own checkpoint counts as oldest when the history doesn't
   show it. The page rotates through every candidate this way.

The page shows the picked checkpoint as it shows any item: its `context`
goes above the stem, and it gets Give Up and the stage pills. It records
the result against the item, and writes the alternate's id as `served` in
the new `history` entry. If the alternate is missing from the
lesson page, the page asks the item's own checkpoint.

| Example `history` (oldest first)                         | Candidates    | Asked next |
| -------------------------------------------------------- | ------------- | ---------- |
| `[]`                                                     | own, `a`, `b` | `a`        |
| `[{served: a}]`                                          | own, `a`, `b` | `b`        |
| `[{served: a}, {served: b}]`                             | own, `a`, `b` | own        |
| `[{served: a}, {served: b}, {}]`                         | own, `a`, `b` | `a`        |
| `[{}]`, the item had no alternate when it was last asked | own, `a`      | `a`        |

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
| Skills check pass     | That checkpoint enters now, by the same rule, and finishing the lesson later leaves it alone (S04 "Skills check")  |
| Pass                  | Item moves up one stage. Passing stage 5 retires the item (`done`) and keeps it visible in the learner's reference |
| Fail or Give Up       | Item drops to stage 1, due tomorrow                                                                                |
| "See this sooner"     | Item drops one stage                                                                                               |
| "See this less often" | Item rises one stage                                                                                               |
| Comfort level `less`  | New items enter at stage 1 and are due in the learner's next session, even the same day                            |
| Comfort level `more`  | New items enter at stage 2                                                                                         |

- The frequency control is the only manual knob, and it is per item, on the
  settings page, which lists every scheduled item with its stage and due date.
- Comfort level has no other coupling to reviews.
- A session shows at most **12 due items**, oldest due first. The page
  says how many remain.
- The site doesn't limit lessons per day.

## Where reviews surface

| Place                      | Surface                                                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course page                | A "Review due: N items" card above the lesson graph when N > 0. The card links to the review page for that course. Also a small count next to the course's link in the sidebar, hidden when N is 0.                                                                             |
| Landing page and path page | One line per course with due items ("Concepts: 3 items due"), linking to that course's review page. Also on the progress page. Nothing shown when no course has due items.                                                                                                      |
| Tutor mode                 | At session start, if items are due, the tutor asks one recall question before anything else. The tutor can't read browser storage, so it reads the exported progress file if the learner pastes it into the session, and otherwise it asks the learner to open the review page. |
| Routing                    | Per the topic map: an item failed twice in a row marks its objective "behind" in the path lanes and offers the section that teaches it                                                                                                                                          |

## The review page

One page per course at `/<area>/review/`.

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

| Field     | Meaning                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stage`   | 1 to 5, or `done`                                                                                                                                                  |
| `due`     | ISO calendar day in the learner's local time zone; the item is due when `due <= today`                                                                             |
| `last`    | `pass` or `fail` (Give Up records `fail`)                                                                                                                          |
| `history` | Answers as `{ at, result }` (the local day and `pass` or `fail`), oldest first, capped at the last 20. An answer to an alternate adds `served`, the alternate's id |

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
| Progress record version bumped | Reviews migrate with the rest of the record (S04 "Storage") and the schedule is unchanged        |

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
