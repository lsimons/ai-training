# One lesson on the EU AI act

This file records what the lesson needs and how to source it. It contains
no summary of Regulation (EU) 2024/1689 on purpose: earlier summaries seen
during planning were model-generated and unverified, so the content is to
be written fresh from primary sources. Feeds L4 in the [README](./README.md).

## Why the lesson exists

The regulation places an **AI literacy** duty on organizations that put AI
systems into use: the people who operate them must be trained to a level
appropriate to their role. A public training site is a direct answer to
that duty, and the lesson should say so in its first paragraph.

## What the lesson must cover

Everything below is to be written from the Regulation and the Commission's
official material, with article references checked against the
consolidated text, and dated.

1. **Is it an AI system at all?** The definition, and why a rules engine or
   a spreadsheet macro isn't one.
2. **The risk tiers.** Prohibited practices; high-risk systems (the
   annexed use-case list and the product-safety route); systems with
   transparency obligations, and everything else. A decision tree is the
   right structure, and a scenario-sorting checkpoint follows naturally.
3. **Provider or deployer.** Who develops or brands a system, who uses it,
   and how a deployer becomes a provider (substantial modification, change
   of intended purpose, own name on someone else's system). Two short
   tests, one per role, with the possibility of holding both roles.
4. **What each role owes**, at the level of headings only: risk management,
   documentation, logging, human oversight, accuracy and robustness,
   conformity assessment, registration, post-market monitoring and incident
   reporting for providers; instructions-for-use compliance, oversight,
   log retention, workforce information, and impact assessment where
   applicable for deployers. Link to the articles rather than paraphrasing
   them.
5. **Transparency duties** that touch everyday work: telling people they
   are talking to a machine, labeling synthetic content. This connects to
   the disclosure line in [`guardrails.md`](./guardrails.md) and to content
   credentials.
6. **The timeline** of application dates taken from the Regulation and the
   Commission's implementation pages, with the current date in view.
7. **Penalties**, as an order of magnitude and as a signal of what the
   legislator considers worst.
8. **Enforcement**: the national authorities and the European AI Office, in
   general terms, with a pointer to the learner's own member state.

## What the lesson must not do

- Give legal advice, or read as if it does. State the disclaimer.
- Copy article summaries from secondary sites without checking them.
- Reuse any figure, date or article number from an unverified summary.

## Regenerate from

- Regulation (EU) 2024/1689 on EUR-Lex, consolidated text.
- The European Commission's AI Act pages and the AI Office.
- The independent article-by-article explorer at
  `artificialintelligenceact.eu`, for navigation, never as the citation.
- National authority guidance for the learner's country, linked, not
  summarized.

## Notes for the lesson author

- Foundations lesson, one level, for everyone. Engineers get a pointer to
  the provider obligations from L1.
- Checkpoints: tier sorting for six short scenarios; a provider-or-deployer
  decision for three, and one "is this even an AI system?" question.
- Mark the lesson with a review date; the Regulation's application dates
  and guidance move.
