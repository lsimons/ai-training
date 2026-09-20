# Lessons learned from a gamified AI literacy program

Evidence and patterns from a year-long, organization-wide AI literacy
program that ran as a points leaderboard: a few hundred small tasks in ten
subject categories. Each was claimed with a screenshot or a short text and
reviewed by a small team.

The useful remains are a way of typing exercises, a template for writing
them, and evidence about what learners actually do when tasks are optional.

## 1. The kinds of task

The program sorted every task into one of three types, and every subject
category had all three. The split is simple and proved useful both for
authoring and for spotting gaps:

| Type           | What the learner does                                                  | Typical proof                         |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| **Understand** | Read, watch or take a course, write a definition, or draw a diagram.   | A reflection paragraph, a certificate |
| **Do**         | Run a prompt, build a small thing, automate one task, try a tool.      | A screenshot                          |
| **Judge**      | Compare two approaches, measure something, assess a risk, red-team it. | A table, a short write-up             |

For this site the mapping is: **Understand** is served by the lesson body
and its checkpoints, and **Do** and **Judge** are the two flavors of
[Exercise](../../../spec/S03-lesson-authoring.md). A course whose exercises
are all "do" has no place where the learner has to judge anything. A course whose
exercises are all "judge" never gets hands dirty. Proposal: when S03 pins
down exercise kinds, name these two and ask for at least one of each per
course.

The three-way split also works as a check on a whole curriculum. Listing
the topics under each type showed at a glance that some subjects (data,
model internals) had plenty of "understand" and "judge" but no cheap "do",
which is where the completions were (see section 3).

## 2. A template for exercise text

Nearly every task written in the program's second half used one template,
and it should become the default for exercise prose:

> **How to complete.** Two or three imperative sentences. Say exactly what to
> produce and roughly how big it is ("three example prompts", "a table with
> one row per model", "a two-line comparison").
>
> **Why do this.** One sentence. What the learner can do afterwards that they
> couldn't before, or what it protects them from.

Further habits from the tasks that got engagement:

- **End with a reflection prompt**, not just a deliverable: "what surprised
  you?", "how did this improve on the plain prompt, in two lines?", "what
  did you learn about prompt injection?". Every popular challenge had one.
  For this site that's the self-grade step of an Exercise and the material
  for its model answer.
- **Make the proof the artifact.** A screenshot or a short text is the whole
  submission. Anything that asked for a matrix, a slide deck or a one-pager
  got a few completions at most.

Suggested home: `docs/agents/writing-a-lesson.md`, next to the Exercise
component's description.

## 3. What learners actually did

The completion counts are the most useful data the program left behind.
Some rounded figures, for a population of a few hundred knowledge workers
and engineers over nine months:

| Task                                                        | Completions |
| ----------------------------------------------------------- | ----------- |
| Write one prompt with no examples and screenshot the answer | over 500    |
| Generate an image with an AI tool                           | about 70    |
| Ask the model to take on a professional role, compare       | about 60    |
| Give the model two or three examples first (few-shot)       | about 45    |
| Ask for step-by-step reasoning (chain of thought)           | about 40    |
| Beat level 7 of a public prompt-injection game              | about 25    |
| Each other "advanced" prompting technique                   | 2 to 10     |
| Any task phrased as "build a comparison matrix"             | 0 to 2      |
| Anything in the data and embeddings category                | 1 in total  |

Conclusions:

- **Uptake concentrates in the lowest-effort, most concrete tasks.** A five-minute
  task with a screenshot got hundreds of completions, and the same idea phrased
  as an analysis exercise got none. For a self-paced site: the first
  exercise in every lesson must be small and produce something visible.
- **Interest in prompting techniques stops after four of them.**
  Zero-shot, role, few-shot and chain-of-thought drew real numbers.
  Generated knowledge, self-consistency, directional stimulus, tree of
  thoughts, Reflexion, ReAct, prompt chaining, and combinations each drew a
  few. The Foundations prompting lesson should teach the four and
  point to the rest as a Short for the `more` comfort level. Technique
  names and definitions come from the papers, as already decided in
  [explore/12](../12-learn-prompting.md).
- **Bulk-authored coverage doesn't get done.** About half the catalogue was
  written in one week, to one template, across every subject. Over the
  following six months those tasks drew a few dozen completions between
  them, and two thirds were never attempted. Breadth written without a
  learner in mind is inventory, not learning. The site's thin-slice plan
  (one or two lessons per area, then deepen) is the right response.
- **Tasks that use a public interactive challenge work.** Three external
  sites were used as weekly tasks and deserve `Source` entries
  for the Safety area when the prompt-injection lesson is written:
  [Gandalf](https://gandalf.lakera.ai/baseline) (a levelled
  prompt-injection game; the task was "reach level 7 and write what you
  learned"), [Red by Giskard](https://red.giskard.ai/) (prompt-injection
  puzzles), and [AI or Human](https://ai-or-human.github.io/) (tell model
  output from human writing).
- **Rewards shaped behavior more than learning did.** Points scaled with
  business impact. A sales pitch or a process automation scored fifty to a
  hundred times the points of a learning task, and the biggest single spike in
  the data was an administrative round of retroactive badges. This site has
  no points on purpose. Its analogues are the course finish and the review
  schedule. Keep both cheap to reach and never tie them to anything beyond
  the learner's own progress.

## 4. Exercise ideas to write

Rewritten as one-line briefs, grouped by the site's areas. Each fits the
template in section 2 and is a "do" or a "judge" unless marked.

**Concepts**

- Change temperature and top-p on the same prompt; record how the output
  shifts between consistent and creative. *(do)*
- Send progressively longer inputs until a model hits its context limit;
  note exactly what happens at the boundary. *(do)*
- Run three prompts (creative, analytical, factual) through three models;
  compare style, accuracy, and length in a small table. *(judge)*
- List five failure modes of language models with one real example each,
  drawn from your own use. *(judge)*
- Run a small open model locally with Ollama and compare a response with a
  hosted model's. *(do)*
- One question, three personas: ask the same thing as three different
  characters and compare what changes. Ends with "what does this tell you
  about how phrasing shapes the answer?" *(do, zero cost, good first
  prompting exercise)*

