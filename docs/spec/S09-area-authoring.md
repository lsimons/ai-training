# Area authoring (S09)

**Purpose:** Fix how a group and an area are declared as data: which file
holds which fact, what derives from the directory tree, and what the check
rejects. This is the top of the data tree that S10 (competencies) and S11
(courses and lessons) sit in.

**Status:** Implemented (2026-09-21). `groups.yaml`, one `area.yaml` per
area, the generated course and topic sidebars, and the `mise run data`
check are in place.

## Introduction

Terms are per the [project dictionary](S01-dictionary.md): a **group** is
one of the two top-level sidebar groups, and an **area** is one of the six
subjects. Each area has its own topics, competencies, courses, and lessons.
The [topic map](S02-topic-map.md) says what the areas are and what each
teaches. This spec says where that's written down and how the site reads
it.

Before 2026-09-21 the area list was a TypeScript constant, the sidebar
listed every area and lesson by hand, and each course page repeated the
area's title and description in its frontmatter. The same fact in three
places drifted. The facts now live in one data tree and everything else
reads from it.

## The data tree

Everything the site teaches is data under `site/src/data/`. The area is
the top-level divider, because every topic, competency, course, and lesson
belongs to exactly one area. Only references cross areas: a competency
draws on topics anywhere, a lesson assumes objectives anywhere, and an
alignment row names objectives anywhere.

```text
site/src/data/
  groups.yaml                          the two groups and their area order
  bibliography.yaml                    citation keys (S03)
  alignment/<framework>.yaml           alignment rows per framework (S10)
  areas/<area>/
    area.yaml                          the area's facts
    topics/<topic>.yaml                one topic (S02)
    competencies/<competency>.yaml     one competency (S10)
    courses/<course>.yaml              one course (S11)
    lessons/<lesson>.yaml              one lesson plan (S11)
```

Ids and paths agree everywhere. A file at `areas/safety/topics/agent-risk.yaml`
has `id: safety/agent-risk` and `area: safety`, and the check rejects any
disagreement. The directory is the source of truth for *where* a thing
belongs, and the `id` field repeats it so a file reads on its own.

The files under `areas/<area>/` are what a directory listing shows. An
area file never lists its topics, competencies, courses or lessons, so
adding one is adding one file.

## Groups

`site/src/data/groups.yaml` is a list, one entry per group:

```yaml
- id: foundations
  order: 1
  name: Foundations
  audience: Everyone
  description: Written at one level for every knowledge worker. No lesson needs programming or agent configuration.
  areas: [concepts, safety, using-agents]
- id: engineering
  order: 2
  name: Engineering
  audience: Software engineers
  description: For software engineers who have finished Foundations, at two comfort levels.
  areas: [coding-with-agents, customizing-agents, building-agents]
```

| Field         | Holds                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `id`          | `foundations` or `engineering`. The comfort levels of S01 apply to the `engineering` group only.    |
| `order`       | Display order, unique per group. A collection comes back in no fixed order, and the file states it. |
| `name`        | The sidebar label.                                                                                  |
| `audience`    | Who the group is written for, as the S02 area table states it.                                      |
| `description` | One or two sentences on the group's level and what it assumes.                                      |
| `areas`       | The group's area slugs in display order. The order of areas is written here and nowhere else.       |

## Area file

`site/src/data/areas/<area>/area.yaml`:

```yaml
id: safety
name: Safety
group: foundations
description: Using AI safely, and judging the risk of letting an agent act.
notes: >-
  Safety is not a first-class track in any source course, so most of the
  area is new material.
```

| Field         | Required | Holds                                                                                                      |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `id`          | yes      | The area slug, equal to the directory name.                                                                |
| `name`        | yes      | The display name: the sidebar entry, the course page title, the column head on the topic map.              |
| `group`       | yes      | The group id. Must match the group whose `areas` list names this area.                                     |
| `description` | yes      | One sentence. The course page's description, the front page card, and the about panel on the lesson graph. |
| `notes`       | no       | Free prose for authors: why the area is shaped as it is. Never rendered.                                   |

The schema is strict, and a key not in this table fails the build. A fact
that has no field gets a field, never a comment.

## What reads the tree

| Reader                                                               | Uses                                                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| The `groups` and `areas` collections                                 | Check the two files at build. `site/src/lib/areas.ts` joins them into the area list in group order and rejects a mismatch.   |
| The sidebar (`site/astro.config.mjs`)                                | One sidebar group per S01 group, each area's course page, then its live lessons per S11 "Sidebar". The topic group per area. |
| The course page (`<area>/index.mdx`)                                 | Gets `title` and `description` from `area.yaml` through the docs loader. The MDX has no frontmatter of its own.              |
| The topic map, the reference, the review pages, the progress catalog | Iterate the areas in group order.                                                                                            |

## Check

`mise run data` (`site/scripts/lib/data.mjs`, part of `mise run ci`) fails
when

- `groups.yaml` names an area with no directory, lists one twice, or gives
  two groups the same `order`;
- an area directory is in no group;
- an area file is missing, or its `id` isn't the directory name, or its
  `group` isn't the group that lists it;
- `<area>/index.mdx` sets `title` or `description` in its frontmatter.

The rest of the check, per topic, competency, course and lesson, is in
S10 and S11.

## Related specs

- [S01 Project dictionary](S01-dictionary.md): group, area, comfort level.
- [S02 Topic map and competencies](S02-topic-map.md): which areas exist,
  their audience, and the topic file format that sits in the tree.

## Open questions

1. Whether a group needs a page of its own. Leaning: no. A group is a
   sidebar label, and the front page explains both.
