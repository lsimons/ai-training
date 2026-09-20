# Tutor skill (S08)

**Purpose:** Define how a learner gets the tutor into their own agent and how
the tutor gets the lesson: a thin installed skill that fetches its
instructions and a per-lesson bundle from the published site, with the
GitHub Pages deploy as the publish step.

**Status:** Accepted - design decided 2026-09-20, no code yet. The current
`.claude/skills/tutor/SKILL.md` is the local-repo tutor this spec replaces.

## Introduction

Terms are per the [project dictionary](S01-dictionary.md): the **tutor** is
Claude acting in tutor mode, it gives hints and withholds answers, and it
offers the **tutor verbs** scoped to one lesson. Lessons are written per
[lesson authoring](S03-lesson-authoring.md), their concepts and behaviors
come from the [topic map](S02-topic-map.md), the exported progress file is
the [progress record](S04-progress-record.md), and the recall question at
session start is the [spaced review](S05-spaced-review.md) rule for tutor
mode.

Until now the tutor was a skill inside this repository. It read lesson
`.mdx` files and topic YAML from disk and cited `localhost:4321`, so it only
worked for someone who had cloned the repo and started the dev server. That
excludes nearly every learner. This spec moves the tutor to the published
site, so that a learner with Claude Code or opencode and one install command
can open any lesson in a tutor session.

## Principles

- **Thin skill, live content.** The installed skill file is a small
  bootstrap. Everything that can go stale (ground rules, verbs, exemplar
  dialogues, lesson text) is fetched from the published site when the
  skill loads. Learners rarely upgrade an installed skill, so the installed
  file holds only how to fetch and what to say when a fetch fails.
- **One publish step.** The GitHub Pages deploy publishes the site, the
  tutor instructions and the lesson bundles together. They can't drift from
  each other, because the same build emits all of them.
- **The tutor reads what the learner reads.** A lesson bundle is built from
  the same content collections as the lesson page, so the tutor's hints are
  about the page in front of the learner.
- **No backend.** Bundles and instructions are static files. The tutor
  never calls a service this project runs, and the site never hears from
  the tutor.
- **No dependency on how the agent is configured.** The tutor works with
  the learner's default agent settings. The getting-started page
  recommends flags that make sessions more alike, and nothing breaks without
  them.

## Distribution

| Rule            | Decision                                                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source of truth | The skill directory `.claude/skills/tutor/` in the GitHub repo `lsimons/ai-training`, on `main`.                                                                                                                                                               |
| Install         | The `skills` CLI, which installs a skill from a GitHub repo into Claude Code or opencode: `npx skills add lsimons/ai-training --skill tutor`. The exact command is printed by the lesson page block and the getting-started page, and both print the same one. |
| Not offered     | A plugin marketplace entry, a `curl` one-liner, a manual copy of the file. One install path keeps the instructions on the page short and the support surface small.                                                                                            |
| Precondition    | The repo is public, which it is as of the "ready to go public" release. The install command fails on a private repo, so the page never showed it before that.                                                                                                  |
| Invocation      | `/tutor` in Claude Code, the matching slash command in opencode. The skill's `description` field says what it does so the agent can also pick it up from a plain request.                                                                                      |

## Bootstrap contract

The installed `SKILL.md` is the bootstrap. It contains, and only contains:

| Part             | Content                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontmatter      | `name: tutor` and a one-sentence `description`, as the skill format requires.                                                                                                                                                                     |
| Instructions URL | The absolute URL of the published instruction file (below). The bootstrap fetches it first, before saying anything to the learner.                                                                                                                |
| Version check    | The bootstrap declares the `version` it understands. If the fetched file's `version` is higher, the tutor tells the learner to reinstall the skill with the install command and then continues as far as the instructions still make sense to it. |
| Lesson step      | Ask the learner for the lesson URL, or take it from what they pasted. Derive the bundle URL by the scheme below, fetch it, and follow the fetched instructions from there.                                                                        |
| Offline message  | If either fetch fails, say so in one sentence, name the URL that failed, and offer to continue from the lesson page the learner has open, as a plain conversation without the verbs. Never invent lesson content when the fetch fails.            |

The bootstrap has no ground rules, no verbs and no dialogues. Those are in
the published instruction file, so a rule change reaches every installed
skill on the next deploy.

The bootstrap uses the agent's built-in fetch tool (Claude Code's
`WebFetch`, opencode's `webfetch`) and no other tool. It doesn't read files
on the learner's machine except the progress export the learner hands it.

