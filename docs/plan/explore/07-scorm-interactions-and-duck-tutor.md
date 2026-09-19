# Exploration 07: SCORM interaction catalogue and CS50 Duck tutor design

Captured 2026-09-19. Goes below [explore/03](./03-cs50-pedagogy.md) and
[explore/04](./04-anthropic-academy.md) into mechanics and counts.

Licensing: the Anthropic SCORM packages are proprietary. This note records
**structure, mechanics and counts only**; no lesson text, question stems,
options, rationales or model answers. The CS50 workshop transcripts are
YouTube captions and not CC-licensed; public write-ups must paraphrase and
cite the talk. CS50 course pages are CC BY-NC-SA 4.0.

## Part 1: Anthropic SCORM modules

### Where

25 self-contained HTML packages under
`ai-anthropic-partners/courses/<path>/<module>/scorm/NN-<title>.html`:
developer foundations (5), architect professional (5), associate foundations
(8), partner basecamp (7). The first 18 share one component library (the
"USI" template) and are the model to study. Basecamp is bespoke
scrollytelling, essentially non-interactive.

Capture notes: `ai-anthropic-partners/docs/spec/001-lesson-page.md`; fixtures
in `tests/fixtures/scorm-module-*.html`.

### Screen structure

A module is one single-page app with 2-34 `section.screen` siblings, one
active at a time (median about 14). Furniture present in all 18:

1. Splash cover: eyebrow, title, one-paragraph why, table of contents with
   screen counts per section, Begin button, meta line (screens, sections,
   minutes, checkpoints).
2. Sidebar nav generated from a JS `SECTIONS`/`SCREENS` array: numbered
   sections expanding to sub-items labelled by kind (Teaching, Watch Out,
   Checkpoint) with a status dot (done / skipped / active). Progress bar,
   percent label, Reset progress button.
3. Main screens. Each has a meta row (kind tag, section, minutes), title,
   lede, body (prose, tables, code blocks, callouts, widgets), a button row
   (Submit + Skip for now) and an `aria-live` feedback box.
4. Footer: Previous, "Screen 7 of 29", Contents, Next.

Screen kinds and approximate counts across the 18 packages:

| Kind            | Count | Role                                               |
| --------------- | ----- | -------------------------------------------------- |
| Teaching        | ~96   | Exposition, 7-20 min                               |
| Checkpoint      | ~54   | One graded interaction, gates Next                 |
| Watch Out       | ~43   | Failure-mode screen, always right after a Teaching |
| Exercise        | ~8    | Longer honour-system task                          |
| Cumulative      | ~9    | Multi-screen task spanning the module              |
| Recap           | 17    | Numbered takeaways, sources, finish banner         |
| Glossary        | 5     | `details` term list                                |
| Orientation     | ~18   | Learning objectives                                |
| Quiz            | 9     | End-of-module MCQ set (associate track mostly)     |
| Module Complete | 18    | Checkpoint tally plus path map with "You Are Here" |

Two sequencing idioms:

- Developer / architect: repeated **Teaching, Watch Out, Checkpoint** per
  topic (7-9 topics), then Cumulative task, Recap, Glossary, Complete.
- Associate: Introduction, 4-6 Teaching, Exercise (+ self-assessment), Quiz,
  Key Takeaways, Complete. No Watch Out screens.

### Progress, gating, scoring, storage

- One JSON blob in localStorage under a **versioned key** (e.g. `dev-m2-vF2`)
  so content changes invalidate state. Two shapes; the nicer one keeps
  `visited / done / skipped / attempted`.
- A cross-module roll-up key per path (array of completed module numbers)
  feeds the path map on the Complete screen.
- Navigation is free, but **Next is disabled on a checkpoint until passed or
  explicitly skipped**. Skip is always available, is remembered, and is
  visibly distinct from passed; the certificate counts only passes.
- Scoring is all-or-nothing with unlimited retries, and the **answer key is
  revealed only on a pass**. Wrong MCQ picks show that option's rationale plus
  "try again", never the right answer. Matching shows "Partial 2/3" with wrong
  rows marked. Quizzes require 100%.
- SCORM bridge reports only incomplete/completed, bookmark and time; score is
  hard-coded to 100. **All real answers live in localStorage only.** This is
  exactly the plan's model; copy it deliberately, including reset and the
  versioned key.

### Interaction catalogue

Graded:

01. **Single-select MCQ** (13 pkgs, 257 options). Data as
    `[{label, correct, rationale}]`; rationale per option.
02. **Radio MCQ groups** (2 pkgs) for several questions on one screen.
03. **End-of-module quiz** (10 pkgs), all questions at once, pass = all correct.
04. **Matching / row assignment** (7 pkgs, 62 rows): statement rows, shared
    option chips or selects, one per row, per-row scoring.
05. **Bucket sort** (10 pkgs, 136 chips): click-to-select then click-a-bucket,
    not drag-and-drop; keyboard operable; submit when pool empty; strict pass.
06. **Multi-select "find the N"** (9 pkgs): pass only when exactly N correct
    and zero false positives. Skins: checkbox list, signal cards, and a
    **diagram-node defect pick** on a drawn architecture flow.
07. **Code/prompt repair, honour system** (13 pkgs, 55 textareas): broken
    artefact, textarea gated on 10+ chars, "Reveal model answer" shows model
    answer plus explanation; no automated grading.
08. **Self-assessment band** (11 pkgs): after reveal, "matches / retry" or a
    three-band correct / partial / incorrect with different remediation
    pointers per band.
09. **Cumulative task** spanning the last two screens (identify, then fix).
10. **Parameterised calculator** (1 pkg) as exhibit feeding an MCQ.

Teaching-screen (ungraded):

