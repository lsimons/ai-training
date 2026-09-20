# Google.We

## Rule

`.vale/styles/Google/We.yml` extends `existence` at `level: warning` with
`ignorecase: true`. It flags five tokens (regex list): `we`, `we'(?:ve|re)`,
`ours?`, `us`, `let's`. Message: "Try to avoid using first-person plural like
'%s'." Link: `https://developers.google.com/style/pronouns#personal-pronouns`.

## Stats

Total hits: 84.

| Area       | Hits | Words  | Hits / 1000 words |
| ---------- | ---- | ------ | ----------------- |
| plan       | 49   | 15,884 | 3.09              |
| repo-docs  | 16   | 3,489  | 4.59              |
| lessons    | 14   | 12,227 | 1.15              |
| spec       | 5    | 13,184 | 0.38              |
| agent-docs | 0    | 2,707  | 0.00              |
| data       | 0    | 18,534 | 0.00              |

Top matched phrases (lowercase):

| Phrase | Count |
| ------ | ----- |
| our    | 38    |
| we     | 35    |
| ours   | 7     |
| us     | 3     |
| let's  | 1     |

Distinct phrases: 5.

## Examples

- `CODE_OF_CONDUCT.md:5` (repo-docs, "we"/"our")

  > We aim to make participation in our community a harassment-free experience
  > for everyone.

- `CONTRIBUTING.md:8` (repo-docs, "our" x2)

  > Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

- `SECURITY.md:17` (repo-docs, "We")

  > We will acknowledge your report within a few days and keep you informed of
  > progress. This is a small personal project, so response times may vary.

- `docs/plan/explore/09-brilliant-skills-map.md:174` (plan, "Ours")

  > | Brilliant | Ours ([spec S01](../../spec/S01-dictionary.md), [spec S02](../../spec/S02-topic-map.md)) | Note |

- `docs/plan/explore/09-brilliant-skills-map.md:209` (plan, "us")

  > later any corporate or national AI literacy framework. Cheap to keep and
  > lets a learner or employer find us by a code they already know.

- `docs/plan/explore/12-learn-prompting.md:107` (plan, "Let's")

  > zero-shot / one-shot / few-shot, role prompt, priming prompt, instruction
  > prompt, chain of thought (CoT), zero-shot CoT ("Let's think step by step"),
  > self-consistency, generated knowledge, least-to-most, ensembling / DiVeRSe,

- `docs/plan/explore/11-roadmap-sh.md:103` (plan, "ours")

  > choosing tools) and most of `coding-with-agents` except as a list of tool
  > names. Their unit is a technology or term; ours is a competency.

- `docs/plan/explore/10-execute-program.md:128` (plan, "Our")

  > 3\. **Progressive reveal, one idea then one example.** The rhythm keeps
  > paragraphs short and forces an example per idea. Our tutorial-mode
  > lessons should adopt the rhythm even if we render the whole page.

- `docs/spec/S02-topic-map.md:432` (spec, "Our"; picked at random from the rest)

  > | Framework | Code / item | Asks | Our objectives |

- `docs/spec/S03-lesson-authoring.md:43` (spec, "we" x2)

  > | Length | 10 to 25 minutes. |
  > | Opener | Where we are going: "In this lesson we will...". Never "you will learn...". |
  > | Sections | H2s, each with a section kind. Body sections alternate teaching with pitfalls and checkpoints. |

- `docs/spec/S05-spaced-review.md:133` (spec, "we")

  > require a pass in the lesson. Leaning: enter, because skipping is often "I
  > know this", and a review is how we find out.

- `site/src/content/docs/using-agents/delegating.mdx:25` (lessons, "us")

  > we can check. We will write the brief, decide how much the agent may do
  > before it comes back to us, and then review what it produced against the
  > brief rather than against a gut feeling. The task is deliberately small so

- `site/src/content/docs/customizing-agents/instructions.mdx:49` (lessons, "our")

  > Here is the smallest useful version for our fixture:

- `site/src/content/docs/safety/agent-risk.mdx:73` (lessons, "we"; picked at random from the rest)

  > bookmarked". Reading sounds harmless. But what it reads becomes part of its
  > instructions, as we will see below, and if the same agent also has your
  > mailbox or your shell, a web page is now a way into both.

- `docs/plan/explore/08-diataxis.md:50` (plan, "Our"; picked at random from the rest)

  > - Maintain the narrative of the expected: show expected output, flag the
  >   likely signs of going wrong. Our pitfall sections are this, kept
  >   short.

## Concentration

Top five files by hit count:

| File                                           | Hits |
| ---------------------------------------------- | ---- |
| `docs/plan/explore/09-brilliant-skills-map.md` | 18   |
| `docs/plan/explore/11-roadmap-sh.md`           | 12   |
| `CODE_OF_CONDUCT.md`                           | 8    |
| `docs/plan/explore/10-execute-program.md`      | 8    |
| `CONTRIBUTING.md`                              | 7    |

Hits cluster most heavily in `docs/plan/explore/`, which is exploration
notes rather than published content (49 of 84 hits, in six files). Within
`09-brilliant-skills-map.md` several hits fall inside a markdown table
(`Ours` as a column header at line 174, `our`/`ours` repeated at lines
176-182 in adjacent table rows). `repo-docs` files (`CODE_OF_CONDUCT.md`,
`CONTRIBUTING.md`, `SECURITY.md`) carry the hits in running prose typical of
community-facing boilerplate ("our community", "we will"). In `lessons` and
`spec`, hits appear in running prose and in one spec table header
(`docs/spec/S02-topic-map.md:432`, "Our objectives" as a column header) and
one spec table row (`docs/spec/S03-lesson-authoring.md:43`, describing the
lesson "Opener" convention). No hits fall in code blocks or code-adjacent
text.
