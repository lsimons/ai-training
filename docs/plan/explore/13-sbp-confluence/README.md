# Design brief: guardrails, sandboxing, tool governance, regulation, literacy

Ready-to-use ideas and lesson briefs on the operational side of AI safety
(guardrails, containment, tool onboarding, MCP security), on regulation
(the EU AI Act), and on what makes optional exercises get done. Nothing in
this directory is a decision. Future agents should read each file
critically against the specs, then adopt, adapt, or reject item by item.

The material was drawn from Schuberg Philis's internal AI wiki and its AI
literacy program, and rewritten from the ideas. Client names, people,
internal systems, prices and anything confidential were left out; what
remains is general practice that happened to be written down there first.
Public repositories from the same organization are listed with their
licenses in [`references.md`](./references.md).

## Instructions for the next agent

1. Read spec S01 for vocabulary and spec S02 for the topic map before
   proposing topics. Topic names below are suggestions.
2. Treat every claim, flag, version number, and figure as needing a check.
   Agent flags, environment variables, and sandbox options change between
   releases, and the regulation lesson must be written from the Regulation.
3. Where a file says "regenerate" or "verify", do that rather than adapting
   the text.
4. Public artifacts are listed in [`references.md`](./references.md) with
   licenses. Apache-2.0 and CC BY material may be adapted with attribution
   and a `NOTICE.md` entry. Everything else is link-only.
5. The changes under "Authoring changes" below belong in
   `docs/agents/writing-a-lesson.md` rather than in a lesson.

## Files

| File                                                               | What it holds                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`guardrails.md`](./guardrails.md)                                 | An engineering guardrails charter, plain-language rules for everyone, a "can I?" table, key hygiene, disclosure                                  |
| [`agent-risk-scenarios.md`](./agent-risk-scenarios.md)             | A six-domain security model, fifteen risk scenarios with countermeasures, rating scales, an assessment template                                  |
| [`tool-onboarding-tiers.md`](./tool-onboarding-tiers.md)           | A three-level ladder for bringing an AI tool into an organization, plus both checklists                                                          |
| [`sandboxing-and-containment.md`](./sandboxing-and-containment.md) | What a coding agent sends, six isolation approaches, a layered containment pattern, configuration hygiene                                        |
| [`mcp-security.md`](./mcp-security.md)                             | Delegated identity, capability scoping, bulk-write safety, prompt guardrails, residual risks, CLI vs MCP                                         |
| [`eu-ai-act.md`](./eu-ai-act.md)                                   | What the regulation lesson must cover and how to source it                                                                                       |
| [`ideas.md`](./ideas.md)                                           | Framings, practices, templates and small concepts to fold into lessons                                                                           |
| [`literacy.md`](./literacy.md)                                     | A three-way task typing, an exercise template, uptake data from a gamified program, exercise ideas per area                                      |
| [`references.md`](./references.md)                                 | Public artifacts to cite, with licenses and what each is for                                                                                     |
| [`onboarding-deck.md`](./onboarding-deck.md)                       | Additions from an onboarding day: capability versus reliability, time to value, a controls progression, a coding-with-agents syllabus, exercises |

## Proposed lessons

| #   | Lesson                                 | Area               | Audience          | Fed by                                             |
| --- | -------------------------------------- | ------------------ | ----------------- | -------------------------------------------------- |
| L1  | Guardrails for AI-assisted engineering | Safety             | Engineers         | `guardrails.md`, `agent-risk-scenarios.md`         |
| L2  | Sandboxing a coding agent              | Coding with agents | Engineers         | `sandboxing-and-containment.md`                    |
| L3  | What does your agent send? (short)     | Safety             | Everyone          | `sandboxing-and-containment.md`, section 1         |
| L4  | The EU AI Act in one lesson            | Safety             | Everyone          | `eu-ai-act.md`                                     |
| L5  | Connecting an agent to your systems    | Customizing agents | Engineers         | `mcp-security.md`                                  |
| L6  | Which tool, which data                 | Using agents       | Knowledge workers | `tool-onboarding-tiers.md`, `guardrails.md` part 2 |
| L7  | Reviewing what the agent pulled in     | Coding with agents | Engineers         | `ideas.md`, dependency review                      |

