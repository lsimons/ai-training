# 2026-09-20 Spike: Release 1 slice, minimal

Two lessons from the S06 release-1 slice, rendered in the existing Starlight
site with plain-HTML interactive widgets and a local-storage progress record.

## Hypothesis

The S03 lesson anatomy, four interaction types (`choice`, `predict`, `order`,
widget) and the S04 progress record can be built as plain Markdown pages plus
one shared vanilla-JS file, with no Astro components, MDX or framework, and
still look and behave roughly like the plan in a browser.

## Problem statement

The specs describe a lot of mechanism (lesson graph, topic map, routing,
spaced review, tutor mode). Before designing components (plan step 5) we want
to see something running to check the shape feels right and to learn which
parts are hard in Starlight.

## Validation plan

1. `mise run docs-dev`, open the two lessons and the two course pages.
2. Answer a `choice` wrong then right; see feedback and the checkpoint
   recorded as `attempted` then `passed` in local storage.
3. Use the `predict` and `order` interactions the same way.
4. Play with the widget (sampling with temperature) and see the output change.
5. Open the progress page: see states, export JSON, reset, import the file
   back, states return.
6. `mise run docs-build` passes (links validator included).

## References

- `docs/spec/S06-release-1.md`: the slice.
- `docs/spec/S03-lesson-authoring.md`: lesson anatomy, checkpoint rules.
- `docs/spec/S04-progress-record.md`: local-storage shape and key.
- `docs/plan/README.md`: overall plan.

## Deferred

Topic map, lesson graph drawing, spaced review, routing cards, comfort
levels, tutor mode, the other four lessons, example runner, and all quality
gates (lint, mdformat, CI).

## Implementation

Site changes live under `docs/` on this branch because Astro has to render
them; only the notes and the test live in this directory.

- `docs/src/content/docs/concepts/how-models-work.md`: explanation lesson.
  Two `choice` checkpoints, one pitfall, the sampling widget, exercise,
  recap with a "Mark lesson finished" button.
- `docs/src/content/docs/building-agents/agent-loop.md`: tutorial lesson.
  Two `predict` checkpoints, one `order` checkpoint, pitfall, exercise,
  recap. Code examples are a Python fixture; not run in CI (deferred).
- `docs/src/content/docs/concepts/index.md` and
  `docs/src/content/docs/building-agents/index.md`: one-node course pages
  with a state label, completion ring and a one-segment milestone bar.
- `docs/src/content/docs/progress.md`: dump of the record, export, import,
  reset.
- `docs/public/spike/lesson.js`: all interactions and the S04 progress
  record (`ai-training-progress-v1`, lessons + checkpoints with states and
  attempt counts). Driven by `data-checkpoint` / `data-kind` attributes on
  plain HTML in the Markdown.
- `docs/public/spike/sampler.js`: the temperature widget.
- `docs/src/styles/custom.css`: appended spike styles.
- `docs/astro.config.mjs`: Foundations / Engineering sidebar groups plus
  the progress page.
- `walkthrough.mjs`: Playwright script that executes the validation plan.
- `lesson.png`: full-page screenshot of the concepts lesson.

### How to run

```sh
mise run docs-dev      # then open http://localhost:4321/ai-training/concepts/
# or headless:
cd docs && bunx astro preview --port 4399 &
bun ../spikes/2026-09-20-release-1-slice/walkthrough.mjs
```

## Validation result

All six validation steps passed on 2026-09-20 via `walkthrough.mjs`, with no
page errors:

- Widget: at temperature 0.1 the top token reaches 100%; sampling prints
  "The cat sat on the mat."
- `choice`: wrong pick shows its own rationale; right pick records
  `passed (2 attempts)`.
- `predict`: whitespace/case-normalised match; wrong is only marked wrong,
  right reveals the output.
- `order`: shuffled list marked wrong, sorted list marked right.
- Course pages read the record: concepts shows `finished`, 1/2 passed,
  ring at 50%; building-agents shows `read`, 2/3.
- Progress page: export downloads JSON, reset empties it, importing the
  file restores the identical record.
- `mise run docs-build` passes including the links validator.

## Lessons learned

Hypothesis **confirmed**: plain Markdown + raw HTML + one vanilla JS file is
enough for the release-1 interaction set and progress record, and the result
already looks like the plan in the Starlight theme.

- Starlight accepts the extra frontmatter fields (`mode`, `serves`,
  `assumes`) without complaint, so S03 objective metadata can live in
  frontmatter today. Nothing reads it yet.
- Raw HTML checkpoints in Markdown are verbose (~15 lines each) and easy to
  get wrong (one `data-why` landed on the wrong element). The real
  implementation wants Astro/MDX components (`<Choice>`, `<Predict>`,
  `<Order>`) that emit this same HTML, so the JS can stay as is.
- `<script src>` per page works but is clumsy; a Starlight component
  override (e.g. `Footer`) or a `head` entry should load the shared JS once.
- Checkpoint ids from section slugs (S03) were not needed here; a
  `data-checkpoint` id on the element was simpler. Keep that but derive it
  from the heading later if stability matters.
- The `predict` exact-match rule is brittle for anything beyond a one-line
  print; the real example runner should supply the expected output.
- The course page "graph" is trivial with one node. Nothing was learned
  about drawing multi-node graphs or the topic map.
- Skipped everything around routing, spaced review and tutor mode; the
  record shape is compatible with adding `reviews` later.
- `mdformat`/`markdownlint` were not run; the raw HTML blocks will likely
  need `not-content` handling in lint config or component-based authoring.
