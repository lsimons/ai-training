# Exploration 12: Learn Prompting

Captured 2026-09-20 from the local clone at `~/git/lsimons/Learn_Prompting`
(<https://github.com/trigaten/Learn_Prompting>, Sander Schulhoff and
community) plus a look at the live guide at
<https://learnprompting.org/docs/introduction>. Two branches matter:

| Branch          | Last commit          | License         | Content                                                                    |
| --------------- | -------------------- | --------------- | -------------------------------------------------------------------------- |
| `license-CC-BY` | `71e1d57` 2023-02-15 | CC BY 4.0       | 69 Markdown pages under `docs/`, about 30k words, English only, Docusaurus |
| `main`          | `668fd48` 2025-01-14 | CC BY-NC-SA 4.0 | 134 MDX pages under `(docs)/docs/`, about 63k words, plus 15 translations  |

**License, important.** The relicensing commit is `d80fbeb` on 2023-02-16,
one day after the `license-CC-BY` branch point, so that branch is exactly the
last CC BY state. CC BY 4.0 content may be adapted into this CC BY-SA 4.0
project with attribution and a `NOTICE.md` entry. Everything on `main` and on
the live site is CC BY-NC-SA and falls under the same rule as CS50 in the
plan's source table: cite and use ideas, do not adapt text. The English pages
on `main` moved to a `(docs)/docs/<slug>/page.mdx` layout in March 2024
("replaced docs"), which is the source tree of the current Next.js site; the
site itself has since grown sections not in the repo (Models, RAG, Agents,
Language Model Inversion, New Techniques from "The Prompt Report").

## What it is

A free "Prompt Engineering Guide" written from December 2022 onward, aimed at
non-technical readers first, engineers later, with an article rating system
(🟢 no programming, 🟡 basic programming, 🔴 programming plus some domain
knowledge, 🟣 robust domain expertise) in every page title. It is the
Wikipedia-cited prompt engineering course and the origin of much of the
2023 "prompt engineering" vocabulary. The company later pivoted to paid
courses, HackAPrompt and the Prompt Report survey; the README on `main` is
mostly marketing.

## Structure and mechanics

Sections on the CC BY branch: Basics (6), Intermediate (5), Applied
Prompting (5 community walkthroughs), Advanced Applications (MRKL, PAL,
ReAct), Reliability (5), Prompt Hacking (4), Images (7), Tooling (22, mostly
one-paragraph reviews of 2022 prompt IDEs), Trainable (2), Miscellaneous
(3), plus vocabulary, bibliography, credits, products.

`main` rewrites Basics into 17 pages (chatbots, tokens and context length,
LLM settings, priming, pitfalls, "understanding AI minds", the "Learn
Prompting Method"), adds Basic Applications (12 knowledge-worker pages:
emails, blogs, contracts, summaries, tables, coding assistance, Zapier),
splits Prompt Hacking into offensive measures (obfuscation, payload
splitting, defined dictionary, virtualization, indirect injection, recursive
injection, code injection) and defensive measures (filtering, instruction,
post-prompting, random sequence enclosure, sandwich, XML tagging, separate
LLM evaluation), and adds least-to-most, ensembling, math reliability,
Midjourney and shot types, and a Hot Topics page (GPT-4, Auto-GPT, BabyAGI,
AgentGPT).

Authoring mechanics worth noting:

- **Citations as remark plugin.** `(@key)` in Markdown resolves against
  `bibliography.bib` (`remark-bibtex`); 115 unique keys on the CC BY branch,
  140 on `main`; a generated bibliography page. Papers are cited, not just
  linked.
- **Auto-glossary tooltips.** `%%shown text|glossary key%%` resolves against
  `glossary.yml` (27 terms) and renders a hover definition
  (`remark-auto-glossary`, by a contributor). `main` replaced this with a
  `<Term term="LLM">` component, 31 uses.
- **Live prompt embeds.** The CC BY pages embed a third-party playground
  (`trydyno-embed`, text-davinci-003, temperature and top-p in attributes,
  with the recorded output as `initial-response`). `main` migrated to
  `embed.learnprompting.org` iframes whose whole configuration is a
  base64-encoded JSON in the URL. Dyno is gone; the pages that depended on it
  now show nothing. Around 2024 they also introduced `<AIInput>` and
  `<AIOutput title="...">` components for static prompt and response pairs
  (57 and 33 uses), which are just styled blocks.
- **Takeaways box** at the top of each `main` Basics page: two or three
  bullets of what the page teaches. Difficulty emoji in the title. One
  header illustration per page.
- **Footnotes for asides**, difficulty label per page, no quizzes, no
  progress, no exercises beyond "try this in ChatGPT".

## Quality

