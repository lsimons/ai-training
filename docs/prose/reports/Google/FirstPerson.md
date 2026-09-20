# Google.FirstPerson

## Rule

`.vale/styles/Google/FirstPerson.yml` is an `existence` check at `warning`
level. It flags first-person pronouns with five tokens: `(?<=^|\s)I(?=[\s,])`
(lookaround, not consuming surrounding whitespace, per the comment
referencing PR #50), `\bI'm\b`, `\bme\b`, `\bmy\b`, and `\bmine\b` —
five patterns, `ignorecase: true`. The message is `Avoid first-person pronouns such as '%s'.`, linking to
`https://developers.google.com/style/pronouns#personal-pronouns`.

## Stats

Total hits: 42.

| area       | hits | words | hits/1000 words |
| ---------- | ---- | ----- | --------------- |
| lessons    | 18   | 12227 | 1.47            |
| plan       | 18   | 15884 | 1.13            |
| agent-docs | 3    | 2707  | 1.11            |
| spec       | 3    | 13184 | 0.23            |
| repo-docs  | 0    | 3489  | 0.00            |
| data       | 0    | 18534 | 0.00            |

Top matched phrases (lowercase):

| phrase | count |
| ------ | ----- |
| me     | 17    |
| i      | 15    |
| my     | 10    |

Distinct phrases: 3.

## Examples

- `.claude/skills/tutor/SKILL.md:43` — table row: `| quiz me        | Ask one question per served objective, one at a time; hints on a miss, never answers |` (row above: `why it matters`; row below: `test me`).
- `docs/plan/explore/03-cs50-pedagogy.md:84` — quoted material: `quotes: "like having a personal tutor", "gave me enough hints to try on my own", "inhuman level of patience".` (line above: `0.89 to 0.28 per student; office-hours attendance from 51% to 30%. Student`; the quote
  runs to the end of the sentence on the same line).
- `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md:225` — running
  prose with quoted phrases: `04. Scope the interaction: "explain this", "check my answer", "am I on` (line above: `register and scope, no embedding infrastructure needed.`; sentence continues on line 226:
  `track?" beat an open chat.`).
- `docs/spec/S01-dictionary.md:222` — table cell: `| *explain like I am five* | Re-explains with an everyday analogy                          |`
  (row above: `key points`; row below: `why it matters`).
- `docs/spec/S01-dictionary.md:224` — table cell: `| *quiz me*                | Asks the node's checkpoints, one at a time                             |`
  (row above: `why it matters`; row below: `test me`).
- `docs/plan/explore/11-roadmap-sh.md:142` — heading: `### Test my Knowledge` (line above and below are blank).
- `docs/plan/explore/11-roadmap-sh.md:138` — running prose: `in about ten seconds. The Explain button is a menu: Explain the topic, / List the key points, Summarize the topic, Explain like I am five, Why is / it important.` (quoted line 138 itself: `List the key points, Summarize the topic, Explain like I am five, Why is`).
- `docs/plan/explore/11-roadmap-sh.md:202` — running list of terms:
  `premium), Learning / Done / Skip, Personalize, Projects, AI Tutor, Quick Explain, Teach Me, Quiz me, Test my Knowledge, Roadmap Chat, course, module,` (line above: enumerated feature list continues; line below:
  `lesson, guide, plan, quiz (multi-choice, open-ended, mixed), Lesson Pack,`).
- `site/src/content/docs/coding-with-agents/first-session.mdx:166` —
  quoted transcript inside a `<Response>` example block: `I would like to edit \`todo.py\` (1 line). Allow?`(line above is blank; line below is`</Response>\`).
- `site/src/content/docs/safety/agent-risk.mdx:77` — running prose: `"it will reply to a few emails" but "it can send mail as me to anyone". Not`
  (line above: `to say the blast radius out loud before you start. Not`;
  line below: `"it will tidy downloads" but "it can delete anything in my home folder".`).
- `site/src/content/docs/safety/agent-risk.mdx:90` — running prose,
  rhetorical question: `**Would I be embarrassed to explain it?** If you would struggle to say` (line above is blank; line below: `"yes, I let it do that without looking", it needs a look.`).
- `site/src/content/docs/safety/agent-risk.mdx:279` — inside a `<Prompt>`
  example block: `Go through this week's scheduling emails and reply to each one proposing a` (continues on the same logical sentence to)
  `slot from my calendar.` (line above is blank/block start; line below
  is `</Prompt>`).
- `site/src/content/docs/using-agents/delegating.mdx:94` — inside a
  `<Prompt>` example block, running prose: `bullets covering what is happening, what I must do, and by when; one closing` (line above:
  `Summarize the memo below into this exact format: a one-line title; three`; line below: `line naming who to ask.`).
- `site/src/content/docs/using-agents/delegating.mdx:165` — running prose:
  `the degree. For example, "Draft the summary, then stop and show it to me before doing anything else." Notice that the agent behaves differently even` (line above: `Try it: rerun the task, but this time add one line to the brief that sets`; line below continues the sentence: `though the task is unchanged. The second version names a delegate — the agent`).
- Random pick (1 of 3, from `docs/prose/README.md:52`) — table cell:
  `| write-good  | Weasel |  Every run | Low volume; a hit asks "do I know the number?", and about a quarter deserve the rewrite |` (row above:
  Cliches; row below: ThereIs).
- Random pick (2 of 3, from `docs/plan/explore/12-learn-prompting.md:82`) —
  quoted material: `("To my knowledge, this solution has not been explored in the literature").` (line above: `The CC BY branch is human-written, terse, and honest about uncertainty`; line below: `It reads like good lecture notes: one idea, one figure from the paper, one`).
- Random pick (3 of 3, from
  `docs/plan/explore/08-diataxis.md:20`) — table row: `| Tutorial     | action, study    | "Can you teach me to…?" | a lesson: the learner does something |` (row above is the table header separator; row below:
  `How-to guide`).

## Concentration

Top five files by hit count:

- `site/src/content/docs/safety/agent-risk.mdx` — 15
- `docs/plan/explore/11-roadmap-sh.md` — 12
- `docs/spec/S01-dictionary.md` — 3
- `.claude/skills/tutor/SKILL.md` — 2 (tied with the next two)
- `docs/plan/explore/03-cs50-pedagogy.md` — 2 (tied; also
  `docs/plan/explore/07-scorm-interactions-and-duck-tutor.md` and
  `site/src/content/docs/using-agents/delegating.mdx`, each 2)

These six files carry 36 of the 42 hits; the remaining six files each have 1.

Clustering by context, across all 42 alerts:

- Table cells or table rows: `S01-dictionary.md` (3), `SKILL.md` (2),
  `08-diataxis.md` (1), `prose/README.md` (1) — 7 hits.
- Headings (`### Test my Knowledge`, `### Quiz me`, `### Teach Me`):
  `11-roadmap-sh.md` lines 142, 149, 159 — 3 hits.
- Quoted material embedded in running prose (survey quotes, example
  learner prompts, style-guide callouts): `03-cs50-pedagogy.md` (2),
  `07-scorm-interactions-and-duck-tutor.md` (2), `12-learn-prompting.md`
  (1), `agent-risk.mdx:77-78` (2) — 7 hits.
- `<Prompt>`/`<Response>` example blocks: `agent-risk.mdx:279`,
  `first-session.mdx:166`, `delegating.mdx:94` — 3 hits.
- Running prose lists of UI/feature terms (not in a table):
  `11-roadmap-sh.md` lines 116, 171, 202, 226 — 8 hits.
- Running prose, direct or rhetorical address to the reader:
  `agent-risk.mdx` lines 71, 90, 95, 138, 139, 153, 156, 158, 182, 183, 216
  (11 hits) and `delegating.mdx:165` (1 hit) — 12 hits.

The heaviest concentration is running prose in `agent-risk.mdx`, where the
lesson repeatedly uses first-person phrasing rhetorically ("it can send
mail as me", "Would I be embarrassed") to voice the reader's perspective on
agent risk, plus its own `<Prompt>` example. The second cluster,
`11-roadmap-sh.md`, is largely product/UI terminology ("Quiz me", "Teach
Me", "Test my Knowledge") that names first-person-phrased feature labels
rather than the document's own authorial voice.
