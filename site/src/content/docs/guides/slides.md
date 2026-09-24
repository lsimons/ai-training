---
title: Slide decks with Quarto
description: Author slide decks in Quarto and render them to HTML and PDF.
---

Slide decks are authored in [Quarto](https://quarto.org/) (`.qmd`) and rendered
to two static outputs that live in `site/public/presentations/`:

- **HTML** - a self-contained [reveal.js](https://revealjs.com/) deck
  (`example.html`), themed to match the site.
- **PDF** - a printable version (`example.pdf`) via Quarto's Beamer output.

A worked example is at
[`site/public/presentations/example.qmd`](/presentations/example.qmd). Open the
rendered [HTML slides](/presentations/example.html) or the
[PDF](/presentations/example.pdf).

## Render

Quarto is pinned in `.mise.toml`. Render the example (both formats) with:

```bash
mise run site-slides
```

That runs `site/scripts/render-slides.mjs`, which calls
`quarto render site/public/presentations/example.qmd` to produce `example.html`
and `example.pdf` beside the source, and then edits one line of the HTML: it
adds `postMessage: false` to the `Reveal.initialize({...})` call that Quarto
generates. reveal.js listens for cross-window `message` events from any origin
by default and runs whatever API method the message names. A page on another
origin that embeds the deck in an iframe could use that to load its own script
on the site's origin. Quarto has no front-matter key for the option, and the
script sets it after the render instead. The script fails when it finds anything other than exactly one
`Reveal.initialize({` in the HTML, so a Quarto template change shows up as a
failed render rather than an unpatched deck.

The PDF output uses LaTeX (Beamer); if it is missing, install it once with
`quarto install tinytex`. On a machine without a working LaTeX, pass
`--html-only` to render only the HTML:

```bash
mise run site-slides --html-only
```

The committed PDF then stays as it was, which is only right when the `.qmd`
didn't change.

The rendered outputs are committed to git, because decks change rarely and this
keeps the deployed site a pure static build (CI doesn't run Quarto). Re-run
`mise run site-slides` and commit the results whenever you edit a deck.

## Theme

The reveal.js theme is defined in `site/public/presentations/reveal.scss` and maps
the deck's fonts and accent color onto the site's LSD Warm palette. Adjust the
SCSS variables there to restyle the HTML slides.

## Add a deck

1. Copy `example.qmd` to a new name in `site/public/presentations/`.
2. Edit the frontmatter `title`/`author` and write your slides (`#` starts a
   section, `##` starts a slide).
3. Render with `mise run site-slides site/public/presentations/your-deck.qmd`.
4. Link it from the sidebar in `astro.config.mjs` (see the "Example slides"
   group), and add a redirect for the extensionless URL if you want a clean
   sidebar link.
