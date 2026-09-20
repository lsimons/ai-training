# Readability: summary and recommendations

Reviewer's read of the Readability package (v0.1.1) against this repository,
written to let the maintainer decide. Data: `Readability.json` (the hits a
normal run produces), `scores.tsv` (every file's score on every rule, from
`mise run prose-metrics -- Readability`), `wordcount.tsv`.

## How this package differs

The seven rules are not token matches. Each one is a formula over the whole
file (words per sentence, syllables or letters per word) that yields one
number, and Vale raises one alert per file when that number crosses the
rule's threshold. Three consequences:

- **No locus.** Every hit sits at line 1, span 1. The message says "Try to
  keep the Flesch-Kincaid grade level (9.4) below 8" and nothing else. The
  author has to find the long sentences and the long words themselves.
- **Passing files are invisible.** A normal run shows the failures only, so
  `scores.tsv` was produced with the thresholds removed to see the whole
  distribution.
- **YAML is skipped.** Vale does not apply metric rules to the site data
  files, so 40 of the 90 files in scope (the `data` area, 18,534 words) get
  no score.

The seven scores are seven views of the same two quantities. Over the 45
scored files with 200 words or more, every pair correlates at 0.89 or
stronger (Flesch-Kincaid against SMOG: 0.99, against Gunning Fog: 0.98).
Enabling more than one is enabling the same rule several times.

## Stats

Per area: how many files scored, the median, and how many fail the
package's default threshold. Flesch-Kincaid grade (threshold 8) is shown
in full; the other six rules fail nearly the same set of files.

| Area       | Files | Median grade | Failing | Lowest, highest |
| ---------- | ----: | -----------: | ------: | --------------- |
| lessons    |    19 |          5.6 |       2 | 0.6, 10.4       |
| spec       |     7 |          7.4 |       0 | 5.7, 8.0        |
| plan       |    13 |          9.4 |      13 | 8.0, 12.2       |
| agent-docs |     5 |          5.4 |       0 | 4.7, 7.5        |
| repo-docs  |     6 |          7.9 |       3 | 5.9, 15.3       |

Files failing per rule, all areas: FleschReadingEase 31, ColemanLiau 26,
LIX 23, SMOG 23, FleschKincaid 18, GunningFog 16, AutomatedReadability 15.
The differences are the thresholds, not the files: FleschReadingEase's
"above 70" is the strictest, and it fails five of the seven specs and two
of the five agent docs that every other rule passes.

## What the scores point at

**The lessons are already where the package wants them.** Median grade 5.6
and the two longest lessons, `safety/agent-risk.mdx` (2,877 words) and
`using-agents/delegating.mdx`, score 6.4 and 6.5. The most technical one,
`concepts/how-models-work.mdx`, scores 7.2 with 14 words per sentence and
one in nine words at three or more syllables (distribution, temperature,
prediction, vocabulary). Those are the words the lesson exists to teach.

**The two failing lessons are the course blurbs**, each one sentence long:

- `coding-with-agents/index.mdx`, grade 10.4, one 29-word sentence:
  "Shipping software changes with a coding agent: from your first session
  in a small repository, through planning, implementing and verifying a
  change, to working with agents alongside a team."
- `customizing-agents/index.mdx`, grade 8.7, one 31-word sentence: "This
  course is about the layer between you and the agent: the instructions,
  skills, tools and permissions that turn a general-purpose coding agent
  into one that works well in your project."

Both are fair hits. A blurb that is one long list-sentence reads worse
than two short ones, and these are the first thing a learner sees on a
course page. Two edits fix them. With so few sentences, though, one
sentence swings the score by several grades; the metric is unreliable
under about 100 words.

**Every plan note fails, and the reason is the form.** The exploration
notes average 20 to 27 words per sentence with 17 to 27 percent long
words. The longest "sentences" are inventories: `explore/12-learn-prompting.md`
has an 87-word list of page titles and a 76-word list of prompting terms;
`explore/01-prior-sbp-training-and-course-compare.md` has a 95-word "worth
reusing" enumeration. Splitting those into bullet lists would move the
score and change nothing for the reader, who is the author and the
agents. The notes are not where the readability budget should go.

**Repo docs.** `CODE_OF_CONDUCT.md` is the Contributor Covenant verbatim
(grade 15.3, reading ease 12.8) and cannot change. `SECURITY.md` (9.2) and
`NOTICE.md` (8.1) are short and their long words are the subject matter:
vulnerability, licensed, repository. `AGENTS.md` scores 6.5 on grade but
fails FleschReadingEase at 67.1; its longest sentences are the structure
list and the licensing paragraph, both of which read fine as reference.

**Specs pass Flesch-Kincaid and fail FleschReadingEase**, sitting at
58 to 73 against "above 70". `S02-topic-map.md` (5,907 words) at 57.7 is the
lowest; its long words are objectives, competencies, foundations. Same
story as the lessons: the vocabulary is the point.

## Recommendation

**Enable one rule, `Readability.FleschKincaid`, as an every-run warning,
scoped to the lessons only.** Turn the other six off.

- One rule, because the seven agree at 0.89 or better and seven warnings
  per file say the same thing seven times. Flesch-Kincaid because its
  output is a school grade, which everyone reads without a legend, and
  because its threshold (8) fits the audience: knowledge workers and
  engineers reading on screen.
- Lessons only, via a `[site/src/content/docs/**]` section in `.vale.ini`,
  because that is the material with a reader whose time the score
  measures. On the plan notes the rule fires on 13 of 13 files forever
  and teaches nothing; on the Code of Conduct it fires on text that cannot
  change. A rule that always fires is a rule everyone learns to skip.
- Every run rather than now and then, because at two hits today it is
  quiet, and a new lesson that comes in at grade 10 should be noticed
  while it is being written, not at the next occasional sweep. Warning,
  not error, because a whole-file average is the wrong thing to fail a
  build on: a lesson about tokenization has a right to long words, and a
  50-word blurb swings by grades on one sentence.

The honest limit of the rule: it says a file is hard, not where. A hit
sends the author to the longest sentences and the long-word rate, which is
what `scores.tsv` and this report did by hand. If hits become frequent, a
sentence-length rule with a per-sentence locus (the Microsoft and Google
Vale styles ship one) would be the better tool, and this package the
wrong one. That is a question for a later package evaluation.

**Alternatives, in case the maintainer weighs them differently.**

- *Now and then instead of every run:* defensible, and it costs nothing
  either way at two hits. Every run is preferred only because it catches
  a new lesson at the moment it is written.
- *FleschReadingEase instead of Flesch-Kincaid:* the same signal with a
  stricter threshold that fails the specs and `AGENTS.md`; would need a
  threshold change to be useful here, and Vale metric thresholds live in
  the package, not the config.
- *All lessons and specs:* the specs all pass Flesch-Kincaid today, so
  adding them is free, but their readers are the maintainer and agents,
  and the rule would flag a spec for using its own dictionary's words.

Whatever the decision, the two course blurbs deserve the rewrite.
