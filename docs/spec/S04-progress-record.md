# Progress record (S04)

**Purpose:** Define the learner's progress record: what it stores, where it
lives, how it is versioned, and how it moves between browsers.

**Status:** In progress - the record, its storage key, lesson states, checkpoint
states, the review map, comfort level, progress display, the skills check,
export, import and reset are implemented (2026-09-20). Record version 2
(review `history` entries carry the day) and the migration from version 1 on
load and on import are implemented (2026-09-20). The `practice` map and the
`served` field of a review `history` entry are implemented, in version 2
(2026-09-24). Deferred: goals and quizzes exist in the record format only,
with no page that writes them.

## Introduction

Terms are per the [project dictionary](S01-dictionary.md). The record
drives the node states on the lesson graph and topic map and the path lanes
described in the [topic map](S02-topic-map.md), and it is what tutor mode
reads when the learner exports it.

## Principles

- **Browser only.** The record is one JSON document in browser local
  storage. The site runs without a server, an account, or telemetry.
- **The record leaves the browser only** when the learner exports the file.
- **The answer is in the page.** A static site can't hide answer keys, so
  the record tracks passes on the honor system and doesn't contain secrets.
- **Resettable.** The learner can reset one course or the whole record,
  after a confirmation.

## What gets recorded

| Per        | Fields                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lesson     | `state`: `read`, `finished` or `skipped`; the date it changed                                                                                                           |
| checkpoint | `state`: `passed`, `skipped` or `attempted`; the number of attempts                                                                                                     |
| review     | Per checkpoint: `stage`, `due`, `last`, `history`. Each `history` entry is `{ "at": <day>, "result": "pass" or "fail" }`, oldest first. Written by the review schedule. |
| practice   | Per `practice` checkpoint: `state` and attempts, as for a checkpoint, in their own map. Not counted anywhere else.                                                      |
| habit      | Per habit: `next`, `history`. Written by the habit schedule, set in a later spec.                                                                                       |
| quiz       | Per course: score and date                                                                                                                                              |
| learner    | Chosen comfort level, chosen goals                                                                                                                                      |

### Lesson states

| Stored     | Meaning                                                       | Shown on the graph as |
| ---------- | ------------------------------------------------------------- | --------------------- |
| (absent)   | Never opened                                                  | untouched             |
| `read`     | Opened, recap not reached                                     | in progress           |
| `finished` | Recap reached with every `first` checkpoint passed or skipped | finished              |
| `skipped`  | Learner marked "I know this"; not counted as finished         | skipped               |

### Checkpoint states

| Stored      | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| `attempted` | Answered wrong at least once, not yet passed, or skipped |
| `passed`    | Answered right                                           |
| `skipped`   | Skip pressed; recorded, never counts as a pass           |

### Progress display

Every progress figure on the site comes from one rule, so that the landing
page bar, the progress page, the course completion ring and the course
milestone bar always show the same number for the same record.

- **Percent** = finished lessons / (all lessons − skipped lessons), rounded
  to a whole number. With no lessons left to count, it is 0.
- **Lessons only.** A lesson is `finished` only when every `first`
  checkpoint is passed or skipped, so a checkpoint isn't a separate unit and
  doesn't add to the count. A `review` or `practice` checkpoint (S01
  "Checkpoint") counts toward no figure on the site: not finishing, not a
  percent, not a node ring, and not a checkpoint count.
- **Skipped** lessons are out of both sides of the percent. A surface that
  shows the percent shows skipped as a separate count ("2 skipped") when it
  isn't zero.
- **Per-lesson node ring** on the lesson graph shows passed `first` checkpoints / that lesson's `first` checkpoints. That's detail within one lesson and isn't a
  progress unit.
- **Continue button**: it links to the first lesson in path order that is
  neither finished nor skipped. Path order is the order of the course file
  (`site/src/data/areas/<area>/courses/<area>.yaml`), courses in site order. When no
  such lesson is left and at least one is finished and one is skipped, it says
  "All lessons finished, N skipped" and links to the first skipped lesson. When
  every lesson is skipped and none finished, it offers the first skipped lesson
  as the normal next lesson. When every lesson is finished and none skipped, it
  links to the topic map.
- **Review stage** doesn't feed any progress number. It surfaces on the
  review due card only ([S05](S05-spaced-review.md)).

The shared computation is `progressPercent()` in `site/src/scripts/overview.ts`,
which both the overall bar and the course graph import.

### Skills check

The skills check is the `more` comfort level's routing effect from the
[dictionary](S01-dictionary.md) ("Comfort level"): a learner who already
knows the material passes the lesson's checkpoints up front and moves on. It
is in this spec because it writes checkpoint states, and the review item it
creates follows the [spaced review](S05-spaced-review.md) rules unchanged.

- **Item choice.** One checkpoint per objective in the lesson's `serves`,
  in `serves` order: the lesson's first `first`-phase checkpoint for that
  objective that is reviewable, else its first `first`-phase checkpoint of
  any kind. Alternates are never asked. An objective without
  a checkpoint contributes nothing. The choice is made at build time from
  the lesson source, so the card and the lesson body always agree.
- **Who sees it.** Only a learner whose record has `comfort: more`, and only
  on Engineering lessons, because Foundations has no comfort levels. The
  card sits at the top of the lesson, above the body.
- **Skip rule.** An objective whose chosen checkpoint is already `passed`
  is not asked. When every chosen checkpoint is passed, no check is offered
  and the card stays hidden.
