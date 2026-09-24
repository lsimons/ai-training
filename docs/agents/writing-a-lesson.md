# Writing a lesson

How to write a lesson page with the lesson components. The rules the page
must follow are in `docs/spec/S03-lesson-authoring.md`; the ids it declares
come from `docs/spec/S02-topic-map.md` and the YAML under `site/src/data/`.
This file is the mechanics.

## Files

A lesson is two files. Its **plan** is
`site/src/data/areas/<area>/lessons/<lesson>.yaml`, which exists before the
lesson is written and holds everything the site knows about it. Its **page**
is `site/src/content/docs/<area>/<lesson>.mdx`, which has no frontmatter:
the build copies `title`, `description`, `mode`, `covers`, `serves`,
`assumes`, `extends-to`, `covered-by`, `sources-checked` and `review-by`
from the plan onto the page. The lesson id is
`<area>/<lesson>`, the same as the page route and the plan's `id`. Spec S11
is the rule, and this section is the mechanics.

```yaml
id: using-agents/delegating
title: Delegating a task to an agent
description: One sentence for search and social cards.   # required once the page exists
mode: tutorial            # or explanation
covers: using-agents/delegating                            # one topic id, from this area
serves:                   # objective ids: <area>/<competency>/<objective>
  - using-agents/delegates-and-checks/writes-a-brief
  - using-agents/delegates-and-checks/chooses-autonomy
introduces: [task-brief, giving-context]                  # concept ids first taught here
assumes:                  # once live, each names the lesson section that teaches it
  - objective: concepts/explains-models/explains-generation
    lesson: concepts/how-models-work
    section: one-token-at-a-time   # slug of a real `## ` heading in that lesson
extends-to:               # a root-relative page path, or an https:// URL under a bibliography `url`
  - label: Decomposing work
    href: /using-agents/decomposition/
covered-by:               # optional: one external course that covers every served objective
  label: AI capabilities and limitations
  href: https://academy.claude.com/courses/ai-capabilities-and-limitations
after: []                 # lesson ids of this area, for the graph while the lesson is coming
shorts: [Asking for sources]                               # titles of shorts to write, or []
exercise:                 # or `exercises:` with a list, for a longer lesson
  kind: do                # do | judge
  brief: Brief the agent for a short email, then review the draft against the brief.
sources: [Academy introduction-to-claude-cowork]           # bibliography keys
issue: 42                 # the lesson's GitHub issue
minutes: 15
notes: >-
  Free prose for authors: rationale, a content sketch, issue pointers. Never rendered.
```

The page opens with the imports and the first paragraph:

```mdx
import { Choice, MultiChoice, Match, Predict, Order, Sort, Scenario, Repair, Pitfall, Exercise, Recap, Prompt, Response } from '@components/lesson';

In this lesson we brief an agent and check what comes back.
```

A page that sets `title`, `mode` or another plan field in its own
frontmatter fails `mise run data`. A comment in the plan file is a defect:
put the fact in the field it belongs in, or in `notes`.

A lesson whose facts move (a law, a product) sets `review-by: 2027-03-20`,
the date by which its sources must be checked again, and
`sources-checked: 2026-09-20` for the day they were last checked. The page
then shows "Sources checked on September 20, 2026. Review due by March 20,
2027." above the lesson body. Set `review-by` six months after
`sources-checked`, the interval every lesson uses. `mise run data` rejects a
lesson that sets one of the two dates without the other, or a `review-by`
that isn't after `sources-checked`. Move both dates when you re-check the
sources, and leave them alone for a prose fix. Starlight's `lastUpdated` is
a separate field about the page, and the site doesn't set it.

## Course plan

The course file `site/src/data/areas/<area>/courses/<area>.yaml` orders the
area's lessons, either as a flat `lessons` list of ids or as `parts`, each
with a `title`, optional `notes` and its `lessons`. A lesson is **live** when
its page exists and **planned** otherwise, and the page's existence is the
whole record. The course
page renders the plan as the lesson graph: live lessons are the nodes, and
planned ones are dimmed "coming" nodes in their planned position. Progress
never counts a coming lesson. The topic map uses the plan too: a topic with
no lesson at all is a gap, and a topic with a planned lesson shows as
"lesson coming".

```yaml
id: safety
area: safety
plan-issue: 31
parts:
  - title: Responsible use
    lessons: [safety/responsible-use, safety/redact-before-you-paste]
  - title: Agent risk
    notes: The live tutorial teaches all five concepts; the two planned lessons deepen two of them.
    lessons: [safety/agent-risk, safety/sizing-the-blast-radius]