Each brief gives the area and the objectives it would serve, then outlines
the into/through/beyond arc and lists checkpoint ideas. Where the area is
Engineering it adds comfort levels. It closes with what must be regenerated
or verified.

### L1. Guardrails for AI-assisted engineering

- **Area:** Safety (Foundations), written for engineers. The
  plain-language half of `guardrails.md` is for everyone and could split
  off into its own short.
- **Proposed topic:** operational guardrails. **Assumes:** the agent-risk
  lesson already in Safety.
- **Objectives:** state the five groups of guardrails and give one rule for
  each; tell a deterministic quality gate from a probabilistic one; assign
  a risk scenario to a domain and rate it on both scales; tailor the
  charter for one project.
- **Outline.** *Into*: the "hyper-intelligent toddler" and "untrusted
  contributor" framings; a pitfall (a migration run with production write
  access). *Through*: the five groups, each with its rules
  and one concrete example; the companion framings (two-nines availability,
  gains raise the bar). Then the six domains and the scenarios, presented
  as what the guardrails protect against. *Beyond*: rating scales, the
  assessment template, tailoring the charter.
- **Checkpoints:** sort ten rules into the five groups; multiple choice on
  which of these is a deterministic gate; scenario decision: the agent
  proposes to run a cleanup script against a shared database.
- **Comfort levels:** less: read, sort, rate two scenarios. More: write the
  countermeasures for two scenarios and draft three project-specific rules.
- **Verify:** cross-reference OWASP Top 10 for LLM Applications; have the
  charter read by someone with legal training before the site calls it
  reviewed.

### L2. Sandboxing a coding agent

- **Area:** Coding with agents (Engineering). Could sit in Safety; placed
  here because every exercise needs a terminal.
- **Proposed topic:** agent sandboxing. **Assumes:** the first-session
  lesson.
- **Objectives:** name the six isolation approaches and their trade-offs;
  explain "enforce outside the trust boundary" and give two controls that
  do it; configure an agent so credentials never sit in its settings file;
  run an agent in a hardened container with credentials off by default.
- **Outline.** *Into*: the trace findings (L3 in miniature): three hosts,
  the hidden warmup prompt with the git log in it. *Through*: the
  comparison table; the public hardened container and its threat model;
  the layered containment pattern with public building blocks; secret
  redaction on the way out. *Beyond*: unsupervised mode, the flag with the
  warning in its name, the first-party middle ground, the harness with no
  guardrails at all, and the configuration hygiene checklist.
- **Checkpoints:** `Predict` which hosts are contacted; multiple choice on
  what the warmup prompt contained; sort controls into "inside the harness"
  versus "outside the trust boundary"; scenario decision: the agent needs a
  forge token to open a pull request.
- **Comfort levels:** less: enable the built-in sandbox, apply the hygiene
  checklist, read the trace. More: run the hardened container, trace it
  yourself, add one layer (a proxy allowlist or a review-gate repository).
- **Verify:** redo the trace on a current agent version and a fresh
  checkout; flags, environment variable names, and sandbox options change
  between releases. Decide whether to adapt the Apache-2.0 threat model
  text with attribution or summarize it.

### L3. What does your agent send? (short)

- **Area:** Safety, for everyone. A short rather than a full lesson.
- **Objectives:** explain that an assistant sends more than the visible
  prompt; name two categories of hidden content (environment details,
  recent history), and know that this can be checked.
- **Outline:** the trace as a story, in plain words, with one `Predict`
  and one reflection: what's in your working directory right now that you
  would not want in a prompt?
- **Verify:** the trace itself. Keep the narrative version-neutral.

### L4. The EU AI Act in one lesson

- **Area:** Safety, for everyone.
- **Proposed topic:** regulation. **Assumes:** nothing beyond the concepts
  area.
