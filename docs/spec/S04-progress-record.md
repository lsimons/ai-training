# Progress record (S04)

**Purpose:** Define the learner's progress record: what it stores, where it
lives, how it is versioned, and how it moves between browsers.

**Status:** In progress - the record, its storage key, lesson states, checkpoint
states, the review map, comfort level, export, import and reset are
implemented (2026-09-20). Deferred: goals and quizzes exist in the record
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

| Per        | Fields                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| lesson     | `state`: `read`, `finished` or `skipped`; the date it changed                      |
| checkpoint | `state`: `passed`, `skipped` or `attempted`; the number of attempts                |
| review     | Per checkpoint: `stage`, `due`, `last`, `history`. Written by the review schedule. |
| habit      | Per habit: `next`, `history`. Written by the habit schedule, set in a later spec.  |
| quiz       | Per course: score and date                                                         |
| learner    | Chosen comfort level, chosen goals                                                 |

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

## Storage

- Key: `ai-training-progress-v<N>`. Bump `N` when the meaning of a stored
  field changes, not when content is added. A bump starts a fresh record and
  leaves the old key in place for a manual export.
- Dates are ISO calendar days in the learner's local time zone.
- Shape:

```json
{
  "version": 1,
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
      "history": ["fail", "pass", "pass"]
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
- A file with an older `version` is migrated when a migration exists and
  otherwise refused with a message naming the versions.
- Both live on one progress page, which is linked from the course page and the
  sidebar.

## Content changes

| Change                            | Effect                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| A lesson or checkpoint id changes | Its entries are orphaned and dropped silently on next load; keep ids stable |
| Content added                     | Nothing; new ids simply have no entry                                       |
| A stored field changes meaning    | Bump `N`                                                                    |

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
