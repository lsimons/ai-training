# 003 - Spaced review

**Purpose:** Define how the site brings a learner back to what they learned,
without a backend: which items are reviewed, on what schedule, where reviews
surface, and what is stored. Modelled on Execute Program's reviews
([explore/10](../plan/explore/10-execute-program.md)) and the `/teach`
skill's review queue ([explore/06](../plan/explore/06-lesson-inventory.md)).
Vocabulary per [spec 001](./001-dictionary.md).

**Status:** Draft, 2026-09-19. Intervals and the pass rule are first guesses
to tune once there are learners.

## Why

Retention is the point of a training site, and every source we studied
except Diátaxis has a repetition mechanism: CS50 has weekly quizzes and
problem sets, the Anthropic modules have cumulative tasks, `/teach` has a
recall queue, Execute Program has scheduled reviews and says they take under
10% of study time. Interactive lessons alone produce recognition, not
recall.

## What is reviewed

- Every **checkpoint** in a lesson becomes a **review item** when the lesson
  is finished, regardless of whether it was passed or skipped in the lesson.
- Reviewable interaction types: `predict`, `choice`, `match`, `sort`,
  `order`, `scenario`. `repair`, `self-grade`, `exercise` and `reflection`
  are not reviewed; they are too long or not gradable.
- Authors may mark a checkpoint `review: false` (a one-off that does not
  bear repeating) or supply **variants**: alternative stems with the same
  answer or alternative option orders, so a review does not become
  recognition of the wording.

## Schedule

Five stages, shown to the learner as five pills, as in Execute Program.

| Stage | Due after last pass |
| ----- | ------------------- |
| 1     | 1 day               |
| 2     | 3 days              |
| 3     | 7 days              |
| 4     | 21 days             |
| 5     | 60 days, then done  |

- A new review item starts at stage 1, due one day after the lesson is
  finished.
- **Pass** moves the item up one stage. Passing stage 5 retires the item
  (`done`), still visible in the learner's reference.
- **Fail** or **Give Up** drops the item to stage 1, due tomorrow.
- **Adjust frequency**, per item, after answering: "see this sooner" drops
  one stage, "see this less often" raises one stage. This is Execute
  Program's control and is the only manual knob.
- A comfort level of `less` (spec 001) starts items at stage 1 with the
  stage-1 interval halved to the same day's next session; `more` starts at
  stage 2. No other coupling.
- Due items are capped at **12 per session**; the oldest due first. The
  page says how many remain. There is no daily limit on lessons, only a
  suggestion after two lessons in one sitting, as Execute Program does.

## Where reviews surface

- **Course page**: a "Review due: N items" card above the lesson graph when
  N > 0, leading to the review page for that course. Also in the sidebar
  group header as a small count.
- **Landing page and path page**: one line per course with due items.
- **Tutor mode**: at session start, if items are due, one recall question
  is asked before anything else (already in `/teach`); the skill reads the
  same exported progress file if the learner has exported it, otherwise it
  asks the learner to open the review page.
- **Routing** (spec 002): an item failed twice in a row marks its objective
  "behind" in the path lanes and offers the section that teaches it.

## The review page

One page per course at `/<area>/<course>/review/`. Structure copied from
Execute Program because it works:

1. A short reminder of answer formats for this course.
2. Items one at a time, each showing the stem, the interaction, **Run** or
   **Check**, **Hint**, **Give Up**. Hint is the checkpoint's diagnostic
   hint, never the answer. Give Up is enabled after one attempt, shows the
   answer and rationale, and counts as a fail. Give Up exists only here,
   never in lessons.
3. After each answer: lesson link, the five-pill stage, and the frequency
   control.
4. **Finish review** returns to the course page.

A header progress bar counts items in this session.

## Storage

Inside the progress record (spec 001), keyed by checkpoint id:

```json
"reviews": {
  "using-agents/delegating/writes-a-brief#fix-the-brief": {
    "stage": 2,
    "due": "2026-09-23",
    "last": "pass",
    "history": ["fail", "pass", "pass"]
  }
}
```

- Dates are ISO calendar days in the learner's local time zone; a review is
  due when `due <= today`.
- `history` is capped at the last 20 results.
- The whole record is inside the single versioned local-storage key and the
  export/import JSON file, so reviews move with the learner between
  browsers by hand.
- No server, no notifications, no email. A learner who does not come back
  is not reminded. This is a known limit; the tutor-mode skill is the only
  active reminder, and only when the learner opens a session.

## Content changes

- When a checkpoint's id changes, its review item is orphaned and dropped
  silently on next load. Authors keep checkpoint ids stable for this reason.
- When a checkpoint's answer changes, authors bump a `revision` field on the
  checkpoint; items with an older revision reset to stage 1.
- Bumping the progress storage key version resets all reviews; do it only
  when the schema changes, not for content.

## Open questions

- Whether skipped-in-lesson checkpoints should enter review at all, or
  first require a pass in the lesson. Leaning: enter, because skipping is
  often "I know this", and a review is how we find out.
- Whether Foundations courses should review at all, given knowledge-worker
  learners may take one course and leave. Leaning: yes, but keep sessions to
  five items for Foundations.
- Whether to allow reviewing across courses in one session. Leaning: no
  until there are learners with more than one course finished.
