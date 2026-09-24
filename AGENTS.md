# Agent Instructions for ai-training

> This file (`AGENTS.md`) is the canonical agent configuration. `CLAUDE.md` is a symlink to this file.

An open training suite for getting started with AI (concepts, safety, using
agents, AI-assisted software engineering, customizing and building agents),
built as an [Astro Starlight](https://starlight.astro.build/) site and
published to GitHub Pages. Basic material is for knowledge workers; the rest
is for software engineers. Design decisions are in `docs/spec/`, and open
work is in GitHub issues (`docs/agents/issue-tracker.md`).

## Quick reference

The repo tasks are defined in `.mise.toml`, and `mise tasks` lists them with
a description each. Run `mise trust` and `mise install` once per clone.

`mise run ci` is the full gate and runs the same list the CI job runs, in the
same order. `mise run links` (lychee, external URLs) and `mise run site-audit`
(`bun audit`) are network calls that flake, so they're not part of `ci`. Run
them now and then.

The site's own checks, in the order `ci` runs them after the prose tasks:

| Task                   | What it does                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- |
| `mise run examples`    | Run every `<Predict run=...>` fixture and compare with the lesson             |
| `mise run data`        | Check the data tree under `site/src/data` against itself and the lesson pages |
| `mise run site-check`  | `astro check`: types, templates, content schemas                              |
| `mise run site-lint`   | Biome lint and format check (`mise run site-format` rewrites)                 |
| `mise run site-test`   | Vitest unit and component tests, 80% coverage floor                           |
| `mise run site-build`  | Build `site/dist`, with the internal link check                               |
| `mise run checkpoints` | Check the built `checkpoints.json` export against the lesson pages            |
| `mise run site-e2e`    | Build, then the Playwright walkthrough in `site/e2e/`                         |

`site-e2e` and `site-screenshot` need `mise run site-browser` once per
machine. `docs/agents/testing.md` says which layer a new assertion belongs
in.

The Python tasks are prefixed `py-`: `py-install-frozen` (uv sync from
`uv.lock`), `py-lint` (ruff check and format check), `py-format` (ruff
fixes), `py-typecheck` (basedpyright) and `py-test` (pytest with coverage).
They cover `scripts/`, `tests/` and the Python fixtures under
`site/examples/`, and `pyproject.toml` holds their config.

### Astro 7 dev server

`astro dev` (what `mise run site-dev` runs) detaches into a background
daemon. Killing the shell that started it **doesn't** stop it, and a stale
daemon keeps serving old content and old config, which looks like an edit
"not taking". Manage it with the CLI, from `site/`:

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `bunx astro dev status` | Is a daemon running (and its port and pid)    |
| `bunx astro dev logs`   | Its log                                       |
| `bunx astro dev stop`   | Stop it; do this before restarting or leaving |

Restart it (stop, then `mise run site-dev`) after changing
`astro.config.mjs`, `content.config.ts`, or anything under `src/data/`.
For a one-off check of the built site prefer `mise run site-preview` or
`site-screenshot`. Neither leaves a daemon behind.

## Structure

The layout is what the tree shows. The parts that aren't obvious from it:

- This is a *project* site served under the `/ai-training` base path (set in
  `site/astro.config.mjs`). Write content links and image sources
  root-relative (`/guides/foo/`, `/guides/foo.png`); a rehype plugin in the
  config prepends the base at render time for Markdown `<a href>` and
  `<img src>`. Raw HTML `<a>` tags and the landing page's hero actions are
  used verbatim and must include the base path. Component-rendered links
  must use `href()` from `site/src/lib/url.ts`, because the rehype plugin
  only sees Markdown.
- Lessons are `site/src/content/docs/<area>/<lesson>.mdx` and course pages
  are `<area>/index.mdx`. Neither has frontmatter: everything the site
  knows about an area, a topic, a competency, a course or a lesson is YAML
  under `site/src/data/areas/<area>/` (specs S09 to S11), and the build
  copies a lesson's title, mode and the rest onto its page. Every lesson,
  written or not, has a file under `lessons/`, and the course file orders
  them, flat or in parts. `mise run data` checks the tree against itself
  and the pages. `docs/agents/writing-a-lesson.md` is the authoring guide.
- `site/src/styles/lesson.css` is global on purpose: review pages clone
  checkpoint markup out of lesson pages.
- `site/examples/` holds the runnable fixtures behind `<Predict run=...>`.
  `site/public/presentations/` holds Quarto decks and their committed
  HTML/PDF outputs. CI doesn't run Quarto.
- `docs/spec/` holds numbered specs (`SNN-title.md`, each with Purpose
  and Status; `000-specs.md` is the index). S01 is the project dictionary;
  use its terms everywhere. Specs are standalone. The early plan and the
  source exploration notes were removed on 2026-09-20 once the specs and
  issues held everything in them. `docs/agents/` holds agent-facing
  process docs.
- `docs/prose/README.md` records which Vale rule runs where and why, and
  how to evaluate a new style package.

## Guidelines

**Content and licensing:**

- This is a public, open-content project. No company names, internal URLs or
  confidential material.
- Content is CC BY-SA 4.0 (`LICENSE`) and code is Apache-2.0 (`LICENSE-CODE`).
  Source material has different terms, and spec S02 "Source material" has
  the per-source table for topic content. In short: `agent-engineer-course`
  (Apache-2.0) and Diátaxis (CC BY-SA) content may be adapted with
  attribution and an entry in `NOTICE.md`. CS50 (CC BY-NC-SA) may be cited
  and its ideas used, but its text may not be adapted (verbatim inclusion
  only, marked per page). Claude Academy (`academy.claude.com`, cited as
  `Academy <slug>`) may be linked, and its concepts and ideas may be
  paraphrased in our own words, but no text, quiz question, image or other
  data is copied from it. DeepLearning.AI material may only be linked or
  used as inspiration, never copied. Learn Prompting supplies vocabulary
  only, and prompting concepts are written from the papers. The Schuberg
  Philis AI wiki supplied ideas only, rewritten, and none of its text. Link
  Anthropic courses at their public `academy.claude.com` URL.
- Interactive widgets in lesson pages must sit in `class="not-content"`
  containers. Never emit a literal `</script>` or `</pre>` inside widget JS
  strings. It breaks mdformat and the renderer.
- Learner progress is stored in browser local storage only. No backend, no
  telemetry.

**Voice:**

Many readers have English as a second language. Keep the concepts at a
professional level but the language simple: common words and plain sentence
structure over native-speaker idiom, wordplay, or rare vocabulary. Expand an
acronym on first use in a lesson.

Nearly all the text here is written by agents, and agent prose has tells.
The reader shouldn't be able to hear them. `mise run prose` flags the
patterns below after the fact. Write so that it has nothing to say.

- Say what a thing does, not what it figuratively is. Content is *in* a
  directory, not *living* there; a file *contains* a value, a check
  *rejects* a change, a format is a format and not a `shape`.
- No tacked-on clause after a semicolon. Two sentences, or a comma and a
  conjunction.
- Don't announce a count and then list (`Three things matter: ...`). Give
  the list, or make the count the point.
- Don't default to the rule of three. Name two things when there are two,
  and four when there are four. A run of parallel verbs in threes is the
  loudest tell there is.
- No clipped mottos (`Hints, not answers.`, `One path, no choices.`).
  Write the sentence.
- No `not X, but Y` or `a Y, not a Z` as the default way to make a
  point. State the positive claim.
- No sentence-initial `Hence`, `Thus`, `Notably`, `Moreover`, `That's why`.
  Join with `and`, `but`, or `so`, or start with the point. `For example`
  is fine.
- No `no X, no Y, no Z` stacks, no `Nothing here needs ...`, no "Every X
  has ..." as a rhythm. Once is fine, but a run is the tell.
- No `delve`, `robust`, `seamless`, `leverage`, `landscape`, `journey`,
  no `It's worth noting`, no `In conclusion`, no `I hope this helps`.
- Plain words for plain things: `use`, not `utilize`; `so`, not
  `consequently`.

**Quality:**

- `mise run ci` must pass before you push.
- Each check has its layer (`docs/agents/testing.md`): Biome for lint and
  format, `astro check` for types and templates, Vitest for the logic in
  `site/src/lib`, `site/src/scripts` and `site/scripts/lib` (80% coverage
  floor in `site/vitest.config.ts`, never lowered), the Container API tests
  in `site/tests/components/` for rendered markup, and Playwright in
  `site/e2e/` for flows across pages. Browser code keeps its pure parts in
  a module without DOM access (`progress-model.ts`, `checkpoint-logic.ts`)
  so they can be tested under Node.
- Biome is the one formatter for `site/` (`site/biome.json`: tabs, single
  quotes, 120 columns; JSON keeps two spaces). Run `mise run site-format`
  rather than hand-formatting. No `// biome-ignore` without the reason on
  the same line. Biome skips the `.astro` template, so `astro check` stays
  the check for that half.
- Code examples in lessons are real and their shown output is asserted in
  CI (spec S03, Examples): `<Predict run="..." answer="...">` names a fixture
  under `site/examples/` and `mise run examples` fails on a mismatch. An
  example that can't run says so in the page (the component prints this
  when `run` is absent).
