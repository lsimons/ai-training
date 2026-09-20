# Agent Instructions for ai-training

> This file (`AGENTS.md`) is the canonical agent configuration. `CLAUDE.md` is a symlink to this file.

An open training suite for getting started with AI (concepts, safety, using
agents, AI-assisted software engineering, customizing and building agents),
built as an [Astro Starlight](https://starlight.astro.build/) site and
published to GitHub Pages. Basic material is for knowledge workers; the rest
is for software engineers. The plan is in `docs/plan/README.md`.

## Quick Reference

Every repo task lives in `.mise.toml`; `mise tasks` lists them. Run `mise trust`
and `mise install` once per clone.

| Task                           | What it does                                                         |
| ------------------------------ | -------------------------------------------------------------------- |
| `mise run site-install`        | Install the site dependencies (bun); may update `bun.lock`           |
| `mise run site-install-frozen` | Same, but fails if `bun.lock` is out of date                         |
| `mise run site-dev`            | Dev server at <http://localhost:4321/ai-training/>                   |
| `mise run site-build`          | Build the static site into `site/dist`                               |
| `mise run site-check`          | Astro type/content check                                             |
| `mise run examples`            | Run lesson example fixtures, assert the shown output                 |
| `mise run site-e2e`            | Build + headless-browser walkthrough of every mechanism              |
| `mise run lint`                | prek hooks over every file + `actionlint`                            |
| `mise run prose-sync`          | Fetch the pinned Vale style package (network)                        |
| `mise run prose`               | Vale prose lint; misspellings gate, style warnings advise            |
| `mise run spell`               | cspell, American English; names and jargon in `cspell-words.txt`     |
| `mise run prose-extended`      | Vale with the passive-voice rule too; advisory, run now and then     |
| `mise run prose-eval -- <pkg>` | Every hit of a Vale package as JSON, for deciding rule by rule       |
| `mise run ci`                  | Full gate: install + lint + prose + spell + examples + check + build |
| `mise run links`               | `lychee` broken-link check (network; not part of `ci`)               |
| `mise run audit`               | `zizmor` audit of workflows + dependabot config                      |
| `mise run site-audit`          | `bun audit` of the site dependency tree (network)                    |
| `mise run site-slides`         | Render the example `.qmd` deck to HTML + PDF                         |
| `mise run site-favicon`        | Regenerate the favicon + apple-touch-icon                            |
| `mise run site-clean`          | Remove build artifacts                                               |
| `mise run ci-watch`            | Watch GitHub Actions for the current branch                          |

Also available: `site-preview`, `site-browser`, and
`mise run site-screenshot out.png /ai-training/`.

### Astro 7 dev server

`astro dev` (what `mise run site-dev` runs) detaches into a background
daemon. Killing the shell that started it does **not** stop it, and a stale
daemon keeps serving old content and old config, which looks like an edit
"not taking". Manage it with the CLI, from `site/`:

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `bunx astro dev status` | Is a daemon running, on which port and pid    |
| `bunx astro dev logs`   | Its log                                       |
| `bunx astro dev stop`   | Stop it; do this before restarting or leaving |

Restart it (stop, then `mise run site-dev`) after changing
`astro.config.mjs`, `content.config.ts`, or anything under `src/data/`.
For a one-off check of the built site prefer `mise run site-preview` or
`site-screenshot`; neither leaves a daemon behind.

## Structure

This is a *project* site served under the `/ai-training` base path (set in
`site/astro.config.mjs`), so write content links and image sources
root-relative (`/guides/foo/`, `/guides/foo.png`); a small rehype plugin in
the config prepends the base at render time (for both `<a href>` and
`<img src>`). Raw HTML `<a>` tags and the landing page's hero actions are used
verbatim and must include the base path.

- `site/` - Astro Starlight site.
  - `src/content/docs/` - the pages. Lessons are `<area>/<lesson>.mdx`
    with the frontmatter from spec S03; course pages are `<area>/index.mdx`.
    `docs/agents/writing-a-lesson.md` is the authoring guide.
  - `src/content.config.ts` - the `docs` schema (extended with lesson
    fields) plus the `topics`, `competencies` and `bibliography` YAML
    collections under `src/data/` (spec S02 "Storage").
  - `src/components/lesson/` - the checkpoint and section components;
    `components/widgets/` the widgets; `components/overrides/` the Starlight
    `MarkdownContent` override that frames a lesson (routing cards, comfort
    level, finish); `CourseGraph`, `TopicMap`, `Glossary`,
    `ProgressOverview`.
  - `src/scripts/progress.ts` - the local-storage progress record and review
    schedule (specs S04, S05); `scripts/checkpoints.ts` binds interactions.
  - `src/pages/` - generated pages: `topics/`, `competencies/`, and
    `[area]/review`.
  - `src/lib/` - build-time helpers: areas, lessons (checkpoint discovery,
    graph levels), the base-path `href()` for component links.
  - `src/styles/custom.css` - the LSD Warm theme; `lesson.css` - lesson,
    course, map, progress and review styles (global on purpose: review
    pages clone checkpoint markup out of lesson pages).
  - `examples/` - the runnable fixtures behind `<Predict run=...>`;
    `scripts/check-examples.mjs` runs them.
  - `public/` - static assets. `public/presentations/` holds Quarto decks and
    their committed HTML/PDF outputs.
  - `astro.config.mjs` - site/base, the sidebar, redirects, and the rehype
    base-link plugin.
- `docs/plan/` - the rough plan (`README.md`) and exploration notes on the
  source material (`explore/`). Not part of the site.
- `docs/spec/` - numbered specs (`SNN-title.md`, each with Purpose and
  Status; `000-specs.md` is the index). S01 is the project dictionary; use
  its terms everywhere. Specs are standalone and never link to `docs/plan/`.
- `docs/agents/` - agent-facing process docs (issue tracker).
- `.mise.toml` - pinned tools and the dev/build tasks.
- `.vale.ini` - Vale prose lint config; `.vale/styles/config/vocabularies/`
  holds the accepted-terms list. The `write-good` package it pins is fetched
  by `mise run prose-sync` and gitignored.
- `prek.toml` - git hooks (mdformat, markdownlint, lychee, gitleaks,
  commitlint); `prek install -t pre-commit -t commit-msg` once per clone.
- `.github/workflows/ci.yml` lints, astro-checks and builds on push/PR;
  `deploy.yml` publishes `site/dist` to GitHub Pages, currently on manual
  dispatch only while the repo is private. CI does not run Quarto; slide
  outputs are committed.

## Guidelines

**Content and licensing:**

- This is a public, open-content project. No company names, internal URLs or
  confidential material.
- Content is CC BY-SA 4.0 (`LICENSE`); code is Apache-2.0 (`LICENSE-CODE`).
  Source material has different terms; `docs/plan/README.md` has the table.
  In short: `agent-engineer-course` (Apache-2.0) and Diátaxis (CC BY-SA)
  content may be adapted with attribution and an entry in `NOTICE.md`; CS50
  (CC BY-NC-SA) may be cited and its ideas used, but its text may not be
  adapted (verbatim inclusion only, marked per page); Anthropic Academy and
  DeepLearning.AI material may only be linked or used as inspiration, never
  copied. Prefer public `academy.claude.com` URLs when linking Anthropic
  courses.
- Interactive widgets in lesson pages must sit in `class="not-content"`
  containers. Never emit a literal `</script>` or `</pre>` inside widget JS
  strings; it breaks mdformat and the renderer.
- Learner progress lives in browser local storage only. No backend, no
  telemetry.

**Quality:**

- `mise run ci` must pass before you push. It is the same list the CI job
  runs, in the same order.
- Code examples in lessons are real and their shown output is asserted in
  CI (spec S03, Examples): `<Predict run="..." answer="...">` names a fixture
  under `site/examples/` and `mise run examples` fails on a mismatch. An
  example that cannot run says so in the page (the component prints this
  when `run` is absent).
- Component-rendered links must use `href()` from `src/lib/url.ts`; the
  rehype base plugin only sees Markdown.
- Internal links are root-relative; the rehype plugin adds the base path.
  `starlight-links-validator` fails `mise run site-build` on a dead one, so
  the build is the check. Do not disable it.
- Spelling is American English, checked by `mise run spell` (cspell) over
  every tracked `.md`/`.mdx` file and the YAML under `site/src/data/`. Add
  names and jargon to `cspell-words.txt`, grouped, one per line; never a
  British spelling. Inline code spans are skipped, so identifiers need no
  entry.
- `mise run prose` (Vale) runs over every tracked `.md`/`.mdx` file and the
  YAML under `site/src/data/`, minus `site/examples/`. Only errors fail:
  wrongly cased names, a doubled word, and the proselint tripwires
  (annotations left in text, slurs, "PIN number", date forms). Spelling is
  cspell's job, not Vale's. The Vale vocabulary in
  `.vale/styles/config/vocabularies/ai-training/accept.txt` holds the
  canonical casing of names ("Quarto", "Anthropic") and the TooWordy
  exemptions, nothing else. Style warnings (cliches, weasel words, wordy
  phrases, "There is", gendered or corporate terms) print but never fail
  the build. `mise run prose-extended` adds the passive-voice and
  sentence-initial-"So" rules from `.vale-extended.ini`; most of their hits
  are idiom, so run it now and then and rewrite only the sentences that
  hide who does what. `docs/prose/README.md` records which rule runs where
  and why, and how to evaluate a new style package.
- `mise run links` (lychee) checks *external* URLs only. It is not part of
  `ci` because it is a network call that flakes.
- Re-render and commit a deck's HTML/PDF whenever you change its `.qmd`.
- No unexplained rule disables in `.markdownlint-cli2.jsonc`; say which files
  and why, on the same line.
- Never weaken a control to make a check pass: no unpinned actions, no
  dropped `prek.toml` hooks, no `.lychee.toml` exclusions for URLs that are
  genuinely broken.

**Supply chain:**

- `site/bun.lock` is committed and must stay in the tree. `mise run ci` and CI
  install with `site-install-frozen`; use `mise run site-install` when
  deliberately changing dependencies, and commit the result.
- Dependencies in `site/package.json` stay as ranges; `bun.lock` is the pin,
  and dependabot moves the constraint.
- `mise run site-audit` (`bun audit`) must be clean. Fix an advisory in a
  *transitive* package with the `overrides` block in `site/package.json`.
- Pin GitHub Actions to full-length commit SHAs; `zizmor` enforces it.
- Every `.mise.toml` tool and every `prek.toml` `additional_dependencies`
  entry is exact-pinned and invisible to dependabot; refresh with `mise up`
  and read the diff.

## Agent skills

### Git remote

Use GitHub with `gh`. The repo is `lsimons/ai-training` (private for now).

### Tutor mode

`.claude/skills/tutor/SKILL.md`. Run the site locally and invoke `/tutor`.

### Issue tracker

Use GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See
`docs/agents/issue-tracker.md`.

## Commit Message Convention

Follow [Conventional Commits](https://conventionalcommits.org/):

**Format:** `type(scope): description`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `perf`, `revert`, `improvement`, `chore`

## Session Completion

Work is not complete until every change is committed, pushed, and CI passes.

1. `mise run ci` (or the tasks that changed)
2. Commit everything; do not leave the working tree dirty
3. `git pull --rebase && git push`
4. `mise run ci-watch`; on failure `gh run view --log-failed`, fix, repeat

Never stop before CI is green.