- **Objectives:** decide whether something is an AI system under the
  Regulation; place a use case in a risk tier; tell provider from
  deployer; name the transparency duties that touch everyday work; know
  where the literacy duty comes from.
- **Outline:** as specified in [`eu-ai-act.md`](./eu-ai-act.md).
- **Checkpoints:** tier sorting for six scenarios; provider-or-deployer for
  three, and one "is this an AI system?" question.
- **Regenerate:** everything from the Regulation and the Commission's material.
  Add a review date to the lesson.

### L5. Connecting an agent to your systems

- **Area:** Customizing agents (Engineering).
- **Proposed topic:** MCP in operation. **Assumes:** the MCP protocol and
  deep-dive material carried over from the fork (Osmani 14 and 16) or the
  site's equivalent.
- **Objectives:** explain delegated identity and why it is preferable to a service
  account; scope a server's capabilities by read, write and "can't"; add
  compensating controls where the server has no write rate limit; write a
  five-rule prompt guardrail block and say what it doesn't guarantee;
  choose between a CLI and an MCP server for one system.
- **Outline.** *Into*: the model proposes forty edits to a wiki; what stops
  it? *Through*: identity principle; capability inventory; bulk-write
  safety; prompt guardrails; residual risks including indirect injection
  and cross-server tool poisoning. *Beyond*: CLI versus MCP as a design
  axis; installation hygiene, and reading good tool descriptions.
- **Checkpoints:** mark which tools in an inventory need
  confirm-before-write; scenario decision on the forty edits; multiple
  choice on which control is preventive versus a safety net.
- **Comfort levels:** less: inventory and mark. More: write the guardrail
  block for a real server and test it against an injected instruction in a
  retrieved document.
- **Verify:** the example server's tool list and limits are a snapshot;
  re-check against its current documentation, or make the inventory
  fictional.

### L6. Which tool, which data

- **Area:** Using agents (Foundations), for knowledge workers.
- **Proposed topic:** choosing and adopting tools. **Assumes:** the
  delegating lesson.
- **Objectives:** place a proposed use of a tool at one of three levels;
  complete a level 1 self-assessment; apply a four-tier data
  classification to a pasting decision; ask a vendor the right eight
  questions, and add a disclosure line to generated content.
- **Outline.** *Into*: the "Can I…?" table as a quiz before teaching.
  *Through*: the four axes and three levels; the two boundaries
  (experimenting ends when real information appears; level 2 needs an
  owner); the level 1 checklist with its reasons; what changes at level 2;
  the data classification tiers, and the plain-language rules. *Beyond*: the
  eight vendor questions; residency versus processing; web search sends a
  derived query, and disclosure.
- **Checkpoints:** assign a level to three tool descriptions, one of which
  is a trap; sort ten data items into the four tiers; multiple choice on
  the web-search leak.
- **Fed by:** `tool-onboarding-tiers.md`, part 2 of `guardrails.md`, the
  knowledge-worker section of `ideas.md`.
- **Verify:** the lesson must teach the learner to look up their own
  tool's retention and region rather than state any vendor's.

### L7. Reviewing what the agent pulled in

- **Area:** Coding with agents (Engineering).
- **Proposed topic:** dependencies and supply chain. **Assumes:** the
  first-session lesson.
- **Objectives:** state the review principles, including "no default
  outcome"; pick which review dimensions apply to a direct dependency, a
  transitive one and a version bump; run the OpenSSF Scorecard checks on a
  package, and decide what to skip in a code review and say why.
- **Outline.** *Into*: the agent added four packages in one afternoon; the
  pull request is green, so now what? *Through*: principles; the six
  dimensions and the applicability table; the questions per dimension; the
  skip list. *Beyond*: the one-page template as an exercise; minimum
  release age and lockfiles as automation, and giving findings back upstream.
- **Checkpoints:** the applicability table as a matching exercise;
  multiple choice on the open-governance definition; scenario decision: a
  small, unmaintained package with one maintainer and no tests, pulled in
  for one function.
