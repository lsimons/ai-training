# Contributing

Thank you for investing your time in contributing to our project!

Any contributions you make are governed by our [License](LICENSE).

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

Do not report a security problem in a public issue. Use the "Report a
vulnerability" button under the repository's Security tab instead.

You could read the [open source contribution guide](https://opensource.guide/how-to-contribute/) for general advice on how to contribute.

AI agents: see [AGENTS.md](AGENTS.md).

## The site

This site is built with [Astro Starlight](https://starlight.astro.build/).

Tools are pinned in `.mise.toml`; run `mise install` once. Then:

- `mise run docs-install` - Install the site dependencies (bun). Updates
  `docs/bun.lock` if `docs/package.json` changed; commit the result.
  `mise run ci` and CI use `docs-install-frozen`, which fails instead of
  resolving the difference.
- `mise run docs-dev` - Start the live-reloading docs server.
- `mise run docs-build` - Build the documentation site into `docs/dist`.
- `mise run docs-check` - Run the Astro type/content check.
- `mise run lint` - Run the prek hooks over every file, plus `actionlint`.
- `mise run ci` - The full gate: install, lint, check, build. Must pass
  before you push.
- `mise run links` - `lychee` check of *external* URLs. Not part of `ci`,
  because it is a network check that flakes on rate limits. Internal links
  are validated by `starlight-links-validator` during `mise run docs-build`.

Open a pull request against `main`. CI runs the same `mise run ci` gate plus a
[zizmor](https://docs.zizmor.sh/) audit of the GitHub Actions workflows; both
must be green.

## Quarto slide decks

The [example presentation](docs/public/presentations/example.qmd) is built with [Quarto](https://quarto.org/).

Render it to HTML and PDF with `mise run docs-slides` (or `quarto render docs/public/presentations/example.qmd`).

The presentations are modified so rarely that their rendered outputs are checked into git. Re-render and commit the outputs whenever you change a deck.

## Commit messages

Follow [Conventional Commits](https://conventionalcommits.org/): `type(scope): description`.

Git hooks (formatting, linting, link checking, secret scanning, commit-message linting) are managed with [prek](https://prek.j178.dev). Install them once per clone:

```bash
prek install -t pre-commit -t commit-msg
```

`mise run lint` runs the same hooks over every file, so CI catches what an
uninstalled hook would have missed.

Since this is a small hobby project, your contribution may not be noticed for a while if we are busy elsewhere. Sorry!
