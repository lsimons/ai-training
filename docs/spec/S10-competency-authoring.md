# Competency authoring (S10)

**Purpose:** Fix how a competency, its learning objectives and behaviors, and
the alignment rows that point at them are written as data: one file per
competency inside its area, one file per external framework for the rows.

**Status:** Implemented (2026-09-21). The per-competency files, the
`alignment/` directory, the competency page reading both, and the
`mise run data` check are in place.

## Introduction

Terms are per the [project dictionary](S01-dictionary.md). A
**competency** is something a learner can do, stated as a verb phrase. It
owns three to six **learning objectives**, each with a **level**, and two to
six **behaviors** (claim, why, example). An **alignment** row maps an
external framework's item to the objectives here that address it. The
[topic map](S02-topic-map.md) lists the competencies and objectives; this
spec fixes the files. [S09](S09-area-authoring.md) defines the area
directory that holds them.

Before 2026-09-21 one file per area held every competency of the area as a
list, and an alignment row pointing at objectives of three competencies
was copied under each of them. The copies drifted apart. Now each
competency is its own file, and each framework's rows are written once.

## Competency file

`site/src/data/areas/<area>/competencies/<competency>.yaml`:

```yaml
id: safety/verifies-output
area: safety
statement: Verifies AI output before relying on it
topics: [safety/failure-modes, safety/verification]
objectives:
  - id: safety/verifies-output/checks-claims
    statement: Checks claims and sources on anything that leaves their desk
    level: base
    behaviors:
      - claim: Every specific claim in AI output that leaves the learner's desk is checked against a source.
        why: Specifics are what the model invents most convincingly and what the reader acts on.
        example: Before forwarding a summary, the learner opens the two figures it quotes and finds one is from last year.
```

| Field          | Required | Holds                                                                                             |
| -------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `id`           | yes      | `<area>/<competency>`: the directory name, then the file stem. Verb-led (S01 "Identifiers").     |
| `area`         | yes      | The area slug, equal to the directory.                                                            |
| `statement`    | yes      | The verb phrase. The competency page title and the "Goals" entry on the lesson graph.             |
| `topics`       | yes      | The topic ids it draws on, from any area. Each must exist.                                        |
| `objectives`   | yes      | One or more, in the order the page lists them. See below.                                         |
| `notes`        | no       | Free prose for authors. Never rendered.                                                           |

Each objective:

| Field       | Required | Holds                                                                                          |
| ----------- | -------- | ---------------------------------------------------------------------------------------------- |
| `id`        | yes      | `<competency id>/<objective>`, verb-led. The tail after the last slash is the page anchor.     |
| `statement` | yes      | The verb phrase, shown as "You can now..." in the recap of a lesson that serves it.            |
| `level`     | yes      | `base` or `expert` (S01 "Levels").                                                             |
| `behaviors` | no       | The claim, why, example triples (S01 "Behavior triple"). Empty means "not written yet".        |

The schema is strict at every level. A misspelled key fails the build.

## Alignment

`site/src/data/alignment/<framework>.yaml`, one file per external framework:

```yaml
id: ai-fluency-4d
framework: AI Fluency 4D (Dakan and Feller)
rows:
  - code: Discernment
    asks: Judge the output, the process and the behavior of the AI critically
    objectives:
      - concepts/explains-models/names-failure-modes
      - safety/verifies-output/checks-claims
```

| Field               | Holds                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `id`                | The file stem, kebab-case.                                                                 |
| `framework`         | The framework's name as the S02 "Alignment" section cites it.                              |
| `rows[].code`       | The framework's own item code or name (`INC-2`, `Discernment`).                            |
| `rows[].asks`       | What the item asks for, paraphrased in our words (S02 "Frameworks").                        |
| `rows[].objectives` | The objective ids here that address it, each written out in full as an objective id.         |

A row is written once. The competency page shows the rows that name one of
its objectives, with the column "Objectives here" reduced to that
competency's own. S02 "Rows" stays the human summary of the same rows and
may abbreviate with `*`. The YAML lists every objective in full.

## Check

`mise run data` fails when

- a competency file's `id` isn't `<area>/<stem>` or its `area` isn't the
  directory;
- a competency draws on a topic id that doesn't exist;
- an objective id isn't under its competency's id;
- an alignment file's `id` isn't its file stem, or a row names an id that
  isn't an objective.

The collection schemas reject the rest: a missing statement, a level other
than `base` or `expert`, a behavior without all three parts, an empty
`objectives` list, or an unknown key.

## Related specs

- [S01 Project dictionary](S01-dictionary.md): competency, learning
  objective, behavior, level, alignment, identifiers.
- [S02 Topic map and competencies](S02-topic-map.md): the competencies and
  objectives themselves, and the frameworks the rows come from.
- [S09 Area authoring](S09-area-authoring.md): the directory that holds the files.

## Open questions

1. Whether a competency should list the lessons that serve it. Leaning: no.
   The page derives that from the lesson files (S11), and S02 "Lesson
   frontmatter" says lesson lists are never stored twice.
