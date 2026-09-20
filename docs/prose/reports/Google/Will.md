# Google.Will

## Rule

`.vale/styles/Google/Will.yml` extends `existence` with a single-token list
(`will`), `ignorecase: true`, shipped at `level: warning`, linking to
`https://developers.google.com/style/tense`. The message is `Avoid using '%s'.`. The token list has one entry, so the rule fires on every occurrence
of the word "will" (any case) and does not distinguish future-tense
auxiliary use from other uses.

## Stats

Total hits: 58.

| area       | hits | words  | hits/1000 words |
| ---------- | ---- | ------ | --------------- |
| lessons    | 32   | 12,227 | 2.62            |
| plan       | 14   | 15,884 | 0.88            |
| spec       | 6    | 13,184 | 0.46            |
| agent-docs | 3    | 2,707  | 1.11            |
| repo-docs  | 3    | 3,489  | 0.86            |
| data       | 0    | 18,534 | 0.00            |

Top matched phrases (lowercased):

| phrase | count |
| ------ | ----- |
| will   | 58    |

1 distinct phrase (the token list has only one entry; one hit is the
capitalized `Will`, the rest are lowercase `will`).

## Examples

Areas with hits: lessons, plan, spec, agent-docs, repo-docs. The single
phrase "will" appears in every example below.

- `CODE_OF_CONDUCT.md:46` (repo-docs): "Instances of abusive, harassing, or
  otherwise unacceptable behavior may be reported to the project owner.
  Complaints will be reviewed and investigated."
- `SECURITY.md:17` (repo-docs): "We will acknowledge your report within a few
  days and keep you informed of progress. This is a small personal project,
  so response times may vary."
- `docs/agents/issue-tracker.md:26` (agent-docs), table row: "| wontfix
  | This will not be worked on | #ffffff |"
- `docs/prose/README.md:33` (agent-docs): "The maintainer decides. The
  decision lands in the table below and in the config files; hits for rules
  that will gate get fixed first."
- `docs/plan/explore/08-diataxis.md:44-45` (plan): "Open with where we are
  going ("In this lesson we will…"), not with "you will learn…".
  Objectives are frontmatter data that drive checkpoints"
- `docs/plan/explore/10-execute-program.md:60` (plan): "Course page: title,
  one-line description, an About panel (what you will learn, counts, median
  time, prerequisites), a completion ring (lessons done,"
- `docs/plan/explore/11-roadmap-sh.md:192` (plan), the one capitalized hit:
  "level), description, **Project Requirements** as a numbered list with code
  snippets, **Technologies to Use**, **What You Will Learn**, an optional"
- `docs/spec/S03-lesson-authoring.md:43` (spec), table row: "| Opener |
  Where we are going: "In this lesson we will...". Never "you will
  learn...". |"
- `docs/spec/S02-topic-map.md:296` (spec), table row: "| `specifies-work`
  | `designs-the-check` | base | Designs how the work will be
  verified before it is built |"
- `site/src/content/docs/using-agents/delegating.mdx:23` (lessons): "In this
  lesson we will delegate one small task to an agent and get a result we can
  check. We will write the brief, decide how much the agent may do"
- `site/src/content/docs/coding-with-agents/first-session.mdx:26` (lessons):
  "In this lesson we will run one complete session with a coding agent: open
  it in a small repository, ask it to explain the code, point it at a
  failing"
- `site/src/content/docs/safety/agent-risk.mdx:77-78` (lessons): "The habit
  is to say the blast radius out loud before you start. Not "it will reply
  to a few emails" but "it can send mail as me to anyone". Not "it will
  tidy downloads" but "it can delete anything in my home folder"."

Three picked at random from the rest (of the 58 alerts, excluding the ones
already shown above):

- `site/src/content/docs/customizing-agents/instructions.mdx:62` (lessons):
  "Five lines of content. An agent that reads this will run the right test
  command on the first try instead of guessing between `pytest`,"
- `docs/plan/explore/09-brilliant-skills-map.md:71` (plan): "SPC-5 Manage
  the information and constraints the work requires
  - SPC-6 Design how the work will be verified"
- `site/src/content/docs/concepts/how-models-work.mdx:34` (lessons): "This
  has consequences you will notice. Models are bad at counting letters in a
  word, because they never saw the letters."

## Concentration

Top five files by hit count:

| file                                                       | hits |
| ---------------------------------------------------------- | ---- |
| site/src/content/docs/using-agents/delegating.mdx          | 10   |
| site/src/content/docs/coding-with-agents/first-session.mdx | 7    |
| site/src/content/docs/safety/agent-risk.mdx                | 7    |
| site/src/content/docs/customizing-agents/instructions.mdx  | 5    |
| docs/plan/explore/10-execute-program.md                    | 4    |

The hits concentrate in running prose, not tables or code. A recurring
source in the `lessons` area is the mandated lesson opener construction "In
this lesson we will..." (specified in `docs/spec/S03-lesson-authoring.md:43`
and echoed in `docs/plan/explore/08-diataxis.md:44` and
`docs/plan/explore/12-learn-prompting.md:161`), which alone accounts for one
hit in each of `delegating.mdx`, `first-session.mdx`, `agent-risk.mdx` and
`instructions.mdx`. The rest of the lesson hits are future-tense statements
describing what the agent or reader will do or see, spread through
paragraph prose rather than clustered in one spot. Two hits land inside
table rows (`docs/agents/issue-tracker.md:26`, `docs/spec/S03-lesson-authoring.md:43`,
`docs/spec/S02-topic-map.md:296` and `:400`); the remaining hits in `plan`
and `spec` are exploration notes and spec prose, none inside quoted
material or code-adjacent text. No hits fall in headings. The `data` area
(YAML frontmatter for topics, competencies, bibliography) has zero hits.
