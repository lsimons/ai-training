# lsimons-template-doc

Project template for documentation sites built with
[Astro Starlight](https://starlight.astro.build/), with the shared "LSD Warm"
theme, a landing page, [Quarto](https://quarto.org/) slide decks, and GitHub
Pages deployment. Sites built from this template are published as project sites
under <https://lsimons.github.io/>.

## Using this template

1. Click **Use this template** on GitHub (or clone this repo).

2. Install the toolchain and rename the template to your project:

   ```bash
   mise trust                         # once per clone: trust this repo's .mise.toml
   mise install                       # pin + install bun, quarto, hooks
   mise run init                      # infer the name from the git remote / directory
   # or: mise run init --name my-docs --title "My Docs"
   mise run docs-install              # install the site dependencies (bun)
   prek install -t pre-commit -t commit-msg   # once per clone: git hooks
   ```

   `mise run init` replaces every occurrence of `lsimons-template-doc` (repo name,
   deploy base path, package name, GitHub URLs) and `Template Docs` (the human
   title) across the repo. See `scripts/init.mjs`.

3. Update `AGENTS.md` (and the `CLAUDE.md` symlink) with project-specific
   instructions, and replace the landing page and guides in
   `docs/src/content/docs/` with your content.

4. Enable GitHub Pages with the source set to **GitHub Actions** — see
   [Publishing](#publishing) below. Nothing in this repo can do that for
   you; without it `deploy.yml` has nowhere to publish.

5. Run `/setup` in your agent of choice. Repository settings — issue labels,
   private vulnerability reporting, Dependabot security updates — are GitHub
   state rather than files, so `Use this template` does not copy them and
   nothing in this repo can create them. `/setup` configures them against the
   new repo directly.

## What's included

- **Astro Starlight** site under `docs/`, with a splash landing page and an
  explicit sidebar. `starlight-links-validator` fails the build on a dead
  internal link.
- **LSD Warm theme** (`docs/src/styles/custom.css`) shared with
  [lsimons.github.io](https://lsimons.github.io), Merriweather webfonts, and a
  clickable-card landing layout.
- **Quarto slide decks** - author in `.qmd`, render to reveal.js **HTML** and
  Beamer **PDF**; a worked example lives at
  `docs/public/presentations/example.qmd`.
- **GitHub Actions** - `ci.yml` lints, type-checks and builds on push/PR;
  `deploy.yml` publishes to GitHub Pages on push to `main`. Actions are pinned
  to full-length commit SHAs, and a [zizmor](https://docs.zizmor.sh/) job audits
  the workflows and the Dependabot config.
- **Pinned toolchain and tasks** in `.mise.toml` — every tool is pinned to an
  exact version, and every repo task lives there (run with `mise run <task>`).
- **Git hooks** (`prek.toml`) - mdformat, markdownlint, lychee, gitleaks, and
  commitlint. `mise run lint` runs the same hooks in CI, so they are enforced
  rather than opt-in.
- **Dependabot** for `bun` (the site deps) and `github-actions`, weekly, with a
  7-day cooldown.
- **`.editorconfig`** so editors that are not running the hooks still agree
  with them.

## Development

```bash
mise trust               # once per clone
mise install             # one-time: pin + install the toolchain
mise run docs-install    # install the site dependencies (bun)
mise run docs-dev        # dev server at http://localhost:4321/lsimons-template-doc/
mise run docs-build      # build the static site into docs/dist
mise run docs-check      # Astro type/content check
mise run docs-slides     # render the example slide deck to HTML + PDF
mise run docs-favicon    # regenerate the favicon + apple-touch-icon
mise run lint            # prek hooks over every file + actionlint
mise run ci              # full gate: install + lint + check + build
mise run links           # lychee broken-link check (network; not in `ci`)
mise run audit           # zizmor audit of workflows + dependabot config
mise run ci-watch        # watch GitHub Actions for the current branch
```

`mise tasks` lists them all, including the screenshot helpers.

Content lives in `docs/src/content/docs/`; static assets and slide decks in
`docs/public/`.

## Project structure

```
lsimons-template-doc/
├── .github/workflows/ci.yml      # lint + Astro check + build, and the zizmor audit
├── .github/workflows/deploy.yml  # build and publish to GitHub Pages
├── .github/dependabot.yml        # weekly bun + github-actions updates
├── .claude/settings.json         # shared agent permissions (tracked on purpose)
├── .editorconfig                 # editor defaults
├── .gitignore
├── .mise.toml                    # toolchain pins + every repo task
├── prek.toml                     # git hooks, also run by `mise run lint`
├── .markdownlint-cli2.jsonc      # markdownlint rules
├── .mdformat.toml                # Markdown formatter settings
├── .lychee.toml                  # link-checker settings
├── commitlint.config.mjs         # Conventional Commits rules
├── docs/                         # the Astro Starlight site
│   ├── src/content/docs/         # the pages
│   ├── src/styles/custom.css     # the LSD Warm theme
│   ├── public/presentations/     # Quarto decks + committed HTML/PDF output
│   ├── astro.config.mjs          # site, base path, sidebar, rehype plugin
│   ├── package.json              # site dependencies (ranges; bun.lock pins them)
│   └── bun.lock                  # committed; never gitignore this
├── scripts/init.mjs              # rename-to-your-project helper
├── AGENTS.md                     # AI agent instructions
├── CLAUDE.md -> AGENTS.md        # Claude Code compatibility
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                       # Apache-2.0
└── README.md
```

`CLAUDE.md` is a git symlink (mode `120000`). A Windows clone needs
`core.symlinks` enabled to get a real link rather than a text file containing
the target path.

## Publishing

Enable GitHub Pages with the source set to **GitHub Actions** (not "Deploy from
a branch"). A push to `main` then builds and deploys the site. The deploy base
path (set as `base` in `docs/astro.config.mjs`) matches the repo name, so the
site lands at `https://lsimons.github.io/<repo>/`.

Then restrict the `github-pages` environment's deployment branches to `main`
(Settings → Environments → `github-pages` → Deployment branches). Like the
Pages source itself, that is repository state rather than a file, so
`Use this template` does not copy it and nothing in this repo can create it.
`deploy.yml` only triggers on `push` to `main` and `workflow_dispatch`, both of
which already require write access, so the branch policy is defence in depth
rather than the only control.

## License

See [LICENSE](./LICENSE) (Apache 2.0).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md). AI agents see
[AGENTS.md](./AGENTS.md).