```

`after` in a lesson file places a coming lesson in the graph. A live lesson
takes its place from the `assumes` in its plan. When a lesson goes live,
add `description`, give every `assumes` entry its `lesson` and `section`,
and bring `serves`, `introduces`, `extends-to` and `sources` in line with
what the page does. Keep `after` as the plan had it (spec S11 step 3). The
graph ignores it once the lesson is live, but the lesson plan table still
shows it.

The course page also renders the plan as a table under the graph
(`site/src/components/CoursePlan.astro`), folded into a "Lesson plan"
`<details>` element, with a heading row per part. The title becomes a link
once the lesson is live, `covers` links to the topic page, each `serves` id
links to its heading on the competency page, `after` shows the titles of
those lessons and `issue` links to GitHub. `notes` never renders.

The sidebar lists each course's live lessons under its course page, nested
per part, from the same files (`site/astro.config.mjs`). A merged lesson
page appears there with no edit to the config.

`mise run data` (part of `mise run ci`) fails when a lesson page has no plan
file or sets a field that belongs in the plan, when a page cites a key its
plan's `sources` list lacks, when a plan's `covers`, `serves`,
`assumes`, `after`, `introduces` or `sources` id is unknown, when two
lessons introduce the same concept, when a course lists a lesson twice or
not at all, or when a live lesson lacks a `description` or an `assumes`
entry lacks its `lesson` and `section`. It warns when a concept of the
area's topics is introduced by no lesson. The collection schema rejects an
unknown key, and a misspelled field fails `mise run site-check`.

## Anatomy

One or more opener paragraphs, then H2 sections. Teaching prose is plain Markdown.
Components go between paragraphs and never inside list items or tables.
Each served objective gets at least one checkpoint with
`objective="<that id>"`, and each checkpoint names the one objective it
evidences. A lesson has one `<Pitfall>`, one `<Exercise>`, and one `<Recap>`
at the end. Tutorial mode: one or two paragraphs, then an example the
learner runs or predicts. Each example that runs gets a `<Predict>`, and
its output is asserted in CI either way. Give it an `objective` only when
predicting the output demonstrates a served objective. Otherwise leave
`objective` off, and the block is an ungraded example (below).

### Foundations lessons

A lesson in the `concepts`, `safety` or `using-agents` area is in the
`foundations` group and is written for a reader who doesn't program and
doesn't use a terminal (spec S03 "Foundations audience"). The hands-on
step is a widget on the page or a prompt the learner pastes into a chat
assistant. `mise run data` fails the page on a `<Predict run=...>`, on an
`sh`, `bash`, `shell`, `python` or `json` fence (or an alias of one,
`zsh`, `console` or `py`), and on the words `terminal`, `python3` and
`git clone` in prose. The report names the file, the line and what it
matched. A fixture may still back a claim as CI proof, as long as the page
never shows or names it. A code span such as `` `python3` `` and a `text`
fence pass, so prose may quote a command when the point is to recognize
it.

## Checkpoints

All checkpoints take `id` (stable slug, unique in the page; it becomes the
section id and the progress key), `objective`, `title`, `hint` (a
diagnostic question, never the answer), and `concepts` (the S02 concept
ids the checkpoint exercises, at least one, as an array). Children are the
stem, as Markdown.

A concept id is the `id` of a `concepts` entry in a topic YAML under
`site/src/data/areas/<area>/topics/`, the same id the glossary anchors use (`token`,
`blast-radius`), and it may come from any topic, not only the one the
lesson covers. The build fails on an unknown id.

`context` is optional: one paragraph of plain text (no Markdown, and none
of the quote character that delimits the prop value) that makes the item
readable outside its lesson. The lesson page doesn't show it, because the lesson is
the context there. The review page shows it above the stem, and the export
(below) includes it. Write one for every reviewed checkpoint (`review` not
`false`, and not a `Repair` or an honor-system `Predict`) whose stem or
hint refers to something on the page: "the widget", "the table above",
"the fixture", "the memo". Say what that thing is, without giving the
answer.

Across a course, aim for two interaction kinds per concept (a `Choice` and
a `Sort` on blast radius, say). A review then tests the idea rather than
one wording of it. This is guidance, and nothing checks it.

```mdx
<Choice id="what-the-model-does" objective="concepts/explains-models/explains-generation"
  concepts={['token', 'training-vs-inference']}
  context="The lesson has a widget that shows a model scoring five candidate tokens, picking one, and repeating."
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

