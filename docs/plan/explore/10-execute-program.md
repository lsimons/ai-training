# Exploration 10: Execute Program

Captured 2026-09-19 by working through a lesson and a review in a logged-in
session (Leo's account) with a driven browser, plus the public FAQ and
"Why EP?" pages. Source: <https://www.executeprogram.com/>, Gary Bernhardt.
Proprietary; structure and mechanics only, no lesson text reused.

## What it is

An interactive course platform for professional programmers who already
know one language: Python, TypeScript, SQL, JavaScript arrays and regular
expressions, and so on. As of this visit: 428 lessons and 3,735 code
examples across the catalogue; the Python for Programmers course has 66
lessons and 882 examples and takes a median of 12 hours over 16 calendar
days. Subscription, with 16 free lessons.

Their pitch, in their words: reading or watching is not doing; free
resources are passive, uneven and unmaintained; every code example is
verified by two independent automated test systems and a third check in the
browser. No multiple choice, no true/false anywhere.

## The lesson

One page, progressive reveal. Each press of **Continue** appends the next
element below the previous ones; nothing is hidden or paged, so the whole
lesson is scrollable afterwards. Three element kinds, in a fixed rhythm of
one or two short paragraphs then one code example:

1. **Paragraph.** One idea, two to four sentences, inline code terms in
   boxes. Occasionally a note: "this code example reuses elements defined in
   earlier examples".
2. **Run Code example.** Code shown with an empty RESULT slot and a **Run
   Code** button. The learner presses it, the code actually runs in the
   browser, and the result appears. No answer required. Used when the point
   is to show, not to test.
3. **Prediction example.** Same layout, but the RESULT slot is a text box
   with **Run** (Enter) and **Hint**. The learner types what the expression
   evaluates to. Correct: the value turns green with a check mark and
   Continue appears. Wrong: the box border turns red, nothing else, and Hint
   becomes available. Hint text appears in the RESULT slot and is a
   diagnostic nudge, not the answer ("Carefully compare the values of
   `user_input` and `secret_password`; are they exactly the same?"). Unlimited
   retries. The answer is never shown in a lesson.

Console-output examples show each printed line with a millisecond timestamp
and a **Run Again** button. A **progress bar** in the header fills per
element. The lesson closes with a **code problem**: a written task ("CREATE a
cats table with a TEXT name column, then INSERT..., then SELECT...") with a
multi-line editor, a GOAL value, a YOURS value that updates on run, and
**Show Author's Answer**. Then a closing paragraph and **Finish Lesson**.

Observed counts for *A Taste of Python*: 14 code examples, about 20 short
paragraphs, roughly 5 minutes. The course page rates each lesson as a
"Medium lesson" and so on.

Resuming: reopening an unfinished lesson asks **Restart** or **Resume**.

## The course

Course page: title, one-line description, an About panel (what you will
learn, counts, median time, prerequisites), a completion ring (lessons done,
examples done), a **Reset...** button, and the lesson graph.

The graph is the sidebar and the map at once. Lessons are boxes drawn in
**levels** (Level 1 to Level 10 for Python), connected by dotted
prerequisite edges. Levels beyond the current one are **locked**; finishing
a lesson unlocks the next box on its edge. The home page says "each course
is a graph of lessons; you choose the path, starting at the top". Some
lessons are titled **Quiz: ...** (for example "Quiz: Two Foreign Keys" in
SQL), which are code problems without teaching.

**Reference**: a slide-in panel, available from any lesson or review, with
one entry per finished lesson: a two-sentence summary on the left and the
canonical code example with its result on the right, plus a View Lesson
link. "For 1/33 lessons (more unlock as you progress)." Reference unlocks
with learning; it is not documentation you can read ahead.

## Reviews

The defining feature. Finishing a lesson schedules a **review** of some of
its code examples for the next day, then at growing intervals. The courses
page shows "New Review available!" or "New Lesson Available!" per course;
reviews for 6-year-old lessons were still waiting on this account.

A review is a short page of prediction examples taken from finished lessons,
with a one-paragraph reminder of the answer format ("for `1 + 1` you would
type `2`"; "type `error` if the code will result in an error"). Per item:
**Run**, **Hint**, **Give Up**. Hint is again diagnostic ("You've provided a
blank answer. Remember that the SELECT statement returns the rows from the
table"). Give Up is disabled until at least one attempt. After a correct
answer the item shows **LESSON: Basic Tables** (a link) and a **PROGRESS**
strip of five pills marking the item's position in the repetition schedule,
plus **Change review frequency**: "If you're not confident in your answer,
increase the reviews to see this review item again sooner. If this review
was too easy, decrease reviews." Then **Finish Review** returns to the
course page.

Pacing, from the FAQ: EP sometimes suggests stopping for the day because
cramming works badly, but does not hard-limit lessons per day. Most lessons
take about 5 minutes. Their marketing table: interact 6 hours total as 30
minutes a day for 12 days, then occasional reviews taking under 10% of total
time, finishing the last review set about three months later.

## Vocabulary

course, level, lesson (Medium lesson), code example, prediction (implicit;
they say "type in what each expression will evaluate to"), code problem,
Quiz lesson, review, review item, review frequency, reference, Run, Run
Code, Run Again, Hint, Give Up, Show Author's Answer, Finish Lesson, Finish
Review, Reset.

## What to take from it

Decision 2026-09-19: all eight items below applied. `predict` and the CI
rule are in spec S01; the rhythm, lesson graph and reference filter in specs
S01 and S02; spaced review is [spec S03](../../spec/S03-spaced-review.md).

1. **Prediction as the core checkpoint for code.** Show real code, ask for
   the value, run it to grade. This is the `repair` and `choice` interaction
   types' better sibling for anything executable: it is not multiple choice,
   it cannot be guessed, and grading is exact. Add `predict` to the
   interaction types in spec S01, with an honour-system variant for
   non-executable cases (predict what the agent will do, then run it).
2. **Never reveal the answer in a lesson; hints are diagnostic questions.**
   Matches the CS50 Duck finding and the Anthropic modules. Give Up exists
   only in reviews, where the learner has already passed once.
3. **Progressive reveal, one idea then one example.** The rhythm keeps
   paragraphs short and forces an example per idea. Our tutorial-mode
   lessons should adopt the rhythm even if we render the whole page.
4. **Reuse across examples with an explicit note.** State-carrying examples
   let a lesson build one artefact; the note stops confusion.
5. **The course page is the graph.** Levels with locked tiers and dotted
   prerequisite edges is a good rendering for our per-course lesson view and
   fits the three-lane path idea in spec S02.
6. **Spaced review is the retention mechanism**, and it needs a scheduler and
   a place to surface "review available". With local-storage progress we can
   do this per browser: store an interval per checkpoint, surface due
   reviews on the course page and in tutor mode, let the learner adjust
   frequency per item. Worth a small spec of its own.
7. **Reference unlocks with progress.** A generated reference from finished
   lessons doubles as the recap and as the review's crib. Our recap sections
   and topic reference pages could be assembled the same way.
8. **Every example is executable and tested.** For code lessons we should do
   the same: examples run in CI, expected outputs asserted. For agent
   lessons it is harder; the fixture-repository rule in spec S01 is the
   nearest equivalent.

Not adopted: the subscription and lock-step level gating as a business
device; our content is open and paths are advisory. Also their "no multiple
choice" absolutism: our Foundations material is not executable, so `choice`
and `scenario` stay, but prediction should be preferred wherever code runs.
