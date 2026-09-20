# Habits (S07)

**Purpose:** Define the habit layer: small tasks a learner does in their own
work after finishing a lesson, on what days the site brings them back, where
they surface, and what the progress record stores about them.

**Status:** Accepted - design decided 2026-09-20, no code yet. The build is
tracked in issue #67.

## Introduction

Terms are per the [project dictionary](S01-dictionary.md). A **habit** is a
small task the learner does in their own work, outside the site, and marks
done or skipped. It differs from an **exercise**, which is done in a
contrived setting as part of the lesson and self-graded against a model
answer. A habit has no model answer and no grade.

Authors declare habits with a component that follows the rules of
[lesson authoring](S03-lesson-authoring.md). The site stores what the
learner did in the [progress record](S04-progress-record.md), and it
brings habits back on the days that [spaced review](S05-spaced-review.md)
uses for its first stages. Reviews test recall of what a lesson taught.
Habits ask the learner to apply it at work, once and then again a few days
later. The lesson then changes what they do as well as what they know.

## Principles

- **Small.** A habit takes minutes and fits inside work the learner is
  doing anyway. It never asks for a new artifact of its own.
- **Honor system.** The learner reports done or skipped. The site can't
  check, and it doesn't ask for evidence.
- **No grade and no ladder.** Done and skipped both move the habit to its
  next date. Nothing resets, nothing scores.
- **Browser only.** Like the rest of the progress record, habits are stored
  in local storage and leave the browser only by export.

## Authoring

Authors add a habit to a lesson with the `<Habit>` component, after the
recap.

| Rule      | Detail                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Count     | Zero, one or two per lesson. A lesson without a natural habit has none.                                                                     |
| Id        | `id` is a lowercase kebab-case slug, unique within the lesson and stable once published, because the progress record hangs off it.          |
| Text      | One or two sentences in the imperative, naming a moment in the learner's own work where the habit applies: "The next time you ..., do ...". |
| Placement | After `<Recap>`, so the learner has finished the lesson before the habit is offered. The component renders the habit card in that position. |
| Scope     | Per lesson only. There is no dated track of habits across a course, and a habit never depends on another habit.                             |

```mdx
<Habit id="name-the-blast-radius">
The next time you hand an agent a task, say out loud what it can reach
before you press enter.
</Habit>
```

The habit id is `<lesson id>#<habit id>`, following the pattern the
dictionary uses for sections and checkpoints, for example
`safety/agent-risk#name-the-blast-radius`. The `#` fragment names a habit
rather than a section, so a habit id must not collide with a section slug in
the same lesson.

## Schedule

A habit resurfaces on three days after its lesson is finished, then retires.
The days are the first three stages of the review schedule.

| Occurrence | Due on                              |
| ---------- | ----------------------------------- |
| 1          | 1 day after the lesson is finished  |
| 2          | 3 days after the lesson is finished |
| 3          | 7 days after the lesson is finished |

| Event                  | Effect                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Lesson finished        | Each of its habits gets an entry with `since` set to that day and `next` to the day after                       |
| Done                   | A `done` result is appended to `history`, and `next` moves to the next occurrence                               |
| Skipped                | A `skipped` result is appended to `history`, and `next` moves to the next occurrence                            |
| Learner is late        | `next` moves to the first occurrence after `since` that is later than today. If none is left, the habit retires |
| Third result recorded  | The habit retires: `next` becomes `null` and the card no longer shows                                           |
| Lesson finished again  | Nothing. An existing entry, retired or not, is kept                                                             |
| Lesson or course reset | The habit entries under that lesson are removed with the rest of its progress                                   |

- The dates are anchored on `since`, the day the lesson was first finished,
  so a learner who comes back on day 5 sees the habit once, and then again
  on day 7. Finishing the lesson again doesn't move `since`.
- A habit is due when `next <= today`. Both results move it forward, so a
  learner is never asked twice about the same occurrence.