The CC BY branch is human-written, terse, and honest about uncertainty
("To my knowledge, this solution has not been explored in the literature").
It reads like good lecture notes: one idea, one figure from the paper, one
demo, a Limitations section, a paper citation. Faults: typos, a glossary
entry defining LLM as "Language Language Model", everything demonstrated on
text-davinci-003, and some claims now wrong (CoT "only yields gains at about
100B parameters"; "there exist few to no defenses" against injection).

The `main` rewrite from mid-2023 is roughly double the length for the same
ideas and has the GPT-4-era register the prompt for this note predicted:
"revolutionized many aspects of technology", "it's important to note",
"delve", a "Conclusion" paragraph that restates the page, a Pitfalls page
that is five generic paragraphs. The Basic Applications pages are pasted
ChatGPT transcripts with light commentary. Facts did not get worse, but the
signal per word did. The offensive and defensive measures pages are the
exception: short, concrete, and still the standard names for those tricks.

Compared with the other references: below Anthropic Academy and the
`agent-engineer-course` on rigour and currency, well below Execute Program
and Brilliant on pedagogy, but ahead of roadmap.sh on explanation because
each technique gets a worked example and a paper.

## Vocabulary

prompt engineering, standard prompt, few-shot standard prompt, exemplar,
zero-shot / one-shot / few-shot, role prompt, priming prompt, instruction
prompt, chain of thought (CoT), zero-shot CoT ("Let's think step by step"),
self-consistency, generated knowledge, least-to-most, ensembling / DiVeRSe,
calibration, verbalizer, label space, prompt hacking, prompt injection,
prompt leaking, jailbreaking, delivery mechanism and payload, indirect
injection, sandwich defense, post-prompting, random sequence enclosure,
XML tagging, separate LLM evaluation, MRKL, PAL, ReAct, soft prompting,
temperature / top-p / maximum length.

## What to take from it

Little text, a few patterns, and a source for the prompting slice of the
concept register.

1. **Seed prompting concepts from the CC BY branch, with attribution.** The
   short intermediate pages (chain of thought, zero-shot CoT,
   self-consistency, generated knowledge), the standard prompt and exemplar
   definitions, and the prompt hacking trio (injection, leaking,
   jailbreaking) plus the 2023 defensive measures are adaptable. Use them as
   one-paragraph concept definitions in the concept register and as the
   Safety area's named-defence list, rewritten for current models and cited
   to the original papers. Add a `NOTICE.md` entry pointing at commit
   `71e1d57`. Nothing from `main` or the live site may be adapted; the
   offensive-measures taxonomy names can be used as vocabulary with a link.
2. **Citations as first-class Markdown.** A `(@key)` to bibliography
   mechanism is cheap in Astro (a remark plugin plus a `.bib` or YAML) and
   would let lessons cite papers without inline URL clutter. Pairs with the
   concept register's "one paragraph plus sources" shape.
3. **Glossary tooltips from the concept register.** `%%text|term%%` or a
   `<Term>` component that renders the register definition on hover is the
   natural rendering of spec 001's concept register inside lessons. Their
   two implementations show it can be a remark plugin, not a component, so
   plain Markdown stays plain.
4. **Prompt and response as a styled pair.** Adopt an `AIInput` /
   `AIOutput`-style block for static prompt and response examples in
   Foundations lessons, with the model and settings named on the block. Ours
   should carry the model and date, since their undated davinci-003 outputs
   are the main reason the pages aged badly.
5. **Do not embed a third-party playground.** Two generations of live embeds
   died with the vendors. Our spec 001 rule that examples run in CI and show
   asserted output is the right answer; a static recorded output beats a dead
   iframe.
6. **The walkthrough shape.** The Applied Prompting pages (LSAT multiple
   choice, discussion questions) follow a good tutorial arc: naive prompt,
   show the failure, add one technique, reorder, reword, compare. That arc
   is a reusable lesson template for the Using agents area and is CC BY.
7. **Takeaways box: no.** Their two or three "you will learn" bullets at
   the top of each page are exactly what spec 001 forbids for learning
   objectives; the lesson opener ("In this lesson we will...") and the recap
   already carry that role. Noted only so it is not proposed again.

Not adopted: the four-colour difficulty emoji (our two comfort levels per
lesson already do this, and emoji in titles hurt search and screen
readers); the Learn Prompting Method and Pitfalls pages (NC, and generic);
Basic Applications (NC, pasted transcripts); Tooling reviews and Hot Topics
(dead products); image prompting and prompt tuning (out of scope);
translations (out of scope). The technique catalogue itself is superseded
for engineers by vendor prompting guides and by the Prompt Report taxonomy,
which is a paper and can be cited directly.
