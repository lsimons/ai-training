# Google.Passive

## Rule

`.vale/styles/Google/Passive.yml` extends `existence`, ships at `level: suggestion`, and links to `https://developers.google.com/style/voice`. It
matches a be-verb (`raw: \b(am|are|were|being|is|been|was|be)\b\s*`) followed
by a past participle from its `tokens` list: 175 irregular participles
(`awoken`, `beat`, ... `wrung`) plus one regex, `[\w]+ed`, for regular
participles — 176 token entries total. `ignorecase: true`. The message
template is "In general, use active voice instead of passive voice ('%s')."

## Stats

Total hits: 247.

| area       | hits | words | hits/1000 words |
| ---------- | ---- | ----- | --------------- |
| repo-docs  | 34   | 3489  | 9.74            |
| plan       | 83   | 15884 | 5.23            |
| spec       | 75   | 13184 | 5.69            |
| lessons    | 50   | 12227 | 4.09            |
| agent-docs | 5    | 2707  | 1.85            |
| data       | 0    | 18534 | 0.00            |

Top matched phrases (lowercase):

| phrase      | count |
| ----------- | ----- |
| be adapted  | 8     |
| is built    | 6     |
| is recorded | 6     |
| is stored   | 6     |
| is written  | 5     |
| are written | 5     |
| is done     | 5     |
| is marked   | 4     |
| is finished | 4     |
| are used    | 3     |
| is allowed  | 3     |
| are pinned  | 3     |
| be copied   | 3     |
| be checked  | 3     |
| be verified | 3     |

Distinct phrases: 168.

## Examples

- `docs/agents/issue-tracker.md:29` (agent-docs) — "GitHub's default labels
  (`duplicate`, `good first issue`, `help wanted`, `invalid`, `question`,
  `accessibility`) also exist and may be used." (previous line: "Labels
  beyond the triage set:")
- `site/src/content/docs/coding-with-agents/first-session.mdx:146` (lessons)
  — "the failing test, what the agent may and may not change, and how you
  will know it is done." (next line: `</Repair>`)
- `docs/plan/explore/09-brilliant-skills-map.md:65` (plan; top phrase "is
  built") — "- **SPC Specification & Design.** Framing the problem and
  defining success, including how it will be verified, before anything is
  built." (next line: "- SPC-1 Design how users will interact with the
  artifact")
- `docs/spec/S01-dictionary.md:21` (spec; top phrase "is stored") — "one
  definition and a list of words not to use in its place. Rules about how
  pages are written, how data is stored and what ships when live in later
  specs." (this line also carries the top phrase "are written")
- `README.md:10` (repo-docs; top phrase "is written") — "The basic material
  (AI concepts, AI safety, using AI agents) is written for anyone doing
  knowledge work. The rest is written for software engineers." (this line
  carries "is written" twice)
- `docs/plan/README.md:27` (top phrase "be adapted") — "`lsimons-template-doc`).
  An earlier same-day choice of CC BY-NC-SA, made so CS50 text could be
  adapted, was reversed: the CC-licensed CS50 material" (next line: "barely
  overlaps the six areas, the NC term makes corporate internal training")
- `docs/spec/000-specs.md:6` (top phrase "is recorded") — "Specs are the
  durable design record of the site: what it contains, what it teaches, how
  lessons are written, how learning is recorded and reviewed, and" (next
  line: "what ships. Each spec reads on its own.")
- `docs/spec/S02-topic-map.md:117` (random pick, from the table rows) — "|
  `Learn Prompting` | The community prompt engineering guide | CC BY-NC-SA
  4.0 (current) | Vocabulary only; prompting concepts are written from the
  original papers |"
- `site/src/content/docs/safety/agent-risk.mdx:265` (random pick) — "for this
  task, and give it back only when the next task needs it. 3. **Human in the
  loop.** Of what is left, which actions are irreversible" (next line: "or
  reach other people? Those get an approval step. The rest, the agent")
- `CONTRIBUTING.md:19` (random pick) — "This site is built with [Astro
  Starlight](https://starlight.astro.build/)." (previous line blank)
- `docs/spec/S01-dictionary.md:141` — "Topics and concepts are the nodes and
  edges of the **topic map**; they say what is taught. Competencies,
  learning objectives and behaviors say what a" (next line: "learner can do
  afterwards; they sit beside the map and point into it.")
- `docs/plan/README.md:47` — "| `ai-deep-learning` | DeepLearning.AI, paid |
  Inspiration for topic coverage and sequencing only. Embed nothing. | |
  Learn Prompting | CC BY 4.0 (to 2023-02-15), then CC BY-NC-SA 4.0 |
  Vocabulary and authoring patterns only; no text adapted from either
  license period. Prompting concepts are written from the papers."
- `AGENTS.md:113` — "dispatch only while the repo is private. CI does not
  run Quarto; slide outputs are committed." (previous line ends "slide")

## Concentration

Top five files by hit count:

| file                                         | hits |
| -------------------------------------------- | ---- |
| docs/plan/explore/09-brilliant-skills-map.md | 23   |
| docs/spec/S01-dictionary.md                  | 15   |
| docs/spec/S02-topic-map.md                   | 15   |
| docs/spec/S03-lesson-authoring.md            | 13   |
| docs/spec/000-specs.md                       | 12   |

In `docs/spec/S02-topic-map.md`, 7 of 15 hits fall on table rows (lines
112, 117, 296, 357, 398, 420, 472), 1 on a numbered-list line (527), 2 on a
heading/bold-lead-in line (13, 33), and the remaining 4 in running prose (33
dup, 49, 460, 502). In `docs/plan/explore/09-brilliant-skills-map.md`, most
hits sit on bulleted list lines (`- SPC-`, `- INC-`, `- SEC-`, `- MEM-`
prefixes) rather than running prose, with 3 on table rows (32, 178, 180).
`docs/spec/S01-dictionary.md` and `docs/spec/000-specs.md` hits are mostly
in running prose, one to a sentence.

## Stats: Google.Passive vs write-good.Passive

write-good.Passive alerts in the same JSON: 247 total, matching the
Google.Passive count exactly.

Comparing by `(file, line)` pairs (each rule fires once or more per line;
counting distinct file+line pairs, not raw hit counts):

- Distinct `Google.Passive` file+line pairs: 233 (247 hits, so 14 lines
  carry more than one Google.Passive hit).
- Distinct `write-good.Passive` file+line pairs: 233 (247 hits, so 14 lines
  carry more than one write-good.Passive hit).
- Pairs shared between the two rules (same file, same line): 233.
- `Google.Passive`-only pairs (no write-good.Passive hit on that line): 0.
- `write-good.Passive`-only pairs (no Google.Passive hit on that line): 0.

Every file+line that either rule flags, the other flags too, and on every
shared line the two rules report the same number of hits (checked
pairwise: 0 lines differ).
