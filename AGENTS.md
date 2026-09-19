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

| Task                           | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `mise run docs-install`        | Install the site dependencies (bun); may update `bun.lock` |
| `mise run docs-install-frozen` | Same, but fails if `bun.lock` is out of date               |
| `mise run docs-dev`            | Dev server at <http://localhost:4321/ai-training/>         |
| `mise run docs-build`          | Build the static site into `docs/dist`                     |
| `mise run docs-check`          | Astro type/content check                                   |
| `mise run lint`                | prek hooks over every file + `actionlint`                  |
| `mise run ci`                  | Full gate: install + lint + check + build                  |
| `mise run links`               | `lychee` broken-link check (network; not part of `ci`)     |
| `mise run audit`               | `zizmor` audit of workflows + dependabot config            |
| `mise run docs-audit`          | `bun audit` of the site dependency tree (network)          |
| `mise run docs-slides`         | Render the example `.qmd` deck to HTML + PDF               |
| `mise run docs-favicon`        | Regenerate the favicon + apple-touch-icon                  |
| `mise run docs-clean`          | Remove build artifacts                                     |
| `mise run ci-watch`            | Watch GitHub Actions for the current branch                |

Also available: `docs-preview`, `docs-browser`, and
`mise run docs-screenshot out.png /ai-training/`.

## Structure

This is a *project* site served under the `/ai-training` base path (set in
`docs/astro.config.mjs`), so content links and image sources are written
root-relative (`/guides/foo/`, `/guides/foo.png`) and a small rehype plugin in
the config prepends the base at render time (for both `<a href>` and
`<img src>`). Raw HTML `<a>` tags and the landing page's hero actions are used
verbatim and must include the base path.

- `docs/` - Astro Starlight site.
  - `src/content/docs/` - the Markdown pages, plus the `index.mdx` splash
    landing page. Each page needs a `title` in frontmatter.
  - `src/styles/custom.css` - the LSD Warm theme and landing-page card styles.
  - `public/` - static assets. `public/presentations/` holds Quarto decks and
    their committed HTML/PDF outputs.
  - `astro.config.mjs` - site/base, the sidebar, redirects, and the rehype
    base-link plugin.
- `docs/plan/` - the rough plan (`README.md`) and exploration notes on the
  source material (`explore/`). Not part of the site.
- `docs/agents/` - agent-facing process docs (issue tracker).
- `.mise.toml` - pinned tools and the dev/build tasks.
- `prek.toml` - git hooks (mdformat, markdownlint, lychee, gitleaks,
  commitlint); `prek install -t pre-commit -t commit-msg` once per clone.
- `.github/workflows/ci.yml` lints, astro-checks and builds on push/PR;
  `deploy.yml` publishes `docs/dist` to GitHub Pages on push to `main`. CI
  does not run Quarto; slide outputs are committed.

## Guidelines

**Content and licensing:**

- This is a public, open-content project. No company names, internal URLs or
  confidential material.
- Everything here is CC BY-NC-SA 4.0 (`LICENSE`). Source material has
  different terms; `docs/plan/README.md` has the table. In short:
  `agent-engineer-course` (Apache-2.0) and CS50 (CC BY-NC-SA) content may be
  integrated with attribution and an entry in `NOTICE.md`; Anthropic Academy
  and DeepLearning.AI material may only be linked or used as inspiration,
  never copied. Prefer public
  `academy.claude.com` URLs when linking Anthropic courses.
- Interactive widgets in lesson pages must sit in `class="not-content"`
  containers. Never emit a literal `</script>` or `</pre>` inside widget JS
  strings; it breaks mdformat and the renderer.
- Learner progress lives in browser local storage only. No backend, no
  telemetry.

**Quality:**

- `mise run ci` must pass before you push. It is the same list the CI job
  runs, in the same order.
- Internal links are root-relative; the rehype plugin adds the base path.
  `starlight-links-validator` fails `mise run docs-build` on a dead one, so
  the build is the check. Do not disable it.
- `mise run links` (lychee) checks *external* URLs only. It is not part of
  `ci` because it is a network call that flakes.
- Re-render and commit a deck's HTML/PDF whenever you change its `.qmd`.
- No unexplained rule disables in `.markdownlint-cli2.jsonc`; say which files
  and why, on the same line.
- Never weaken a control to make a check pass: no unpinned actions, no
  dropped `prek.toml` hooks, no `.lychee.toml` exclusions for URLs that are
  genuinely broken.

**Supply chain:**

- `docs/bun.lock` is committed and must stay in the tree. `mise run ci` and CI
  install with `docs-install-frozen`; use `mise run docs-install` when
  deliberately changing dependencies, and commit the result.
- Dependencies in `docs/package.json` stay as ranges; `bun.lock` is the pin,
  and dependabot moves the constraint.
- `mise run docs-audit` (`bun audit`) must be clean. Fix an advisory in a
  *transitive* package with the `overrides` block in `docs/package.json`.
- Pin GitHub Actions to full-length commit SHAs; `zizmor` enforces it.
- Every `.mise.toml` tool and every `prek.toml` `additional_dependencies`
  entry is exact-pinned and invisible to dependabot; refresh with `mise up`
  and read the diff.

## Agent skills

### Git remote

Use GitHub with `gh`. The repo is `lsimons/ai-training` (private for now).

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