- **Offered, never forced.** The card reads "Skip ahead?" with a button
  "Answer N questions" and a button "Not now". Nothing happens until the
  learner presses the first. "Not now" hides the card for this page view,
  and nothing about the dismissal is stored, so the offer returns on the
  next visit while a chosen checkpoint is still open.
- **The questions.** The card shows a copy of each chosen checkpoint's
  markup, with Hint but without Skip, and each copy takes one Check. The
  copy records under the same checkpoint id as the lesson body.
- **Pass.** The checkpoint is recorded `passed` and counts one attempt,
  exactly as if answered in the body, and the body copy shows as passed at
  once. If the checkpoint is reviewable, its review item is created right
  then, under the "Lesson finished" rules of the spaced review spec (the
  comfort level's initial stage and due date). Finishing the lesson later
  leaves that item's schedule alone.
- **Fail.** The checkpoint is recorded `attempted` and counts one attempt,
  no review item is created, and the lesson proceeds as normal: the body
  copy is still open, with unlimited retries there.
- **Copies.** The card's copies carry the body checkpoint's progress id,
  and their nested ids and input names are prefixed so the page keeps
  unique ids and separate radio groups. The skip rule is applied against
  the record when the learner presses the button, so a checkpoint passed
  in the body after the page loaded is not asked, and the button's count
  follows.
- **After the last answer** the card says how many passed, and its dismiss
  button reads "Close".

## Storage

- Key: `ai-training-progress-v<N>`. Bump `N` when the meaning of a stored
  field changes, not when content is added. The current version is 2.
- Migration. Each bump comes with a step that brings a record from the
  version before it to the new one, and the steps run in a chain (1 to 2,
  later 2 to 3) on load and on import. When nothing is stored under the
  current key, load reads the newest older key that has a migration,
  migrates the record and writes it under the current key. The old key is
  left in place for a manual export until a reset, which removes every
  key. Once the current key holds a record it wins, and the old key is
  never read again. A record of a version with no migration (a future one,
  or one older than the chain reaches) starts fresh, and its key is left in
  place too.
- Version 1 to 2: a review `history` entry was a bare `"pass"` or `"fail"`
  and becomes `{ "at", "result" }`. The `at` day is worked back from the
  item's `due` and `stage`: a pass at stage `n` was due `n`'s interval
  later, a fail was due the next day, and a retired or never answered item
  gives `due` itself. Every entry of one item gets that same day, because
  version 1 kept no other date.
- The `practice` map and the `served` field joined version 2 on 2026-09-24 without a bump, because they add data and change the meaning of nothing stored. A record
  without them reads as before, and a site from before the change drops
  them on load.
  - `practice`: a map like `checkpoints`, keyed `<lesson>#<checkpoint>`,
    for `practice` checkpoints only. Absent reads as empty.
  - `served` on a review `history` entry: the id (within its lesson) of the
    `review` alternate the review page asked in place of the item's own
    checkpoint. Absent means the item's own checkpoint was asked.
- Dates are ISO calendar days in the learner's local time zone.
- Shape:

```json
{
  "version": 2,
  "comfort": "less",
  "goals": [{ "competency": "building-agents/builds-agent-loop", "level": "base" }],
  "lessons": {
    "using-agents/delegating": { "state": "finished", "at": "2026-09-20" }
  },
  "checkpoints": {
    "using-agents/delegating#fix-the-brief": { "state": "passed", "attempts": 2 }
  },
  "reviews": {
    "using-agents/delegating#fix-the-brief": {
      "stage": 2,
      "due": "2026-09-23",
      "last": "pass",
      "history": [
        { "at": "2026-09-12", "result": "fail" },
        { "at": "2026-09-13", "result": "pass", "served": "sort-the-briefs" },
        { "at": "2026-09-20", "result": "pass" }
      ]
    }
  },
  "practice": {
    "using-agents/delegating#brief-for-a-colleague": { "state": "attempted", "attempts": 1 }
  },
  "quizzes": {
    "using-agents": { "score": 0.9, "at": "2026-09-21" }
  }
}
```

## Export and import

- Export downloads the whole record as one JSON file, including `version`.
- Import replaces the record with the file's contents after a confirmation.
- A file with an older `version` is migrated through the same chain as
  Storage describes (version 1 files migrate to 2), and a file of any other
  version is refused with a message naming the versions.
- Both live on one progress page, which is linked from the course page and the
  sidebar.

## Content changes

| Change                            | Effect                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| A lesson or checkpoint id changes | Its entries are orphaned and dropped silently on next load; keep ids stable |
| A `review` alternate is removed   | A `served` entry that names it stays, as history; nothing reads it again    |
| Content added                     | Nothing; new ids simply have no entry                                       |
| A stored field changes meaning    | Bump `N` and add the migration step from `N - 1`                            |

## Related specs

- [S01 Project dictionary](S01-dictionary.md): progress, checkpoint,
  comfort level, goal, identifiers.
- [S02 Topic map and competencies](S02-topic-map.md): the node states and
  path lanes rendered from this record.

## Open questions

1. Whether to keep the `attempts` count at all; it is not shown anywhere
   yet. Leaning: keep, it is cheap and useful for tuning checkpoints.
2. Whether a lesson may be `finished` with a skipped checkpoint, or only
   `read`. Leaning: finished; skipping is a deliberate choice, and the
   review schedule catches it later.