- Internal links are root-relative. `starlight-links-validator` fails
  `mise run site-build` on a dead one, so the build is the check. Don't
  disable it.
- Spelling is American English, checked by cspell (`mise run spell`). Add
  names and jargon to `cspell-words.txt`, grouped, one per line; never a
  British spelling. Inline code spans are skipped, so identifiers need no
  entry.
- Vale (`mise run prose`): errors fail the build, style warnings print and
  are the house style. Fix a warning by rewriting unless the rewrite reads
  worse. The vocabulary in
  `.vale/styles/config/vocabularies/ai-training/accept.txt` holds the
  canonical casing of names, and every entry has its casing enforced
  everywhere, so common words never go in. `House.Quotes`: a comma or
  period that isn't part of the quoted text goes *outside* the closing
  quote, so a quoted prompt never seems to end in punctuation the learner
  should type. `mise run prose-extended` adds passive-voice, first-person
  and semicolon rules; most hits are idiom, so rewrite only what hides who
  does what.
- Python (`mise run py-lint`, `py-typecheck`, `py-test`): ruff check and
  format are clean over every `.py` file, basedpyright is clean at `strict`
  over `scripts/` and `tests/` and at `standard` (Python 3.9) over
  `site/examples/`, and coverage of `scripts/` stays at or above 80%.
  `scripts/` keeps its logic in functions that `tests/` imports, with a
  thin `__main__` block. Prefer fixing the cause over a `# noqa` or a
  `# type: ignore`. Where one stays, it names the rule and the reason on
  the same line.
