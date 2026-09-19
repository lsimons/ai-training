# 000 - Specs

This document is the entry point for the *AI Training* specifications.

Specs are the durable design record of the site: what it contains, what it
teaches, how it measures learning, and how it brings learners back. Each spec
reads completely on its own.

## Spec index

| #   | Title                                          | Purpose                                                                                                                                                                                                                              | Status |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| S01 | [Project dictionary](S01-dictionary.md)        | Fix the words this project uses for its content, its knowledge model, its interactions and its learners, so that pages, the sidebar, the topic map, the progress record and tutor mode all mean the same thing by the same name.     | Draft  |
| S02 | [Topic map and competencies](S02-topic-map.md) | Name what the site teaches (topics and concepts, with prerequisite links), name what a learner should be able to do afterwards (competencies, objectives, behaviours), say how the map differentiates, and pick the release-1 slice. | Draft  |
| S03 | [Spaced review](S03-spaced-review.md)          | Define how the site brings a learner back to what they learned, without a backend: which items are reviewed, on what schedule, where reviews surface, and what is stored.                                                            | Draft  |

## Naming scheme

- Spec files are named `SNN-<slug>.md`, for example `S01-dictionary.md`.
- Numbers are assigned in order, starting at 1, zero-padded to two digits,
  and are never reused or renumbered.
- The slug is lowercase kebab-case and may change if the title changes; the
  number may not.
- This index is `000-specs.md`.

## Reading order and cross-references

- Specs are numbered in dependency order. A spec may refer back to a
  lower-numbered spec and must not refer forward to a higher-numbered one.
  When a later spec needs a term or rule, it links back; when an earlier
  spec would need a later detail, it states only what it needs and leaves
  the detail to the later spec without naming it.
- Every spec uses the terms of [S01 Project dictionary](S01-dictionary.md).
- Cross-references are relative links with the spec's title, for example
  `[project dictionary](S01-dictionary.md)`. Inside tables, use the number:
  `[S01](S01-dictionary.md)`.
- Specs must not link to `docs/plan/` and must not depend on a plan or an
  exploration note to be understood. Copy the rule, concept or idea into
  the spec. Naming an external source in prose (CS50, Diátaxis, Execute
  Program) is fine; linking to internal working notes is not.

## Shape of a spec

1. `# SNN - Title`
2. `**Purpose:**` one or two sentences saying what the spec decides and why.
3. `**Status:**` per the convention below.
4. `## Introduction`: the context a reader needs, including where the
   design's ideas came from.
5. The body: headers and subheaders, with tables and lists preferred over
   long paragraphs. A worked example wherever a rule is easy to misread.
6. `## Related specs`: links back to the lower-numbered specs relied on
   (omitted in S01).
7. `## Open questions`: numbered, each with the current leaning.
8. `## Out of scope`, optional.

## Status convention

The `**Status:**` line uses one of these forms. The matching row in the
index above mirrors the same string.

| Form                                            | Meaning                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Draft`                                         | Design still in flux                                                                   |
| `In progress - <what has shipped>`              | Partial implementation; say what has shipped and what is deferred                      |
| `Accepted - <note>`                             | Design accepted, no code yet                                                           |
| `Implemented (YYYY-MM-DD)`                      | Shipped; the date is the commit date of the last implementing commit                   |
| `Superseded by [SNN](SNN-slug.md) (YYYY-MM-DD)` | Replaced by a later spec; keep the file and add a short "Superseded" note near the top |

## How to add a spec

1. Check `docs/spec/` for a spec that already covers the feature. Amend it
   rather than adding a new one.
2. Pick the next free number and create `SNN-<slug>.md` following the shape
   above.
3. Add a row to the spec index in this file.
4. Commit with a `docs(spec):` prefix.
