# write-good.TooWordy

## Rule

`.vale/styles/write-good/TooWordy.yml` extends Vale's `existence` check
against a fixed list of 214 tokens (single words and short phrases, e.g.
"a number of", "due to the fact that", "utilize", "it is"), matched
case-insensitively (`ignorecase: true`). It ships at `level: warning` and
carries the message `'%s' is too wordy.`. It is currently not enabled in
`.vale.ini` or `.vale-extended.ini` (only `write-good.Cliches` and, in the
extended config, `write-good.Passive` are); the data below comes from the
whole-package evaluation run (`.vale-eval.ini`).

## Stats

Total hits: **163**.

| area       | hits |  words | hits / 1000 words |
| ---------- | ---: | -----: | ----------------: |
| agent-docs |    7 |  1,627 |              4.30 |
| data       |    0 | 18,534 |              0.00 |
| lessons    |   30 | 12,232 |              2.45 |
| plan       |   51 | 15,885 |              3.21 |
| repo-docs  |   10 |  4,900 |              2.04 |
| spec       |   65 | 13,187 |              4.93 |

Top matched phrases (lowercased), out of 21 distinct phrases:

| phrase         | count |
| -------------- | ----: |
| it is          |    56 |
| objective      |    55 |
| multiple       |    13 |
| evaluate       |    10 |
| implement      |     7 |
| it was         |     4 |
| advise         |     2 |
| all of         |     2 |
| whether or not |     2 |
| demonstrate    |     1 |
| overall        |     1 |
| retain         |     1 |
| proficiency    |     1 |
| equivalent     |     1 |
| substantial    |     1 |
| assistance     |     1 |
| maximum        |     1 |
| refer back     |     1 |
| monitor        |     1 |
| in terms of    |     1 |
| however        |     1 |

## Examples

Twelve examples: one per top-five phrase (it is, objective, multiple,
evaluate, implement), one per area with hits (agent-docs, lessons, plan,
repo-docs, spec), and three picked at random from the rest with
`random.seed(1)` in Python's `random` module over the remaining hit list
(picks: `docs/plan/explore/09-brilliant-skills-map.md:106`,
`site/src/content/docs/safety/agent-risk.mdx:130`,
`docs/plan/explore/02-agent-engineer-course.md:103`).

- `AGENTS.md:135` (top-5 phrase "it is", repo-docs)
  > - `mise run ci` must pass before you push. It is the same list the CI job
  >   runs, in the same order.
- `.claude/skills/tutor/SKILL.md:42` (top-5 phrase "objective", agent-docs)
  > | ELI5 | Re-explain the concept with an everyday analogy, then tie it back to the definition |
  > | why it matters | Connect the objective's behaviour "why" to the learner's work |
  > | quiz me | Ask one question per served objective, one at a time; hints on a miss, never answers |
- `docs/plan/README.md:57` (top-5 phrase "multiple", plan)
  > - **Interactive lesson content** in the style of the Anthropic SCORM modules:
  >   teaching screens, checkpoints (multiple choice, sorting, scenario
  >   decisions), watch-out boxes, reflection prompts, recap and quiz. Progress
- `docs/agents/issue-tracker.md:22` (top-5 phrase "evaluate", agent-docs)
  > | documentation | Improvements or additions to documentation | #0075ca |
  > | enhancement | New feature or request | #a2eeef |
  > | needs-triage | Maintainer needs to evaluate this issue | #e6e6fa |
  > | needs-info | Waiting on reporter for more information | #e6e6fa |
- `docs/agents/issue-tracker.md:37` (top-5 phrase "implement", agent-docs)
  > (step 2) A maintainer reads the issue and either asks for more detail
  > (`needs-info`), closes it (`wontfix`), or specifies it fully.
  > (step 3) The maintainer labels a fully specified issue `ready-for-agent` when an
  > autonomous agent can implement it, or `ready-for-human` when it needs
  > judgement, design or access an agent does not have.