```mdx
<MultiChoice id="which-criteria-tick" objective="..." title="Which of these can you tick?" hint="..."
  options={[
    { text: 'Every date in the memo appears in the summary.', correct: true },
    { text: 'The summary is clear.', why: 'Clear to whom? A feeling cannot be ticked.' },
    { text: 'No fact appears that is not in the memo.', correct: true },
  ]}>
Which of these lines are done-criteria you can tick?
</MultiChoice>
```

Same `options` as `Choice`, with two or more `correct` and at least one
wrong. The page tells the learner how many to select. A wrong pick shows
its `why`; a missed correct item is only counted ("1 of 2 so far"), never
named. Use `Choice` when one option is right.

**Writing distractors.** A learner who hasn't read the lesson must not
be able to pick the key from the look of the options. Write the options
at a similar length and level of detail, so the key isn't the one full
sentence among three fragments. Make every distractor a misconception a
real learner holds, with a `why` (or `consequence`) that names what it
gets wrong. Never write "all of the above" or "none of the above". If the
key hedges (`usually`, `often`, `may`, `might`, `depends`, `typically`,
`generally`, `sometimes`, `not always`, `in most cases`), give a
distractor a hedge too, or drop it. If the key repeats a word from the
stem, let a distractor repeat one as well. Vary the position of the key
across a lesson. `Choice` doesn't shuffle, and a learner notices when
every answer is the second option.

`mise run checkpoints` fails a `Choice`, `Scenario` or `MultiChoice` on
four cues, named in its output: `longest` (the key is more than 40
percent and at least 12 characters longer than the longest distractor,
counted without Markdown marks; for `MultiChoice` the mean length of the
keys against the mean of the distractors), `hedge` (a key hedges and no
distractor does), `echo` (a key shares a content word of four or more
letters with the stem and no distractor does) and `fixed-position`
(three or more `Choice` or `Scenario` items in one lesson with the key
at the same index). Fix a hit by tightening the key or making the
distractors as specific and as long. Moving the key or giving a
distractor its own hedge also works. When a rewrite would read worse,
add `guessable="<cue>: reason"` to the tag, naming the cue (or cues,
comma-separated) and a reason a reader of the check output accepts. An
example: `guessable="longest: the key is the rule in full"`. The check
prints every exemption, fails on a named cue that doesn't trip, and
fails on a cue that trips and isn't named, so remove the prop once the
item is fixed.

```mdx
<Match id="smallest-access" objective="..." title="What is the smallest access that still does the job?" hint="..."
  options={['Draft replies that wait in the outbox', 'A scratch copy of the folder', 'Reading only']}
  rows={[
    { statement: 'Reply to the emails in one folder', option: 0, why: 'Which access keeps the send step for you?' },
    { statement: 'Clean up the downloads folder', option: 1, why: 'Which access makes a wrong deletion cost only a copy?' },
  ]}
  rationale="The task is done just as well, and the blast radius shrinks.">
Match each task to the smallest access that still gets it done.
</Match>
```

Each row is a statement with a `<select>` of the `options`. `option` is
the index of the right one. After Check every row is marked right or wrong
and a wrong row shows its `why`. `rationale` shows once every row is
right. Options may be reused across rows, and an option that appears in no
row's answer is wrong for every row.

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
and fails if its stdout isn't `answer`. The file holds the complete,
runnable program, and the page shows only the part the learner needs. Every
fixture is a Python script (`.py`, run with `python3`), and the runner
rejects any other file type. A fixture that needs to run a command or copy
a file does it with `subprocess` and `shutil`. Omit `run` only for the
honor-system variant (predict what an agent does), and then say in the stem
that the learner checks it themselves.

````mdx
<Predict id="run-list" title="Show the list"
  answer={`1. [ ] Buy milk
  2. [x] Call the plumber
  3. [ ] Water the plants`} run="coding-with-agents/first-session/list.py">
Run this, and compare what you see with the output below.

```sh
python3 todo.py list
```

</Predict>
````

Without `objective`, a `Predict` is an ungraded example (S03 "Examples"):
the page shows the command and its output, CI still runs the fixture, and
the block isn't a checkpoint. It has no controls and no progress record,
and the review pages, the sidebar due count, and the export skip it. `answer`
and `run` are required, and `hint`, `concepts` and `context` are rejected. Use it for
a command the learner runs to gather evidence when guessing the output
would test something the lesson doesn't serve (reading Python in a lesson
about running an agent). An ungraded example can be the canonical example
for the learner's reference like any other `Predict`.

