---
title: Contributing
description: How the site and slide decks are built and how to contribute.
---

This site is built with [Astro Starlight](https://starlight.astro.build/) and
published to GitHub Pages. Contributions are welcome - see
[CONTRIBUTING.md](https://github.com/lsimons/lsimons-template-doc/blob/main/CONTRIBUTING.md)
in the repository root.

## The site

Tools are pinned in `.mise.toml`; run `mise install` once. Then:

- `mise run docs-install` - install the site dependencies (bun).
- `mise run docs-dev` - start the live-reloading dev server.
- `mise run docs-build` - build the static site into `docs/dist`.
- `mise run docs-check` - run the Astro type/content check.
- `mise run lint` - run the prek hooks over every file, plus `actionlint`.
- `mise run ci` - the full gate: install, lint, check, build. CI runs the same.

Content lives in `docs/src/content/docs/`; static assets in `docs/public/`.

## Slide decks

The [example presentation](/presentations/example.qmd) is built with
[Quarto](https://quarto.org/). Render it with `mise run docs-slides` (or
`quarto render docs/public/presentations/example.qmd`).

The presentations change so rarely that their rendered HTML and PDF outputs are
committed to git.

## Conventions

Commit messages follow [Conventional Commits](https://conventionalcommits.org/).
Git hooks (formatting, linting, link checking, secret scanning, commit-message
linting) are managed with [prek](https://prek.j178.dev); install them once per
clone with `prek install -t pre-commit -t commit-msg`.
