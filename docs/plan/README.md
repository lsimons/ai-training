# Rough plan: ai-training

Status: **draft, captured at project setup on 2026-09-19; interview decisions
added the same day**. This is the brief as given, the first exploration
round, and the decisions from the approach interview. Specs live in `docs/spec/`;
this file is superseded as they land.

## What this is

An open training suite for getting started with AI, published as a static
[Astro Starlight](https://starlight.astro.build/) site on GitHub Pages. It
should cover, in roughly this order:

1. AI concepts
2. AI safety
3. Using AI agents
4. Using AI agents for AI-assisted software engineering
5. Customizing AI agents
6. Building AI agents

Most content is for engineers. The basic content (concepts, safety, using
agents) is for general knowledge work.

It is public, open source and open content. Decided 2026-09-19: content is
**CC BY-SA 4.0** and code is **Apache-2.0** (including the parts lifted from
`lsimons-template-doc`). An earlier same-day choice of CC BY-NC-SA, made so
CS50 text could be adapted, was reversed: the CC-licensed CS50 material
barely overlaps the six areas, the NC term makes corporate internal training
an ambiguous use, and BY-SA lets Diátaxis, Apache, CC BY and CC BY-SA
material be adapted freely. It replaces two earlier attempts:

- `archive/lsimons-ai-training`: private, Schuberg Philis specific, never got
  past scaffolding. See [explore/01](./explore/01-prior-sbp-training-and-course-compare.md).
- `agent-engineer-course`: a fork of Addy Osmani's course. Addy joined
  Anthropic and is unlikely to maintain the upstream, so the fork becomes a
  rebuild here. See [explore/02](./explore/02-agent-engineer-course.md).

## Sources and what may be done with each

| Source                         | License                | Use here                                                                                                                                                                                                                                         |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent-engineer-course` (fork) | Apache-2.0             | Integrate the best content, with attribution to Addy Osmani, Ivar Soares Urdalen and Leo Simons in `NOTICE.md`.                                                                                                                                  |
| `ai-cs50` (CS50 AI, workshops) | CC BY-NC-SA 4.0        | Ideas, structure and vocabulary with citation. Text may not be adapted into this BY-SA work; a page may be included verbatim, marked with its own license. Workshop talk transcripts are YouTube captions and not licensed; do not redistribute. |
| Diátaxis                       | CC BY-SA 4.0           | Adopt the four kinds and the compass; text may be adapted with attribution. See [explore/08](./explore/08-diataxis.md).                                                                                                                          |
| `ai-anthropic-partners`        | Anthropic, proprietary | Reference and link only, preferring public `academy.claude.com` URLs.                                                                                                                                                                            |
| `ai-deep-learning`             | DeepLearning.AI, paid  | Inspiration for topic coverage and sequencing only. Embed nothing.                                                                                                                                                                               |
| `archive/career-model`         | Apache-2.0 (own)       | Reuse the competency data model and the idea of a visual map.                                                                                                                                                                                    |

See the `explore/` reports for detail on each.

## Product shape

- **Static site on GitHub Pages**, from the `lsimons-template-doc` template
  (Starlight, LSD Warm theme, Quarto decks, pinned toolchain, CI, zizmor).
- **Interactive lesson content** in the style of the Anthropic SCORM modules:
  teaching screens, checkpoints (multiple choice, sorting, scenario
  decisions), watch-out boxes, reflection prompts, recap and quiz. Progress
  and answers kept in browser local storage; no backend.
- **Tutor mode**: run the site on localhost from inside a Claude Code session
  and let Claude act as an interactive tutor. Inspired by the CS50 Duck
  research (topic restriction, hints not answers, show-not-tell, watch for
  instruction dilution) and the experimental `/teach` skill in
  `agent-engineer-course`. See [explore/03](./explore/03-cs50-pedagogy.md).
- **Taxonomy / project dictionary** for tracks, learning journeys, tutorials,
  trainings, courses, lessons, exercises, skills, competencies, concepts,
  goals. Based on the CS50 vocabulary (course, lecture, short, section,
  problem set, lab, project, specification, walkthrough, less/more
  comfortable, correctness/style/design).
- **Visual topic map**, in the spirit of the career-model competency map:
  categories, areas, competencies with prerequisite / related /
  specialization links and base / expert / lead levels. See
  [explore/05](./explore/05-career-model-and-deeplearning-ai.md).
- **Video**, if any is recorded, goes to YouTube as unlisted content and is
  embedded or linked from lessons.

## Decisions (interview 2026-09-19)

| Question                      | Decision                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site title                    | **AI Training**                                                                                                                                                   |
| Area naming                   | Two sidebar groups: **Foundations** (Concepts, Safety, Using agents) and **Engineering** (Coding with agents, Customizing agents, Building agents).               |
| Audience split                | Foundations is written at one level for everyone. Engineering continues after Foundations and has two comfort levels per lesson (CS50 "less / more comfortable"). |
| First public release ("done") | One thin slice through all six areas: one or two lessons each so the shape is visible end to end, then deepen.                                                    |
| Tutor mode                    | A skill in this repo (`.claude/skills/`), used by running the site locally inside a Claude Code session. Plugin packaging can follow later.                       |
| Repo visibility               | Stays private until Leo explicitly decides it is ready. Going public is a separate, explicit decision, not tied to a milestone.                                   |
| Learner progress              | Browser local storage plus export/import of a JSON file. No backend.                                                                                              |

## Next steps

1. ~~Interview Leo on project approach and goals.~~ Done 2026-09-19, see above.
2. ~~Build a topic map.~~ First draft 2026-09-19 in
   [spec 002](../spec/002-topic-map.md): topics and concepts per area,
   verb-led competencies with draft base behaviours,
   prerequisite edges, three paths, and the release-1 thin slice. Behaviours
   and definitions still to write.
3. ~~Agents explore the source projects in more depth.~~ Done 2026-09-19:
   [explore/06](./explore/06-lesson-inventory.md) (lesson inventories,
   `/teach` skill) and
   [explore/07](./explore/07-scorm-interactions-and-duck-tutor.md) (SCORM
   interaction catalogue, CS50 Duck tutor design). The Duck papers are not
   in the repo and still need fetching. Added later the same day:
   [explore/08](./explore/08-diataxis.md) (Diátaxis) and
   [explore/09](./explore/09-brilliant-skills-map.md) (Brilliant's coding
   skills map and standards alignment; applied to spec 002 except short
   codes and shorter lessons, both declined).
4. ~~Write the dictionary / taxonomy spec.~~ Draft 2026-09-19 in
   [spec 001](../spec/001-dictionary.md).
5. Design the interactive lesson component set and the local-storage progress
   model.
6. Design tutor mode.
7. Replace the template pages under `docs/src/content/docs/` with real
   content, area by area.