**The Python floor is 3.9.** The fixture is what the learner runs on their
own machine, and the `Predict` answer must match there. A stock Mac's
`python3` is 3.9, and a fixture that needs anything newer breaks the lesson
there. `.mise.toml` pins both the current Python and the 3.9 floor
(`python = ["3.14.7", "3.9.25"]`), each locked in `mise.lock`. The
`examples` task runs every fixture twice, on `python3` (the current pin)
and on `python3.9`, and asserts the same stdout for both. Fixtures use the
standard library only. A lesson never asks the learner to `pip install`.

A Python fixture is also code a learner copies, so `mise run py-lint` and
`mise run py-typecheck` check it: ruff (check and format) at the Python 3.9
target, and basedpyright at `standard` as Python 3.9. ruff rejects syntax
newer than 3.9 (a `match` statement, an `except` clause without brackets
around its types) as a syntax error. Runtime-evaluated `X | Y` unions pass
ruff and fail when 3.9 imports the module, which is what the `python3.9`
run in `mise run examples` catches. Run `mise run py-format` before
committing. The config is `site/examples/ruff.toml` and
`site/examples/pyrightconfig.json`. pytest skips the fixture's own tests,
so `mise run examples` stays the check on what the lesson shows.

```mdx
<Order id="order-the-loop" objective="..." title="Order the loop" hint="..."
  steps={['Send the messages to the model', 'Check for a final answer', 'Run the tool', 'Append the result']} />
```

`steps` is the correct order, and the page shuffles it.

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

Each option has a `consequence`, including the correct one.

```mdx
<Repair id="fix-the-brief" objective="..." title="Fix the brief" hint="..."
  broken={`Update the pricing.`}
  model={`Update the pricing table in docs/pricing.md from prices.xlsx. Do not change any other file. Done when every row of the sheet appears once and the totals match.`}>
This brief will send the agent off track. Rewrite it so it states goal, context, limits and done-criteria.
</Repair>
```

`Repair` reveals the model answer on request and then asks the learner to
self-grade (pass, partial, retry). Only pass counts. Not reviewed later.

### The checkpoint export

`mise run site-build` writes every checkpoint of every lesson to
`site/dist/data/checkpoints.json` (served as
`/ai-training/data/checkpoints.json`), generated by
`site/src/pages/data/checkpoints.json.ts` from the same MDX tree the
review page uses (`site/src/lib/checkpoint-tags.ts`). A `{...}` prop must be
a literal (a string, number, boolean, array or object, or a template
literal without placeholders), because the reader takes the value from the
parsed tree without running it, and a numeric or boolean prop is written
as one (`revision={2}`, not `revision="2"`). The MDX compiler removes up to
two spaces from the start of every continuation line of a multi-line
template literal, whatever the tag's own indentation, and the export carries
what the page shows. So write every continuation line of a multi-line
`answer` literal with a two-space margin, and paste the fixture's own
indentation after it: a fixture line that starts with two spaces and
`def f():` is written with four spaces and `def f():`. `mise run examples` compares what remains after the margin
with the fixture output, and fails when an indented line was pasted at
column 0. Each item has `id`, `lesson`, `kind`, `objective`,
`concepts`, `context`, `stem`, `options`, `answer`, `hint`, `reviewable`,
`revision` and `guessable`. S03 "Checkpoint export" gives the form of
`options` and `answer` per kind. `mise run checkpoints` (part of
`mise run ci`, after the build) reads the file back and fails when a page
checkpoint is missing from it, an item has no page, a field is missing, a
concept id isn't in the topic YAML, or a choice item trips a guessability cue
("Writing distractors" above). The browser doesn't read the file yet. An author does
nothing for it beyond the props above.

## Other components

Every prop of every component in a lesson body is a literal (a string, a number, a boolean, an array or an object of those), because the build reads the props from the MDX tree without running the page.

```mdx
<Pitfall title="Asking the model why">
Setup, what went wrong, the rule. Two to five sentences.
</Pitfall>

<Exercise stretch="Now ask for a refactor you choose and review it the same way.">
What to do, outside the page, in a resettable setting, and how big the result is. One sentence on why. Then what a good result looks like, so the learner can self-grade, and one reflection question to close.
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

<Habit id="name-the-blast-radius">
The next time you hand an agent a task, say out loud what it can reach before you press enter.
</Habit>
```