**Safety**

- Write three prompts that would expose personal data, bypass a rule or
  leak something, then rewrite each so it is safe. *(judge)*
- Red-team your own prompt: try to make it reveal its instructions or do
  something it shouldn't, then describe what worked. *(do)*
- Look up how one tool you use stores, processes and shares what you type;
  summarize it in five lines. *(judge)*
- Write a checklist for when a human must review, approve, or step in during
  an automated task. *(judge)*
- Put made-up sensitive data through a model in a scratch account; note
  what it does with it and what you would change. *(do)*
- Opener for an agent-risk lesson: name one part of your work where you
  would want a model to predict your next move, and one where you would
  not. *(understand, reflective)*

**Using agents**

- Give an agent a task with at least three connected steps; record the
  prompt and how each step was carried out. *(do)*
- Automate one small repetitive task from your own week, with the agent
  either doing it or writing the script. *(do)*
- Take a flow you already run with AI and add a human checkpoint at the
  point where an error would cost most. *(judge)*
- Reflect on last month's AI use: where did you rely on it, where did you
  check it, where should you have? *(judge, reflective)*

**Building agents**

- Build an agent with one or two tools (a calculator, a search, one API)
  and test whether it picks the right tool for the right request. *(do)*
- Take an agent that loops or forgets context, get it unstuck, and write
  down the steps you took. *(do)*
- Define two or three metrics for agent task completion (finished, correct,
  cost, time) and measure one agent against them on five tasks. *(judge)*
- Explain the difference between a chatbot, a tool-using model and an
  autonomous agent, with one use case each. *(understand)*

## Questions for review

1. Name the two exercise flavors "do" and "judge" in S03, or keep one
   Exercise kind and express the difference only in authoring guidance?
2. The completion figures are from one organization and one year. Quote them
   in the plan as evidence for the thin-slice approach, or keep them here as
   background only?
3. The public challenge sites are third-party and could change or
   disappear. List them as `Source` entries with a fallback exercise, or
   embed the idea (a levelled injection puzzle) as a widget of our own?
