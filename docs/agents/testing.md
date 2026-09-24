# Testing the site

Which check catches what, and which layer a new assertion belongs in. All
of the layers run from `mise run ci` and from the CI workflow, with one
exception: on a pull request the CI workflow skips the e2e layer when every
changed file is prose or prose tooling (see "When the browser suite runs").

| Layer     | Task                   | Runs                                                                 | Catches                                                                                                             |
| --------- | ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Lint      | `mise run site-lint`   | Biome over `site/` (`site/biome.json`)                               | Unused imports and variables, `any`, non-house formatting, import order                                             |
| Types     | `mise run site-check`  | `astro check`                                                        | Type errors in `.ts` and `.astro` files, template errors, content schema mismatches                                 |
| Unit      | `mise run site-test`   | Vitest, `site/tests/**/*.test.ts`, with the coverage floor           | Wrong logic in `site/src/lib`, `site/src/scripts` and `site/scripts/lib`, in isolation                              |
| Component | `mise run site-test`   | The same Vitest run; `site/tests/components/` renders `.astro` files | Wrong server-rendered markup: a missing `data-` attribute, a bad prop check, a wrong link                           |
| Examples  | `mise run examples`    | `site/scripts/check-examples.mjs`                                    | A `<Predict run= answer=>` whose fixture prints something else than the lesson shows                                |
| Export    | `mise run checkpoints` | `site/scripts/check-checkpoints.mjs`, after `site-build`             | A built `dist/data/checkpoints.json` that misses a page checkpoint, has an item without a page, or a bad concept id |
| e2e       | `mise run site-e2e`    | Playwright, `site/e2e/*.spec.ts`, against the built site             | The scripts and the markup disagreeing, a page error, a console error, a flow that only works with real navigation  |

## Where a new assertion belongs

- **A rule about the progress record or the review schedule** (a stage
  interval, what a skip counts as, what `normalize` drops) goes in
  `site/tests/scripts/progress-model.test.ts`. `progress-model.ts` has no
  DOM and takes the day as an argument, so the test is a plain function
  call.
- **Local-storage behavior** (the event, a failing write, another version
  in storage) goes in `site/tests/scripts/progress.test.ts`, which runs
  under `happy-dom` (the `// @vitest-environment happy-dom` line at the
  top).
- **How a checkpoint kind grades** goes in
  `site/tests/scripts/checkpoints.test.ts`, against a hand-written copy of
  the component markup. Feedback texts and the shuffle rule are pure
  functions in `checkpoint-logic.ts` with their own test file.
- **What a component renders** (an attribute the script reads, a prop
  validation that must throw) goes in `site/tests/components/`, with
  Astro's Container API. Components that read the content collections
  get their lessons from the fixtures in `site/tests/lib/content.ts`, since
  `getCollection()` returns nothing under Vitest.
- **A flow across pages** (finish a lesson, then see it on the course
  page; the review page fetching checkpoint markup from a lesson) goes in
  `site/e2e/`, one spec file per mechanism. Seed progress with the `seed`
  fixture instead of clicking through an earlier flow, and use auto-waiting
  `expect(locator)` assertions rather than sleeps. A count of live lessons
  in a course or a topic, or of the checkpoints on a lesson page, comes from
  `liveCourseLessons`, `liveTopicLessons` or `lessonCheckpoints` in
  `site/e2e/fixtures.ts` (over `site/scripts/lib/live-lessons.mjs`), never
  from a literal, so a new lesson page or checkpoint doesn't change a spec.
  `passRemaining` passes whatever checkpoints a page still has open, for
  the kinds it has a solver for (`predict`, `choice`, `scenario` and
  `order`), and throws on any other kind, so a lesson that gains one says
  so.
- **A code example's output** is already asserted: `<Predict run="..." answer="...">` names the fixture and `mise run examples` compares it, so it gets no separate test.

## Coverage

`site/vitest.config.ts` sets an 80% floor for lines, functions, branches
and statements over `site/src/lib`, `site/src/scripts` and
`site/scripts/lib`. `mise run site-test` fails when a run drops below it.
Do not lower the floor to get a change through: add the test, or move the
logic into a module that can be tested. `.astro` files are not
instrumented (their template half runs in the e2e suite), and
`lesson-context.ts` is excluded because it only reads route locals.

The inline `<script>` blocks in `.astro` components (`Settings.astro`,
`ProgressOverview.astro`, `OverallProgress.astro`, `CourseGraph.astro`,
`TopicMap.astro`, `overrides/MarkdownContent.astro`, `overrides/Sidebar.astro`,
`pages/[area]/review.astro`)
are outside Biome and outside the coverage floor. Only `astro check` and
the e2e suite see them. When one of them grows logic worth a unit test,
move that logic into `site/src/scripts/*.ts` and import it, which puts it
under Biome, the strict tsconfig flags and the coverage include set.

## Running the browser suite

`mise run site-browser` installs Chromium once. `mise run site-e2e` builds
the site, and Playwright starts `site/scripts/serve-dist.mjs` (a static
server for `site/dist`), runs `site/e2e/`, and stops the server. To run one
file: `cd site && bunx playwright test e2e/review.spec.ts`. On a failure the
trace is under `site/test-results/`, and `bunx playwright show-trace <zip>`
opens it. Every spec blocks requests that leave `localhost` and fails on a
`pageerror` or console error (`site/e2e/fixtures.ts`).

## When the browser suite runs

`mise run ci` always runs `site-e2e`. The CI workflow
(`.github/workflows/ci.yml`) runs the `e2e` job on every push to `main` and
on `workflow_dispatch`, but on a pull request only when the diff touches a
file outside this skip set: `docs/`, any `.md` file outside `site/`,
`.vale.ini`, `.vale/`, `cspell-words.txt`, `.markdownlint-cli2.jsonc`,
`.lychee.toml` and the license files. An empty diff runs the job. The
`paths` step of the `build` job computes it with `git diff --name-only`
against the base branch and the `e2e` job has a job-level `if:` on its
output, so a skipped run still reports a (skipped) status for the job.

Lesson pages under `site/src/content/` and the data tree under
`site/src/data/` aren't in the skip set. The specs in `site/e2e/` derive
their live-lesson and checkpoint counts from the data tree and click
through lesson pages, so a content change can break them, and the round
trip through a red `main` costs more than the job does. Widen the skip set
only for files no spec can read.

`astro preview` is not used here: in Astro 7 it hands the port to a
detached child and exits, so a supervisor cannot stop it. The static server
serves the same files under the same `/ai-training` base path.

## Lint notes

Biome formats and lints the frontmatter of `.astro` files and leaves the
template and the inline `<script>` blocks alone, so `astro check` stays the
check for those two. Because Biome cannot see the template, the
unused-variable rules are off for `.astro` files (`overrides` in
`site/biome.json`). `noNonNullAssertion` is off because the frontmatter of
`TopicMap.astro` and `overrides/MarkdownContent.astro` and `src/lib/lessons.ts`
use `!` on lookups the content collections guarantee; `src/scripts/` has
none left. A `// biome-ignore` needs the reason on the same line.

`exactOptionalPropertyTypes` is deliberately not set in `site/tsconfig.json`:
Astro passes an absent optional prop as `undefined`, which fails six
`CheckpointShell` prop checks under that flag.