`Recap` appends "You can now..." from the served objectives and the finish
button. Don't write those by hand. Where to go next is the page footer's
previous/next, which follows the sidebar order. `extends-to` only feeds the
"You are ahead" card. An `extends-to` href may also be an `https://` URL
that starts with the `url` of a bibliography entry, for example a Claude
Academy course, and the card renders it as a plain link marked "(external
link)". `covered-by` names one external course that covers each objective
the lesson serves, and the page then shows a tip next to the menu, "If you
have followed <label>, you can skip this lesson", with a skip button that
does what the recap's does. Set it only when the whole lesson is covered,
and use an `https://` URL under a bibliography `url`, as for `extends-to`.
Sources are listed on the topic page, from the topic YAML, not on
the lesson.

Widgets are their own components under `site/src/components/widgets/` and
are imported by name. They teach and never grade.

`Habit` (spec S07) goes after `Recap`. Zero, one or two per lesson, each
with a kebab-case `id` that is unique in the lesson, doesn't match a section
slug, and never changes once published. The text is one or two sentences in
the imperative that name a moment in the learner's own work, not a task to
do in the lesson. The site brings the habit back 1, 3 and 7 days after the
lesson is finished, so write something that recurs at work within a week.
The component is specified in S07 and has no implementation yet, so leave
habits out of a lesson until it does.

## Citations and terms

Both are remark plugins in `site/plugins/`, wired in `site/astro.config.mjs`.
Neither needs an import in the page.

**Citations.** Write `(@key)` in prose, where `key` is an entry in
`site/src/data/bibliography.yaml` (`AEC-02`, `DLAI-11`, `Brilliant VER`,
`Learn Prompting`). It renders as a numbered reference, `[1]`, `[2]`, in
order of first appearance, and the page gets a `## References` section
appended after the page content with one entry per cited key. An unknown
key fails the build with the file name and the key, and so does a citation
inside a heading or a link. Citations work inside components too (a
`Recap` takeaway, a checkpoint stem), and the reference link is
page-absolute so it still resolves where a review page clones the
checkpoint. Cite the way S03 asks: concept definitions, recaps, and
behaviors cite papers and vendor documentation by key, never as a bare
inline URL.

```mdx
The model never runs anything. Your loop does (@AEC-13).
```

A bibliography entry has `type` (`book`, `course`, `paper`, `reference` or
`video`, per S01), `title`, `container`, `author`, `license` and `url`. `url` is a
public URL only where the licensing rules in `AGENTS.md` allow linking the
source; otherwise `null`. A `paper` entry follows the key, author,
container and url rules in S03 "Citations and terms". Add a new entry to
the YAML and to the source table in S02 together.

**Terms.** Terms have no syntax. In a lesson, the first mention of a concept
from one of the topics in `covers` is marked automatically: it links to
`/glossary/#<concept-id>` with the glossary definition as its hover text.
Matching is on the concept `name` from the topic YAML, case-insensitive,
whole phrase, with an optional plural `s` or `es`, so `tokens` matches the
concept `Token`. Headings, links, code spans, and the inside of components
(checkpoint stems, `Prompt`, `Response`) are never marked, so a hover text
can't give a checkpoint's answer away, and later mentions stay plain text.
If the first mention is in bold, it stays bold and becomes a term as well.
To make a concept a term, use its exact name at its first mention. To keep
a word plain, don't `cover` the topic it belongs to. A hand-written link
to `/glossary/#<id>` must name a real concept id, or the build fails.

## Rules that bite

- **Voice.** The "Voice" list in `AGENTS.md` is the house's answer to
  agent prose: no figurative verbs on inanimate subjects, no tacked-on
  semicolon clause, no count-then-list, no rule of three, no clipped
  motto, no "not X but Y", no sentence-initial transition word.
  `mise run prose` reports every hit, and a lesson should read clean before
  it is committed. In a fresh worktree run `mise run prose-sync` first,
  because without the packages `prose` stops and names that task.

- **Foundations audience.** In `concepts`, `safety` and `using-agents`,
  `mise run data` fails on a `<Predict run=`, an `sh`, `bash`, `shell`,
  `python` or `json` fence, or the words `terminal`, `python3` or
  `git clone` outside a code span. The exemption list in
  `site/scripts/lib/data.mjs` is for the lessons written before the rule
  and only shrinks. See "Foundations lessons" above.

- Component children are Markdown but must be separated from the tags by a
  blank line if they contain block elements (code fences, lists).

- Backticks inside a prop string: use a template literal, as `Repair` does.

- Never a literal `</script>` or `</pre>` in any string.

- Links are root-relative (`/using-agents/`); the build fails on a dead
  internal link, so link only to pages that exist, or use `extends-to`.

- No company names, internal URLs, or text adapted from NC-licensed sources.
  See the licensing rules in `AGENTS.md`.