## Published instruction file

The build emits one Markdown file with a YAML frontmatter block at:

```text
https://lsimons.github.io/ai-training/data/tutor.md
```

| Field (frontmatter) | Holds                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `version`           | Integer, starts at 1. Bumped when the bootstrap contract or the bundle format changes in a way an older bootstrap can't follow.                  |
| `built`             | ISO date of the build that emitted the file.                                                                                                     |
| `bundle_url`        | The bundle URL template, `https://lsimons.github.io/ai-training/data/lessons/{area}/{lesson}.json`, so the derivation rule ships with the rules. |
| `site`              | The site's base URL, for citations.                                                                                                              |

| Section (body)     | Holds                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground rules       | Give hints rather than answers. Stay on the node. Show, don't tell. Re-read the rules when the conversation is long. Redirect to the page after three asks on one checkpoint.                                        |
| Starting a session | Read the bundle. If the learner has pasted a progress export, ask one recall question for the first item in `reviews` that is due today or earlier. Otherwise point at the course review page. Then offer the verbs. |
| Verbs              | The S01 tutor verbs table, including *critique this* (the tutor writes a deliberately imperfect answer and the learner critiques it against the behaviors). Each verb says what part of the bundle it draws on.      |
| Citing             | How to cite from the bundle: the lesson URL for prose, `topic_url` for a concept, `competency_url` for a behavior, the glossary URL for a concept id.                                                                |
| Exemplar dialogues | Two to four short dialogues that show the hint ladder and never reveal an answer.                                                                                                                                    |
| Out of scope       | What the tutor declines: other lessons in the same session, grading for a certificate, reading browser storage, changing the learner's files.                                                                        |

The file's body is the text that was in `.claude/skills/tutor/SKILL.md`,
moved and rewritten for a reader who has the bundle rather than the repo.
Its source in the repo is a Markdown file under `site/`, and the build
copies it into the output with the frontmatter fields filled in.

## Lesson bundles

### URL scheme

One JSON file per lesson page, under the site's data path:

```text
https://lsimons.github.io/ai-training/data/lessons/<area>/<lesson>.json
```

The learner pastes the lesson page URL. The bootstrap derives the bundle
URL by inserting `data/lessons/` after the base path and replacing the
trailing slash with `.json`:

| Lesson page                                                      | Bundle                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `https://lsimons.github.io/ai-training/using-agents/delegating/` | `https://lsimons.github.io/ai-training/data/lessons/using-agents/delegating.json` |
| `https://lsimons.github.io/ai-training/safety/agent-risk/`       | `https://lsimons.github.io/ai-training/data/lessons/safety/agent-risk.json`       |

Course pages (`<area>/index.mdx`), guides and reference pages have no
bundle. A fetch of a bundle that doesn't exist is a 404, and the bootstrap
treats it as "this isn't a lesson page" and asks for a lesson URL.

### Format

| Field           | Type    | Holds                                                                                                                                                                                                                        |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`       | integer | Bundle format version, equal to the instruction file's `version`.                                                                                                                                                            |
| `id`            | string  | The lesson's page route, `<area>/<lesson>`.                                                                                                                                                                                  |
| `url`           | string  | The lesson page's absolute URL.                                                                                                                                                                                              |
| `title`         | string  | Frontmatter `title`.                                                                                                                                                                                                         |
| `mode`          | string  | `tutorial` or `explanation`.                                                                                                                                                                                                 |
| `prose`         | string  | The lesson body as Markdown, with components rendered to their plain-text equivalent (a `Pitfall` becomes a paragraph with a "Pitfall" heading, a `Prompt` a fenced block) and widgets omitted.                              |
| `topics[]`      | array   | Per covered topic: `id`, `name`, `definition`, `url`, `concepts[] {id, name, definition}`.                                                                                                                                   |
| `objectives[]`  | array   | Per served objective: `id`, `statement`, `level`, `competency_url`, `behaviors[] {claim, why, example}`.                                                                                                                     |
| `assumes[]`     | array   | Per assumed objective: `objective`, `lesson`, `section`, `url` (the section's absolute URL). The tutor points here when the gap is upstream.                                                                                 |
| `checkpoints[]` | array   | The lesson's items from the site-wide `checkpoints.json` export, in page order, with that export's fields (`id`, `kind`, `objective`, `concepts`, `context`, `stem`, `options`, `answer`, `hint`, `reviewable`, `revision`). |
| `extends_to[]`  | array   | Per `extends-to` entry: `label`, `url`.                                                                                                                                                                                      |

The bundle contains the answers, because the page does too (S04, "The
answer is in the page"). The tutor's ground rules, and never the format,
are what keep the answer from the learner.

### Build

- The bundle is written by the site build, from the same content
  collections and data files as the lesson page. There is no second source.
- `checkpoints[]` is filtered from the `checkpoints.json` export by
  `lesson`, so the two never disagree.
- The build fails when a live lesson has no bundle, and `mise run site-build`
  is the check. A small test asserts that every bundle parses and that its
  `id` matches its path.
- The bundle's `prose` is the Markdown after the rehype plugin has made
  links absolute, so a link in the prose is one the tutor can quote.

## Lesson page block

Every lesson page ends with an "Open in tutor" block, after the recap and
before the footer. It is a `not-content` container and contains, in this
order:

1. The install command, once, in a code span with a copy button.
2. The paste-ready line for this lesson, in a code span with a copy
   button: `/tutor https://lsimons.github.io/ai-training/<area>/<lesson>/`.
