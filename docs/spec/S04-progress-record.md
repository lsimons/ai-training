# Progress record (S04)

**Purpose:** Define the learner's progress record: what it stores, where it
lives, how it is versioned, and how it moves between browsers.

**Status:** In progress - the record, its storage key, lesson states, checkpoint
states, the review map, comfort level, progress display, export, import and
reset are implemented (2026-09-20). Record version 2 (review `history`
entries carry the day) and the migration from version 1 on load and on
import are implemented (2026-09-20). Deferred: goals and quizzes exist in the record
shape only, with no page that writes them.

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
| habit      | Per habit: `next`, `history`. Written by the habit schedule, set in a later spec.                                                                                       |
| quiz       | Per course: score and date                                                                                                                                              |
| learner    | Chosen comfort level, chosen goals                                                                                                                                      |

### Lesson states

| Stored     | Meaning                                               | Shown on the graph as |
| ---------- | ----------------------------------------------------- | --------------------- |
| (absent)   | Never opened                                          | untouched             |
| `read`     | Opened, recap not reached                             | in progress           |
| `finished` | Recap reached with every checkpoint passed or skipped | finished              |
| `skipped`  | Learner marked "I know this"; not counted as finished | skipped               |

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
- **Lessons only.** A lesson is `finished` only when every checkpoint is
  passed or skipped, so a checkpoint isn't a separate unit and doesn't add to
  the count.
- **Skipped** lessons are out of both sides of the percent. A surface that
  shows the percent shows skipped as a separate count ("2 skipped") when it
  isn't zero.
- **Per-lesson node ring** on the lesson graph stays passed checkpoints /
  that lesson's checkpoints. That is detail within one lesson and isn't a
  progress unit.
- **Continue button**: it links to the first lesson in path order that is
  neither finished nor skipped. Path order is the order of the course plan
  file (`site/src/data/courses/<area>.yaml`), courses in site order. When no
  such lesson is left and at least one is finished and one is skipped, it says
  "All lessons finished, N skipped" and links to the first skipped lesson. When
  every lesson is skipped and none finished, it offers the first skipped lesson
  as the normal next lesson. When every lesson is finished and none skipped, it
  links to the topic map.
- **Review stage** doesn't feed any progress number. It surfaces on the
  review due card only ([S05](S05-spaced-review.md)).

The shared computation is `progressPercent()` in `site/src/scripts/overview.ts`,
which both the overall bar and the course graph import.

## Storage

- Key: `ai-training-progress-v<N>`. Bump `N` when the meaning of a stored
  field changes, not when content is added. The current version is 2.
- Migration. Each bump comes with a step that brings a record from the
  version before it to the new one, and the steps run in a chain (1 to 2,
  later 2 to 3) on load and on import. When nothing is stored under the
  current key, load reads the newest older key that has a migration,
  migrates the record and writes it under the current key. The old key is
  left in place for a manual export. A record of a version with no
  migration (a future one, or one older than the chain reaches) starts
  fresh, and its key is left in place too.
- Version 1 to 2: a review `history` entry was a bare `"pass"` or `"fail"`
  and becomes `{ "at", "result" }`. The `at` day is worked back from the
  item's `due` and `stage`: a pass at stage `n` was due `n`'s interval
  later, a fail was due the next day, and a retired or never answered item
  gives `due` itself. Every entry of one item gets that same day, because
  version 1 kept no other date.
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
        { "at": "2026-09-13", "result": "pass" },
        { "at": "2026-09-20", "result": "pass" }
      ]
    }
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