- Re-render and commit a deck's HTML/PDF whenever you change its `.qmd`.
- No unexplained rule disables in `.markdownlint-cli2.jsonc`; say which files
  and why, on the same line.
- Never weaken a control to make a check pass. That covers unpinning an
  action, dropping a `prek.toml` hook, excluding a really broken URL in
  `.lychee.toml`, lowering the coverage floor, and deleting a test.

**Supply chain:**

- `site/bun.lock` is committed and must stay in the tree. `mise run ci` and CI
  install with `site-install-frozen`. Use `mise run site-install` when
  deliberately changing dependencies, and commit the result.
- Dependencies in `site/package.json` stay as ranges; `bun.lock` is the pin,
  and dependabot moves the constraint. The exception is tools: `playwright`,
  `typescript`, `markdownlint-cli2`, `@commitlint/*` and `cspell` are
  exact, and the prek hooks and `mise run spell` run the last three from
  `site/node_modules/.bin`, so `site-install-frozen` comes before `lint`
  and `spell`.
- `uv.lock` is committed and must stay in the tree. `mise run ci` and CI
  install with `py-install-frozen`. The dev group in `pyproject.toml` is
  exact-pinned. Use `mise run py-install` when deliberately changing it,
  commit the result, and move the `ruff-pre-commit` rev in `prek.toml` to
  the same ruff version.
- `mise run site-audit` (`bun audit`) must be clean. Fix an advisory in a
  *transitive* package with the `overrides` block in `site/package.json`.
- Pin GitHub Actions to full-length commit SHAs. `zizmor` enforces it.
- Every `.mise.toml` tool is exact-pinned and invisible to dependabot.
  Refresh with `mise up` and read the diff.
- The mise binary itself is pinned too: `version` and `sha256` on every
  `mise-action` step in the workflows, and `min_version` in `.mise.toml`.
  Dependabot does not see any of them. To refresh: pick a release at
  least seven days old, download its `mise-v<version>-linux-x64.tar.gz`
  and check it against the release's `SHASUMS256.txt`, extract it and
  hash the extracted `mise/bin/mise` with `shasum -a 256` (the action
  checks that binary against `sha256`), then update the workflows and
  `.mise.toml` in one commit.
- `prek.toml` hook repos are pinned by commit SHA (tag in the comment),
  and each Python hook lists its full transitive tree in
  `additional_dependencies`, exact-pinned. Both are invisible to
  dependabot. To bump one, move the SHA with `git ls-remote --tags` and
  rerun the `uv pip compile` command in the comment next to the list.
  Never add a hook that resolves packages at install time.

## Process

- Git remote is GitHub, `lsimons/ai-training`. Use `gh`.
- Issues and triage labels: `docs/agents/issue-tracker.md`. Running a triage
  pass with the maintainer: `docs/agents/triage.md`.
- Running many builder and reviewer agents in parallel against the issues,
  from triage to merge queue: `docs/agents/orchestration.md`.
- Running wave after wave from one long session, with a dispatcher that
  spawns a wave lead per wave: `docs/agents/meta-orchestration.md`. The
  `/wave` skill (`.claude/skills/wave/SKILL.md`) is that dispatcher.
- Tutor mode: `.claude/skills/tutor/SKILL.md`. Run the site locally and
  invoke `/tutor`.
- A nit left open on a merged pull request, a follow-up a review or a
  wave report names, and an improvement the maintainer defers all become
  GitHub issues before the session ends, filed and triaged as
  `docs/agents/triage.md` describes, or, in a bounded unattended run
  (`/wave --no-filing`), are listed in the session record for the
  maintainer to file. Session records and transcripts are otherwise not a
  place work waits.
- Commits follow [Conventional Commits](https://conventionalcommits.org/)
  (`type(scope): description`), and commitlint enforces it.
- A push to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).
  The site is pre-release and says so on the front page and in the README.

## Session completion

Work isn't complete until every change is committed, pushed, and CI passes.

1. `mise run ci` (or the tasks that changed)
2. Commit everything; don't leave the working tree dirty
3. `git pull --rebase && git push`
4. `mise run ci-watch`; on failure `gh run view --log-failed`, fix, repeat

Never stop before CI is green.