3. One sentence: the tutor can't read the progress stored in this browser,
   so export it from the settings page and paste the file if a recall
   question is wanted.
4. A link to the getting-started page.

The block is the same component on every lesson, and it takes the lesson
URL from the page. It never shows on course pages, guides or reference
pages.

## Getting-started page

One how-to page under guides, `guides/tutor.md`, reached from the lesson
page block and from the landing page. It has these sections and no others:

| Section                   | Content                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install                   | Prerequisites (Claude Code or opencode, Node for `npx`), the install command, how to see that the skill is listed.                                                                                                  |
| First session             | Open `coding-with-agents/first-session`, copy its paste-ready line, run it, and what a correct first reply looks like (the tutor names the lesson and offers the verbs).                                            |
| What the tutor does       | The verbs, in one line each, and the hint-only rule.                                                                                                                                                                |
| What the tutor doesn't do | Read browser storage (export progress instead), leave the lesson, give answers, change files.                                                                                                                       |
| Recommended flags         | `claude --safe-mode --permission-mode manual` for Claude Code, as a suggestion: the tutor never needs to run a command or edit a file, and the flags stop it from doing either. The opencode equivalent when known. |
| When it fails             | The offline message, what to check (network, the URL is a lesson page), and where to file an issue.                                                                                                                 |

The page is a how-to per S01, so it records no progress and sits in no
path. `coding-with-agents/first-session` links to it as the way to get help
on that lesson, which is how the page is exercised.

## Progress

The tutor can't read browser local storage, and the site has no backend to
read it from. Manual export per S04 stays the only way progress reaches the
tutor. The learner exports the file, pastes it or its path into the
session, and the tutor reads `reviews` from it for the recall question.
Nothing flows the other way: the tutor doesn't write progress, and passing
a checkpoint with the tutor doesn't mark it passed on the site.

## Related specs

- [S01 Project dictionary](S01-dictionary.md): tutor, tutor verbs, lesson,
  review.
- [S02 Topic map and competencies](S02-topic-map.md): the topic and
  competency data the bundle copies and the pages it cites.
- [S03 Lesson authoring](S03-lesson-authoring.md): the frontmatter fields
  the bundle carries, the checkpoint export it filters.
- [S04 Progress record](S04-progress-record.md): the export the learner
  pastes.
- [S05 Spaced review](S05-spaced-review.md): the recall question at session
  start.

## Open questions

1. Whether the bundle should contain the full `prose` or the headings and
   the recap only, to keep the tutor's context small. Leaning: full prose,
   because a lesson is at most 25 minutes of reading and the hints need
   the wording the learner saw.
2. Whether to publish one `tutor.md` per language once lessons are
   translated. Leaning: one file, and the bundle carries the language.
3. Whether a small blind eval set (a few dozen queries across lessons and
   verbs, re-run after a model change) belongs in this repo. Leaning: yes,
   as a `mise` task that isn't in `ci`, once there are exemplar dialogues to
   grade against.
4. Whether the `skills` CLI's install path stays stable enough to print on
   every lesson page. Leaning: yes, and the getting-started page is the one
   place to change if it doesn't.

## Out of scope

- An in-browser terminal or a coaching agent on the page. Decided against
  separately.
- A tutor that writes progress back to the site.
- Running the tutor against a local checkout. The published site is the
  only source, and a maintainer previewing a change uses
  `mise run site-preview` and points the bootstrap at `localhost` by hand.
