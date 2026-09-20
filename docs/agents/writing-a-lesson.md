# Writing a lesson

How to write a lesson page with the lesson components. The rules the page
must follow are in `docs/spec/S03-lesson-authoring.md`; the ids it declares
come from `docs/spec/S02-topic-map.md` and the YAML under `site/src/data/`.
This file is the mechanics.

## File and frontmatter

A lesson is an MDX file at `site/src/content/docs/<area>/<lesson>.mdx`. Its
lesson id is `<area>/<lesson>`. The course page for the area is
`site/src/content/docs/<area>/index.mdx`.

```mdx
---
title: Delegating a task to an agent
description: One sentence for search and social cards.
mode: tutorial            # or explanation
covers:
  - using-agents/delegating
serves:                   # objective ids: <area>/<competency>/<objective>
  - using-agents/delegates-and-checks/writes-a-brief
  - using-agents/delegates-and-checks/chooses-autonomy
assumes:                  # each points at the lesson section that teaches it
  - objective: concepts/explains-models/explains-generation
    lesson: concepts/how-models-work
    section: one-token-at-a-time   # slug of a real `## ` heading in that lesson
extends-to:
  - label: Decomposing work
    href: /using-agents/decomposition/
sources:                  # keys in site/src/data/bibliography.yaml
  - AEC-01
---

import { Choice, Predict, Order, Sort, Scenario, Repair, Pitfall, Exercise, Recap, Prompt, Response } from '@components/lesson';
```

`assumes` may be empty for a first lesson. `extends-to` hrefs may point at
pages that do not exist yet; they render as plain text until they do.

## Anatomy

Opener paragraph(s), then H2 sections. Teaching prose is plain Markdown.
Components go between paragraphs, never inside list items or tables.
Every served objective gets at least one checkpoint with
`objective="<that id>"`; each checkpoint names the one objective it
evidences. One `<Pitfall>`, one `<Exercise>`, one `<Recap>`
at the end. Tutorial mode: one or two paragraphs, then an example the
learner runs or predicts; every example that runs gets a `<Predict>`.

## Checkpoints

All checkpoints take `id` (stable slug, unique in the page; it becomes the
section id and the progress key), `objective`, `title`, and `hint` (a
diagnostic question, never the answer). Children are the stem, as Markdown.

```mdx
<Choice id="what-the-model-does" objective="concepts/explains-models/explains-generation"
  title="What did the model do?" hint="What is the one operation the widget performs?"
  options={[
    { text: 'It looked the answer up in the weights.', why: 'Weights are not a database; nothing is stored as records.' },
    { text: 'It produced the answer token by token.', correct: true },
    { text: 'It searched the web.', why: 'Search is a separate tool; the model only predicts tokens.' },
  ]}>
A colleague says: "The model looked up the answer in its database." Which correction is right?
</Choice>
```

The learner sees `why` after picking that wrong option. Never put the answer in a
`why`.

````mdx
<Predict id="predict-tool-call" objective="building-agents/builds-agent-loop/defines-a-tool"
  title="Predict the output" hint="The tool is a plain function; look up the key."
  answer="27°C, sun" run="building-agents/agent-loop/tool_call.py">
What does this print?

```python
print(TOOLS["get_weather"]["fn"]("Lisbon"))
```

</Predict>
````

`run` names a file under `site/examples/`. `mise run examples` executes it
and fails if its stdout is not `answer`. The file holds the complete,
runnable program; the page shows only the part the learner needs. Omit
`run` only for the honor-system variant (predict what an agent does), and
then say in the stem that the learner checks it themselves.

```mdx
<Order id="order-the-loop" objective="..." title="Order the loop" hint="..."
  steps={['Send the messages to the model', 'Check for a final answer', 'Run the tool', 'Append the result']} />
```

`steps` is the correct order; the page shuffles it.

```mdx
<Sort id="autonomy-levels" objective="..." title="Who decides?" hint="..."
  buckets={['Human decides', 'Agent proposes, human approves', 'Agent acts, human reviews after']}
  items={[
    { text: 'Delete the old branches', bucket: 0 },
    { text: 'Draft the release notes', bucket: 2 },
  ]} />
```

```mdx
<Scenario id="approve-or-not" objective="..." title="The agent asks to push" hint="..."
  options={[
    { text: 'Approve; CI will catch problems.', consequence: 'CI catches test failures, not a wrong branch. The push goes to main.' },
    { text: 'Ask which branch first.', correct: true, consequence: 'The agent names the branch; you see it is main and redirect it.' },
  ]}>
The agent says it is done and asks permission to `git push`. You have not looked at the diff.
</Scenario>
```

Every option has a `consequence`; the correct one too.

```mdx
<Repair id="fix-the-brief" objective="..." title="Fix the brief" hint="..."
  broken={`Update the pricing.`}
  model={`Update the pricing table in docs/pricing.md from prices.xlsx. Do not change any other file. Done when every row of the sheet appears once and the totals match.`}>
This brief will send the agent off track. Rewrite it so it states goal, context, limits and done-criteria.
</Repair>
```

`Repair` reveals the model answer on request and then asks the learner to
self-grade (pass, partial, retry). Only pass counts. Not reviewed later.

## Other components

```mdx
<Pitfall title="Asking the model why">
Setup, what went wrong, the rule. Two to five sentences.
</Pitfall>

<Exercise stretch="Now ask for a refactor you choose and review it the same way.">
What to do, outside the page, in a resettable setting. Then what a good result looks like, so the learner can self-grade.
</Exercise>

<Prompt model="Claude Sonnet 4.6" recorded="2026-09">
The prompt text.
</Prompt>
<Response>
The recorded response.
</Response>

<Prompt model="illustrative" recorded="illustrative">
A prompt written by the author, not recorded from a model.
</Prompt>
<Response>
The written response. The component labels the pair as illustrative; the
page must also say so in prose next to it.
</Response>

<Recap>
1. First takeaway.
2. Second takeaway.
</Recap>
```

`Recap` appends "You can now..." from the served objectives, the sources
from frontmatter, what comes next from `extends-to`, and the finish button.
Do not write those by hand.

Widgets are their own components under `site/src/components/widgets/` and
are imported by name. They teach and never grade.

## Rules that bite

- Component children are Markdown but must be separated from the tags by a
  blank line if they contain block elements (code fences, lists).
- Backticks inside a prop string: use a template literal, as `Repair` does.
- Never a literal `</script>` or `</pre>` in any string.
- Links are root-relative (`/using-agents/`); the build fails on a dead
  internal link, so link only to pages that exist, or use `extends-to`.
- No company names, internal URLs, or text adapted from NC-licensed sources.
  See the licensing rules in `AGENTS.md`.
