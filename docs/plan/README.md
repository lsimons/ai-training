# Rough plan: ai-training

Status: **draft, captured at project setup on 2026-09-19**. This is the brief
as given plus what the first exploration round found. The next step is an
interview to firm up approach and goals; after that this file is superseded by
proper specs.

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

It is public, open source and open content. Decided 2026-09-19: everything
(content and code, including the parts lifted from `lsimons-template-doc`) is
**CC BY-NC-SA 4.0**, chosen so CS50 material can be adapted directly. It replaces two earlier attempts:

- `archive/lsimons-ai-training`: private, Schuberg Philis specific, never got
  past scaffolding. See [explore/01](./explore/01-prior-sbp-training-and-course-compare.md).
- `agent-engineer-course`: a fork of Addy Osmani's course. Addy joined
  Anthropic and is unlikely to maintain the upstream, so the fork becomes a
  rebuild here. See [explore/02](./explore/02-agent-engineer-course.md).

## Sources and what may be done with each

| Source                         | License                | Use here                                                                                                                                                                                         |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent-engineer-course` (fork) | Apache-2.0             | Integrate the best content, with attribution to Addy Osmani, Ivar Soares Urdalen and Leo Simons in `NOTICE.md`.                                                                                  |
| `ai-cs50` (CS50 AI, workshops) | CC BY-NC-SA 4.0        | Same license as this project, so text and structure may be adapted with attribution and a note of changes. Workshop talk transcripts are YouTube captions and not licensed; do not redistribute. |
| `ai-anthropic-partners`        | Anthropic, proprietary | Reference and link only, preferring public `academy.claude.com` URLs.                                                                                                                            |
| `ai-deep-learning`             | DeepLearning.AI, paid  | Inspiration for topic coverage and sequencing only. Embed nothing.                                                                                                                               |
| `archive/career-model`         | Apache-2.0 (own)       | Reuse the competency data model and the idea of a visual map.                                                                                                                                    |

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

## Decisions still open (for the interview)

- Title of the site and the naming of the six areas.
- Repo visibility: it is private now; GitHub Pages on a private repo needs a
  paid plan, so publishing likely means going public. When?
- Audience split: two comfort levels per lesson (CS50 style) or separate
  tracks per audience?
- What "done" looks like for a first public release: which areas, how many
  lessons, which interactive elements.
- Tutor mode: a Claude Code skill in this repo, a plugin, or both?
- Where learner progress lives beyond local storage (export/import file?).

## Next steps

1. Interview Leo on project approach and goals (the open decisions above).
2. Explore the course content in more detail and build a topic map.
3. In parallel, agents keep exploring the source projects: full lesson
   inventories, the SCORM interaction catalogue, the CS50 duck papers.
4. Write the dictionary / taxonomy spec.
5. Design the interactive lesson component set and the local-storage progress
   model.
6. Design tutor mode.
7. Replace the template pages under `docs/src/content/docs/` with real
   content, area by area.