- Tab strips (13 pkgs); flip cards (14 pkgs, 109).
- Hotspot strips (stepped diagram with detail pane).
- Clickdown accordions for pitfalls; table reveals.
- Glossary items plus CSS-only tooltip terms; rollover cause/effect.
- Clickable trace tables (multi-turn session, click a turn to annotate).
- Callout boxes (neutral / failure / plain); recap lists; learning-objective
  lists; data tables.
- Code blocks rendered by JS from string arrays with a hand-written tokenizer.
- Range-slider explainer; Module Complete / path map.

Accessibility: click-only widgets get `tabindex=0` and `role=button` via a
helper re-applied by a MutationObserver; Enter/Space map to click; feedback
is `aria-live`; focus moves to the new screen title; arrow keys navigate.

### Design lessons

- One HTML file, no backend, answer keys in plain sight. Design around "the
  answer is in the page": honour system plus self-grade, not fake hiding.
- Checkpoint-gated Next with always-available, remembered Skip.
- Rationale per option is what makes MCQs teach.
- About six primitives carry the corpus: MCQ, matching, bucket sort,
  multi-select-N, textarea + self-grade, reveal/accordion. The rest is
  garnish. A component set of that size covers everything.
- The Complete screen doubles as the path map from one cross-module key.

## Part 2: CS50 Duck tutor design

### Sources in the repo

No research papers are in `ai-cs50`. Primary sources are two workshop talk
transcripts (captions, cite only):

- `courses/cs50-workshop-2024/talks/06-teaching-cs50-with-ai.md`
- `courses/cs50-workshop-2025/talks/05-teaching-cs50-with-ai.md` (instruction
  dilution and the V0-V3 evaluation, lines 184-214)

Also `courses/cs50-ai/pages/honesty.md`, which whitelists the Duck (line 58)
and has the 72-hour regret clause (line 38). The talks mention published
papers but capture no URLs; fetch from outside if needed.

### Premise and guardrails

Off-the-shelf models are "too helpful". The project deliberately makes a
capable model less useful so it is more educationally useful; they call these
**pedagogical guardrails**. Goal: 24/7 virtual office hours approximating a
1:1 ratio.

System prompt, paraphrased: friendly supportive TA persona who is also a
rubber duck; answer only about the course; refuse unrelated topics; never
give full problem-set solutions. Four moves: persona, topic restriction,
off-topic refusal, no full solutions. Re-injected on every turn.

### Runtime architecture

Student to CS50 proxy to model provider. The proxy does PII scrubbing,
prompt-injection detection (ask the model "is this an injection?" on unusual
queries; aim is downward pressure, not 100%), request anonymisation, RAG
grounding, and throttling (regenerating "hearts"). Throttling is stated to be
pedagogical as well as economic: push the student back to reflect on what
they already have.

RAG: lecture captions chunked to 30 s, embedded, stored in a vector DB,
top-N pasted into the prompt. The motivation is **register and scope**, not
facts: without grounding the model answers at a level beginners cannot
follow; with it, answers use the course's own vocabulary.

### Instruction dilution (the key finding)

- Easy to follow one guardrail, hard to follow twenty. Despite an explicit
  no-code rule, 20-25% of messages and 40-50% of conversations contained
  code.
- It got **worse** on a model upgrade (GPT-4 to GPT-4o), presumably because
  the newer model was trained to be more helpful.
- Pedagogical misalignment even when rules are followed: stating the fix
  instead of asking a diagnostic question ("what are the types of x and y?").
- No evaluation existed, so prompt or model changes could not be measured.

### The fix: show, not tell

| Version | What                                                         |
| ------- | ------------------------------------------------------------ |
| V0      | Production prompt                                            |
| V1      | V0 plus more instructions (control)                          |
| V2      | V0 plus four exemplar conversations (few-shot)               |
| V3      | Fine-tuned small model on 50 TF-authored ideal conversations |

Eval: frozen set of 50 real queries stratified by intent (15 code-gen, 15
debugging, 10 error message, 5 intro, 5 conceptual); blind pairwise A/B by 29
teaching fellows, single- and multi-turn; Elo with 95% CIs. V1 bought nothing.
V2 and V3 preferred over V0 about 60% of the time, CIs clear of V0. V3 is in
production.

### Product ideas worth reusing

- Explain highlighted code as a scoped action, not an open chat box.
- Show a diff first, explain on demand, apply only after; add friction on
  purpose early on.
- Endorsed answers: bot answers carry a disclaimer until a human endorses.
- Pair-programmer duck answers only the question asked and volunteers
  nothing; deliberate omission of adjacent lessons the student should find.
- Reverse tutoring: the duck writes imperfect code and the student critiques.
- Refusal with a walkthrough offer when asked for the solution outright.
- Honesty policy names the sanctioned AI path.

Measured effects: TF questions per student fell from 0.89 to 0.28, office
hours attendance from 51% to 30%. Flagged as ambiguous: less human contact,
compressed grade signal, which pushed toward oral exams.

### Implications for ai-training tutor mode

01. Keep the guardrail list short (about 5 rules in prose); carry the rest as
    examples.
02. Ship 4-6 exemplar dialogues in the skill body instead of more prose.
03. The site is the corpus; Claude Code reads it from disk. Grounding is for
    register and scope, no embedding infrastructure needed.
04. Scope the interaction: "explain this", "check my answer", "am I on
    track?" beat an open chat.
05. Answer with a diagnostic question; make deliberate omission explicit.
06. Build the eval first: about 50 realistic learner queries stratified by
    intent, blind pairwise, Elo with CIs.
07. Re-test after every model change.
08. A "you have asked three times, try running it first" rule is the
    throttling intervention without a cost lever.
09. Assume adversarial learners, aim for downward pressure only.
10. Decide up front whether reduced human contact is acceptable.