- `site/src/content/docs/coding-with-agents/first-session.mdx:44` (lessons, area coverage; phrase "it was")
  > `site/examples/coding-with-agents/first-session/fixture-repo/`. Copy that
  > directory somewhere, or work in a clone of the course repository; either
  > way, `git checkout -- .` inside it puts every file back the way it was. You
  > will reset it at least once.
- `docs/spec/000-specs.md:16` (spec, area coverage; phrase "it is")
  > | S03 | [Lesson authoring](S03-lesson-authoring.md) | Fix the rules every lesson page follows: page kind, anatomy and frontmatter, examples, citations, terms and prompts, checkpoints, exercises and widgets. | Draft |
  > | S04 | [Progress record](S04-progress-record.md) | Define the learner's progress record: what it stores, where it lives, how it is versioned, and how it moves between browsers. | Draft |
  > | S05 | [Spaced review](S05-spaced-review.md) | Define how the site brings a learner back to what they learned, without a backend: which items are reviewed, on what schedule, where reviews surface, and what is stored. | Draft |
- `docs/plan/explore/09-brilliant-skills-map.md:106` (random pick; phrase "objective")
  > - ABS-3 Re-apply reasoning as the level of tooling rises
  >
  > Skill density per objective ranges from 2 (most) to 6 (SPC-5, VER-1).
- `site/src/content/docs/safety/agent-risk.mdx:130` (random pick; phrase "it is")
  > **Can it be undone?** Drafting is reversible; sending is not. Renaming a
  > file is reversible; deleting it is usually not. Reading is reversible;
  > posting is not. Approve before the irreversible step, not before the
- `docs/plan/explore/02-agent-engineer-course.md:103` (random pick; phrase "retain")
  > - For a CC-licensed derivative: Apache-2.0 is one-way compatible with CC BY 4.0
  >   and CC BY-SA 4.0. A derivative may carry a CC license while keeping
  >   Apache-2.0 terms on the incorporated material. Required: retain the Apache
  >   license text and notices, state that files were changed, credit Addy Osmani
- `docs/spec/S02-topic-map.md:40` (spec, phrase "objective", top hit file)
  > | **Concept** | noun | one paragraph definition | Inherits its topic's edges; has a glossary anchor |
  > | **Competency** | verb phrase | three to six learning objectives | The topics it draws on, possibly across areas; its alignment rows |
  > | **Learning objective** | verb phrase | two to six behaviours; one level | What lessons serve and assume, what checkpoints prove |
- `docs/spec/S01-dictionary.md:139` (spec, phrase "it is")
  > (under the heading "Knowledge model") These describe what the site teaches, independent of how it is laid out.
  > Topics and concepts are the nodes and edges of the **topic map**; they say

## Concentration

Top five files by hit count:

| file                                         | hits |
| -------------------------------------------- | ---: |
| docs/spec/S02-topic-map.md                   |   32 |
| docs/plan/explore/09-brilliant-skills-map.md |   15 |
| docs/spec/S01-dictionary.md                  |   11 |
| docs/plan/explore/10-execute-program.md      |    9 |
| docs/spec/S03-lesson-authoring.md            |    8 |

The two dominant phrases explain most of the concentration. "objective"
(55 hits) clusters in `docs/spec/S02-topic-map.md` and
`docs/spec/S01-dictionary.md`, where it is a defined term (the dictionary
entry "Learning objective") repeated in Markdown table cells and headings
across multiple table rows ("Learning objectives:", "| Competency |
Objective | Level | Statement |"), not in running prose. "it is" (56
hits) is spread more evenly across running prose in specs, plan notes and
lesson MDX body text (e.g. `AGENTS.md:135`, `docs/spec/S01-dictionary.md:139`,
`site/src/content/docs/safety/agent-risk.mdx:130`), rather than
concentrated in one file. The `data` area (topic/competency/bibliography
YAML) has zero hits.
