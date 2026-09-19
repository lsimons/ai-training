---
title: Getting started
description: Install the toolchain, run the dev server, and make the template your own.
---

This template gives you a documentation site built with
[Astro Starlight](https://starlight.astro.build/), themed to match
[lsimons.github.io](https://lsimons.github.io), with a
[Quarto](https://quarto.org/) slide-deck setup and GitHub Pages deployment.

## Prerequisites

Tools are pinned in `.mise.toml`. Install [mise](https://mise.jdx.dev/) once,
then let it install the rest:

```bash
mise install
```

This pins and installs `bun` (the site's package manager), `quarto` (slide
decks), and the lint/hook tools (`prek`, `lychee`, `gitleaks`). Repo tasks are
defined in `.mise.toml` and run with `mise run <task>`.

## Make it your own

Run the init task once to rename the template placeholders to your project:

```bash
mise run init                       # infer the name from the git remote / directory
mise run init --name my-docs         # or set it explicitly
mise run init --name my-docs --title "My Docs"
```

`init` replaces every occurrence of `lsimons-template-doc` (the repo name, the
deploy base path, package name, and GitHub URLs) and `Template Docs` (the human
title) across the repo. See `scripts/init.mjs` for exactly what it touches.

## Develop

```bash
mise run docs-install   # install site dependencies (bun)
mise run docs-dev       # dev server at http://localhost:4321/lsimons-template-doc/
mise run docs-build     # build the static site into docs/dist
mise run docs-check     # Astro type/content check
mise run lint           # prek hooks over every file + actionlint
mise run ci             # the full gate: install + lint + check + build
```

`mise run ci` is what CI runs. `docs-build` also validates every internal
link (via `starlight-links-validator`) and fails on a dead one.

Content lives in `docs/src/content/docs/`; static assets and downloads in
`docs/public/`. Edit `docs/astro.config.mjs` to change the title, sidebar, and
social links.

## Publish

Enable GitHub Pages for your repo with the source set to **GitHub Actions**
(not "Deploy from a branch"). After that, every push to `main` builds and
deploys the site via `.github/workflows/deploy.yml`. Project sites live under a
subpath of `https://lsimons.github.io` matching the repo name - that subpath is
the `base` set in `docs/astro.config.mjs`.

## Next steps

- [Writing pages](/guides/writing-pages/) - add content and wire up the sidebar.
- [Slide decks with Quarto](/guides/slides/) - author and render presentations.