- Comfort level has no effect on habits.

## Where habits surface

| Place              | Surface                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lesson page        | The habit card, after the recap. Before the lesson is finished it shows the habit text only. Finished and not yet due: the text and the next date. Due: the text with **Done** and **Skip**. Retired: the text and its results. |
| Course review page | Today's due habits above the review items, each with **Done** and **Skip**. A course with no habits due shows nothing extra.                                                                                                    |
| Progress page      | One line per active habit, grouped under its lesson, showing the habit text, the next date and the results so far.                                                                                                              |
| Tutor mode         | At session start, if a habit is due, the tutor asks whether the learner did it, as part of the same opener that asks a recall question when review items are due. It records nothing itself.                                    |

The review page and the progress page read local storage the same way they
do for reviews. The exported file is for the tutor and for moving between
browsers. There is no notification and no
email, the same limit the review schedule has.

## Storage

Habits are stored in the progress record's `habits` map, keyed by habit id,
alongside the `lessons`, `checkpoints` and `reviews` maps. Adding the map
changes what the record means, so it arrives with the next record version
and a migration that copies an older record and adds an empty `habits` map.

| Field     | Meaning                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `since`   | ISO calendar day in the learner's local time zone on which the lesson was first finished. The three occurrences are counted from it, and it never changes |
| `next`    | ISO calendar day in the learner's local time zone when the habit is next due, or `null` once the habit has retired                                        |
| `history` | Results, oldest first, each `{ "at": <ISO day>, "result": "done" or "skipped" }`. Capped at three entries, one per scheduled occurrence                   |

Worked example. The learner finished `safety/agent-risk` on 2026-09-20, so
both habits have `since` 2026-09-20 and occurrences on the 21st, 23rd and
27th. They did the first habit on the 21st. On the 25th, two days late for
the second occurrence, they skipped it. The next occurrence is the 27th.

```json
{
  "habits": {
    "safety/agent-risk#name-the-blast-radius": {
      "since": "2026-09-20",
      "next": "2026-09-27",
      "history": [
        { "at": "2026-09-21", "result": "done" },
        { "at": "2026-09-25", "result": "skipped" }
      ]
    },
    "safety/agent-risk#check-the-diff-first": {
      "since": "2026-09-20",
      "next": null,
      "history": [
        { "at": "2026-09-21", "result": "done" },
        { "at": "2026-09-23", "result": "done" },
        { "at": "2026-09-27", "result": "skipped" }
      ]
    }
  }
}
```

The second entry has retired: three results are recorded and `next` is
`null`.

## Content changes

| Change                       | Effect                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A habit's id changes         | Its entry is orphaned and dropped silently on next load, as for every progress entry                                   |
| A habit's text changes       | Nothing. The entry keeps its dates, because there is no answer that could have gone stale                              |
| A habit is removed           | Its entry is orphaned and dropped                                                                                      |
| A habit is added to a lesson | Learners who already finished the lesson never see it. The card shows only for lessons finished after the habit exists |

## Related specs

- [S01 Project dictionary](S01-dictionary.md): habit, exercise, lesson,
  recap, identifiers.
- [S03 Lesson authoring](S03-lesson-authoring.md): the lesson anatomy the
  `<Habit>` component sits in.
- [S04 Progress record](S04-progress-record.md): the record the `habits`
  map is part of, and how it is versioned and moved between browsers.
- [S05 Spaced review](S05-spaced-review.md): the review page that shows
  today's habits, the tutor's recall opener, and the stage days the habit
  schedule reuses.

## Open questions

1. Whether a habit should be offered to learners who finished the lesson
   before the habit was added. Leaning: no, because the finish date would be
   stale and the first occurrence already past.
2. Whether three occurrences are enough for a habit to stick. Leaning: keep
   three until there are learners to ask, and revisit with the review
   intervals.
3. Whether the progress page should show retired habits. Leaning: no, an
   active list is enough, and the lesson page keeps the results.