- **Comfort levels:** less: fill the template for a well-known package.
  More: run Scorecard, read the code on the critical path, write the
  verdict.
- **Verify:** acknowledge the public third-party review guideline the
  method follows. Scorecard check names change.

## Authoring changes (not lessons)

- **Use-case one-pager and 70/30 model** (`ideas.md`) as the house format
  for Using-agents lessons: the ten sections, with trigger moments and
  example output mandatory.
- **Exercise kinds and template** (`literacy.md`): name "do" and "judge"
  as the two exercise flavors, require at least one of each per course,
  and adopt the two-part exercise text (how to complete, why do this) with
  a closing reflection prompt. The first exercise in every lesson should be
  small and produce something visible.
- **Framings list** (`ideas.md`) as a shared source for lesson
  introductions, so the same image isn't used twice across areas.

## Fold into existing lessons

| Item                                                                         | Target                                                                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Eight-step team workflow, durable plan file, settings as permission boundary | `coding-with-agents/workflow` when it exists                                                    |
| Agent definitions in the repo, no hardcoded model, or permission mode        | `customizing-agents/hooks-permissions` (subagents)                                              |
| Testing stochastic components                                                | `building-agents/evaluation` when it exists                                                     |
| Residency versus processing; agents that are just prompts                    | `using-agents/choosing-tools` when it exists                                                    |
| Saying no as a design outcome                                                | `safety/agent-risk`, human-in-the-loop prose (a pitfall shows a failure, and this is a success) |
| Prompting: teach four techniques, park the rest in a short                   | the Foundations prompting lesson                                                                |
| Public prompt-injection challenges as sources                                | the Safety injection lesson                                                                     |
| Concept syllabus check                                                       | Spec S02 concept lists, not a lesson                                                            |

## Decisions (2026-09-20, #6)

| Item                                         | Decision                                                                                                                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1 Guardrails                                | No lesson. Every charter rule an individual engineer should know is mapped to a topic in #13, and the rules about client agreements or team compliance standards are out of scope. The charter itself isn't published. |
| L2 Sandboxing                                | Write it, in Coding with agents. The area is at the seven-topic cap, so `sandbox` and `trust boundary` join the `first-session` topic (#13). Link and summarize the hardened container's threat model rather than adapt it.                          |
| L3 What does your agent send                 | Folded into #10, generalized from a terminal agent to any assistant.                                                                                                                                                                                 |
| L4 EU AI Act                                 | Write it, low priority, from the Regulation only, with a review date, and flagged as EU-specific on a global site.                                                                                                                                   |
| L5 Connecting an agent                       | Write it. Fits `customizing-agents/mcp` and `connects-tools-safely` as the map stands.                                                                                                                                                               |
| L6 Which tool, which data                    | Folded into #10. "Client" becomes "data you hold for someone else". Only the level 1 self-assessment and the two boundaries carry over; levels 2 and 3 are organizational governance.                                                                |
| L7 Reviewing what the agent pulled in        | Write it. Fits `coding-with-agents/quality` and `screens-for-security` as the map stands.                                                                                                                                                            |
| Use-case one-pager and 70/30 as house format | Rejected. Spec S03 fixes lesson anatomy, and the one-pager is a how-to or reference format. May return if how-to pages are written.                                                                                                                  |
| Exercise kinds and template                  | Adopted in spec S03: small visible artifact, how and why, closing reflection, "do" and "judge" as flavors without a per-course rule.                                                                                                                 |
| Framings list                                | Stays here as a shared source. No process change.                                                                                                                                                                                                    |
| Concept syllabus check                       | Rejected as outside the six areas (#13).                                                                                                                                                                                                             |
| Uptake figures                               | Background only, not quoted as evidence.                                                                                                                                                                                                             |
| Order after release 1                        | #10, then L7, L5, L2, L4. Map work in #13 comes before L2 and L4.                                                                                                                                                                                    |
