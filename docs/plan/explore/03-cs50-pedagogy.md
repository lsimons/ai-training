# Exploration: CS50 AI course and CS50 educator workshops

Explored 2026-09-19 by a read-only agent. Source: `~/git/lsimons/ai-cs50`
(fetched copies of cs50.harvard.edu pages; only `courses/*/notes.md` is
hand-written and those are still empty).

## 1. CS50 AI course structure

Index: `courses/cs50-ai/README.md` (7 weeks, 52 pages, 2020 lectures 0-5 plus a
re-recorded 2023 lecture 6). Source <https://cs50.harvard.edu/ai/>.

| Wk  | Topic                                                                 | Projects             |
| --- | --------------------------------------------------------------------- | -------------------- |
| 0   | Search: DFS, BFS, greedy best-first, A\*, minimax, alpha-beta         | Degrees, Tic-Tac-Toe |
| 1   | Knowledge: propositional logic, inference, first-order logic          | Knights, Minesweeper |
| 2   | Uncertainty: probability, Bayesian networks, Markov models            | Heredity, PageRank   |
| 3   | Optimization: local search, linear programming, CSP                   | Crossword            |
| 4   | Learning: supervised, reinforcement, unsupervised                     | Nim, Shopping        |
| 5   | Neural Networks: gradient descent, CNNs, RNNs                         | Traffic              |
| 6   | Language: grammars, n-grams, word embeddings, attention, transformers | Attention, Parser    |

Per-week layout (`courses/cs50-ai/weeks/0-search/`): `week.md` (lecture page
with video, slides, source zip, captions), `notes.md` (CS50's lecture notes),
`transcript.md`, `quiz.md` (multiple choice, "optional but encouraged"),
`projects.md` plus `projects/<name>.md`. Project specs have a fixed heading
shape: **When to Do It / How to Get Help / Background / Getting Started /
Understanding / Specification / Hints / Testing / How to Submit /
Acknowledgments**. Recommended reading order: notes, transcript, quiz,
project spec.

## 2. CS50 pedagogy and vocabulary (educator workshops)

Sources: `courses/cs50-workshop-2025/talks/` (6 talks) and
`courses/cs50-workshop-2024/talks/` (8 talks). Most vocabulary-dense:
`2025/talks/06-cs50-s-curriculum.md`, `2024/talks/03-cs50-s-curriculum.md`,
`2024|2025/talks/04-cs50-s-tools-for-programming-submitting-and-grading.md`,
`2025/talks/02-teaching-cs50-practice-with-pedagogy.md`,
`2025/talks/03-managing-the-high-school-cs50-classroom.md`.

Dictionary seeds:

- **Course naming**: CS50 (flagship), CS50x (free open-courseware version),
  CS50 AP, CS50P, CS50AI, CS50SQL, CS50R, CS50W, CS50B, CS50 2D, CS50T. "Open
  courseware", "adopt and adapt".
- **Week content**: **lecture** (about 2h, clippable via the CS50 video
  player), **shorts** (short deep-dive videos on one topic), **sections**
  (about 1h, hands-on practice with a teaching fellow), **problem set / pset**
  (the programming assignment), **practice problems** (smaller, exit-ticket
  size), **lab**, **project** (final project), **specification** (what the code
  must do), **scaffolding**, **hints**, **walkthrough**, **lesson materials**,
  **grading guidelines**, CS50 Handbook, cs50.tf (teaching resources).
- **Comfort tracks**: **less comfortable / more comfortable** (and "in
  between"): three levels of instruction and, per week, alternative psets of
  different difficulty plus extra hints for the less comfortable.
- **Tools**: cs50.dev (VS Code in the cloud), **check50** (automated
  correctness tests), **style50** (formatting diff with an "Explain Changes"
  button), **design50** (qualitative design feedback), **submit50**,
  **compare50** (similarity), submit.cs50.io, the **CS50 duck** (ddb), cs50.ai.
- **Grading**: three axes, **correctness**, **style**, **design** (design scored
  1-5); completion credit as a lighter option. Academic honesty philosophy:
  "be reasonable" with a 72-hour regret clause. The honesty page explicitly
  permits using the CS50 Duck.
- **Roles and events**: preceptor, teaching fellow (TF), TA, office hours,
  CS50 Puzzle Day, hackathon, CS50 Fair.

## 3. AI tutor design principles (the duck)

Sources: `courses/cs50-workshop-2024/talks/06-teaching-cs50-with-ai.md`
(lines about 76-125 and 200-290) and
`courses/cs50-workshop-2025/talks/05-teaching-cs50-with-ai.md`.

- Origin: rubber duck debugging made conversational. System prompt
  (abbreviated, as quoted in the talks): "You are a friendly and supportive
  teaching assistant for CS50. You are also a rubber duck. Answer student
  questions only about CS50 in the field of computer science. Do not answer
  questions about unrelated topics. Do not provide full answers to problem
  sets as this would violate academic honesty."
- Guardrails: topic restriction, no full solutions, resistance to prompt
  injection, and **throttling** via regenerating hearts to stop question
  fishing and cap cost. Also "explain highlighted code" and "endorsed answers".
- Research findings: 300k+ students, about 21k prompts/day (2025). Survey:
  about 47% "very helpful", 26% "helpful". Questions asked of TFs fell from
  0.89 to 0.28 per student; office-hours attendance from 51% to 30%. Student
  quotes: "like having a personal tutor", "gave me enough hints to try on my
  own", "inhuman level of patience".
- Failure mode named **instruction dilution**: with about 20 guardrails in one
  prompt, 20-25% of messages (40-50% of conversations) still contained code
  blocks despite the rule. Fix: **show, not tell**. V2 used few-shot examples
  (4), V3 fine-tuned GPT-4o-mini on 50 TF-authored conversations. Blind A/B
  evaluation by 29 teaching fellows on 50 real student queries, scored with
  Elo; V2/V3 preferred over V0 about 60% of the time. V3 is in production.

## 4. License

Confirmed from `courses/cs50-ai/pages/license.md` and the workshop license
pages: **CC BY-NC-SA 4.0**. Free to share and adapt with attribution (Harvard
CS50, David J. Malan, Brian Yu), a link to the license and a note of changes;
**non-commercial only**; derivatives must carry the same license.

Implication for this project: CS50 material cannot be copied into a CC BY or
CC BY-SA work. Ideas, structure and pedagogy can be adopted and cited;
text, slides and quiz items cannot be reused. The workshop talk transcripts
are YouTube captions and are not under the CC license at all; do not
redistribute them.
