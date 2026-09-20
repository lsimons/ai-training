# AI training

An open training suite for getting started with AI: concepts, safety, using
AI agents, AI-assisted software engineering, and customizing and building AI
agents.

Site: <https://lsimons.github.io/ai-training/> (not yet published; see
[Publishing](#publishing)).

The basic material (AI concepts, AI safety, using AI agents) is written for
anyone doing knowledge work. The rest is written for software engineers. The
site is static HTML with interactive lessons that keep your progress in your
browser, and you can also run it locally from a Claude Code session with
Claude acting as a tutor.

**Status: project just set up; no lesson content yet.** The plan is in
[`docs/plan/README.md`](./docs/plan/README.md), with exploration notes on the
source material in [`docs/plan/explore/`](./docs/plan/explore/).

## Origins

This is a rebuild of
[agent-engineer-course](https://github.com/lsimons/agent-engineer-course), a
fork of Addy Osmani's [agent-engineer](https://github.com/addyosmani/agent-engineer)
course with a Starlight setup from Ivar Soares Urdalen. It adopts the
pedagogy of Harvard's [CS50](https://cs50.harvard.edu/) and references the
public courses on [Claude Academy](https://academy.claude.com/). See
[`docs/plan/README.md`](./docs/plan/README.md) for what's reused from where and
under which terms.

## Development

```bash
mise trust               # once per clone
mise install             # one-time: pin + install the toolchain
mise run site-install    # install the site dependencies (bun)
mise run site-dev        # dev server at http://localhost:4321/ai-training/
mise run site-build      # build the static site into site/dist
mise run site-check      # Astro type/content check
mise run site-slides     # render the example slide deck to HTML + PDF
mise run lint            # prek hooks over every file + actionlint
mise run ci              # full gate: install + lint + check + build
mise run links           # lychee broken-link check (network; not in `ci`)
mise run audit           # zizmor audit of workflows + dependabot config
mise run ci-watch        # watch GitHub Actions for the current branch
```

`mise tasks` lists them all. Content is in `site/src/content/docs/`; static
assets and slide decks in `site/public/`.

## Project structure

```
ai-training/
├── .github/workflows/ci.yml      # lint + Astro check + build, and the zizmor audit
├── .github/workflows/deploy.yml  # build and publish to GitHub Pages
├── .github/dependabot.yml        # weekly bun + github-actions updates
├── .claude/settings.json         # shared agent permissions (tracked on purpose)
├── .mise.toml                    # toolchain pins + every repo task
├── prek.toml                     # git hooks, also run by `mise run lint`
├── site/                         # the Astro Starlight site
│   ├── src/content/docs/         # the pages
│   ├── src/styles/custom.css     # the LSD Warm theme
│   ├── public/presentations/     # Quarto decks + committed HTML/PDF output
│   ├── astro.config.mjs          # site, base path, sidebar, rehype plugin
│   ├── package.json              # site dependencies (ranges; bun.lock pins them)
│   └── bun.lock                  # committed; never gitignore this
├── docs/spec/                    # numbered specs (S01 is the dictionary)
├── docs/plan/                    # the rough plan and exploration notes
├── docs/agents/                  # agent-facing process docs (issue tracker)
├── AGENTS.md                     # AI agent instructions
├── CLAUDE.md -> AGENTS.md        # Claude Code compatibility
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE                       # CC BY-SA 4.0 (content)
├── LICENSE-CODE                  # Apache-2.0 (code)
├── NOTICE.md                     # third-party material and its terms
└── README.md
```

`CLAUDE.md` is a git symlink (mode `120000`). A Windows clone needs
`core.symlinks` enabled to get a real link rather than a text file containing
the target path.

## Publishing

The repository is private for now. Once public, enable GitHub Pages with the
source set to **GitHub Actions**; a push to `main` then builds and deploys the
site to `https://lsimons.github.io/ai-training/`. Then restrict the
`github-pages` environment's deployment branches to `main`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md). AI agents see
[AGENTS.md](./AGENTS.md). Security reports: [SECURITY.md](./SECURITY.md).

## License

Content is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); see
[LICENSE](./LICENSE), which also says what counts as content. Code is
licensed under the [Apache License 2.0](./LICENSE-CODE). Third-party
material and its terms are listed in [NOTICE.md](./NOTICE.md).
