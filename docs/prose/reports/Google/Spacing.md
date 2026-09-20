# Google.Spacing

## Rule

`.vale/styles/Google/Spacing.yml` extends `existence` at `level: error`, with
`nonword: true` and an `action` of `remove`. It carries two regex tokens:
`[a-z][.?!] {2,}[A-Z]` (a lowercase letter, sentence-ending punctuation, two
or more spaces, then a capital) and `[a-z][.?!][A-Z]` (the same but zero
spaces). The rule targets sentences with the wrong number of spaces after a
period, question mark or exclamation mark: two-plus, or none.

## Stats

Total hits: 10.

| area      | hits | words | hits per 1,000 words |
| --------- | ---- | ----- | -------------------- |
| plan      | 7    | 15884 | 0.441                |
| repo-docs | 1    | 3489  | 0.287                |
| spec      | 2    | 13184 | 0.152                |

Top matched phrases (lowercase), 1 distinct phrase:

| phrase | count |
| ------ | ----- |
| g.a    | 10    |

## Examples

All 10 hits, every one the substring `g.A` inside the brand name
"DeepLearning.AI":

- AGENTS.md:127

  ```
  adapted (verbatim inclusion only, marked per page); Anthropic Academy and
  DeepLearning.AI material may only be linked or used as inspiration, never
  copied. Prefer public `academy.claude.com` URLs when linking Anthropic
  ```

- docs/plan/README.md:46

  ```
  | `ai-anthropic-partners`        | Anthropic, proprietary                          | Reference and link only, preferring public `academy.claude.com` URLs.                                                                                                                                                                            |
  | `ai-deep-learning`             | DeepLearning.AI, paid                           | Inspiration for topic coverage and sequencing only. Embed nothing.                                                                                                                                                                               |
  | Learn Prompting                | CC BY 4.0 (to 2023-02-15), then CC BY-NC-SA 4.0 | Vocabulary and authoring patterns only; no text adapted from either license period. Prompting concepts are written from the papers. See [explore/12](./explore/12-learn-prompting.md).                                                           |
  ```

- docs/plan/explore/01-prior-sbp-training-and-course-compare.md:61

  ```
  only), `2026-09-19-agent-course-vs-dlai-comparison.html` (generated). A
  three-way comparison: the Osmani-fork agent-engineer-course vs DeepLearning.AI
  vs Anthropic Partner Academy, with CS50 AI as an optional foundation. Depth
  ```

- docs/plan/explore/01-prior-sbp-training-and-course-compare.md:71

  ```
  widgets.
  - DeepLearning.AI wins on eval-driven method (measured reflection, 2x2 eval
    taxonomy, error-analysis tallies, component evals) and live coding-agent
  ```

- docs/plan/explore/05-career-model-and-deeplearning-ai.md:1

  ```

  Personal fetcher turning DeepLearning.AI courses into local Markdown. Also
  `the-batch/ai-engineering-skills-map.md` with Andrew Ng's AI Engineering Skills
  ```

- docs/plan/explore/05-career-model-and-deeplearning-ai.md:77

  ```

  **Copyright: the material under `courses/` is DeepLearning.AI's and must not be
  redistributed or reused. Topic coverage and sequencing inspiration only.**
  ```

- docs/plan/explore/05-career-model-and-deeplearning-ai.md:81

  ```

  ## `ai-deep-learning` (DeepLearning.AI, inspiration only)

  ```

- docs/plan/explore/06-lesson-inventory.md:100

  ```
  | `AEC-NN`          | Lesson NN of *agent-engineer-course*, a fork of Addy Osmani's course maintained by the author                                                  | Apache-2.0                | May be adapted, with attribution in `NOTICE.md`                               |
  | `DLAI-N`          | DeepLearning.AI course N in the reading order below; `M1`..`M5` are modules of a course                                                        | Proprietary               | Topic coverage and sequencing as inspiration only; nothing copied or embedded |
  | `Brilliant XXX`   | A big idea (three-letter code) in Brilliant's *Coding with AI* skills map; see "Alignment"                                                     | Proprietary               | Ideas and codes as facts; no text                                             |
  ```

- docs/spec/S02-topic-map.md:113

  ```

  | Key       | DeepLearning.AI course                                                                                  |
  | --------- | ------------------------------------------------------------------------------------------------------- |
  ```

- docs/spec/S02-topic-map.md:141

  ```
  | `AEC-15` | AGENTS.md: contents, monorepo hierarchies, with a builder widget                              |
  | `AEC-16` | MCP deep dive: MCP versus CLI, security failure modes, token cost                             |
  | `AEC-17` | Agent skills: skills versus tools, the spec, progressive disclosure                           |
  ```

## Concentration

- Top files by hits: `docs/plan/explore/05-career-model-and-deeplearning-ai.md`
  (3), `docs/plan/explore/01-prior-sbp-training-and-course-compare.md` (2),
  `docs/spec/S02-topic-map.md` (2), `AGENTS.md` (1), `docs/plan/README.md` (1),
  `docs/plan/explore/06-lesson-inventory.md` (1).
- Every one of the 10 hits is the same substring pattern, `g.A`, inside the
  literal brand name "DeepLearning.AI" written in running prose, table cells,
  and one heading. None involve an actual sentence-spacing problem between
  two different sentences.
