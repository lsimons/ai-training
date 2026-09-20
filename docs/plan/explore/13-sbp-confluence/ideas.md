# Ideas worth saving

Framings, practices, templates and small concepts, grouped by where they
land. Each item names the area (1 concepts, 2 safety, 3 using agents, 4
coding with agents, 5 customizing agents, 6 building agents) and whether it
is a lesson ingredient or an authoring pattern. Evaluate each critically
before adopting it; none is a decision.

## Framings for lesson introductions

- **The hyper-intelligent toddler** (2, 3). Highly capable, no judgment.
  Protect it from itself, the way you would protect a toddler near a
  staircase. Best single image for why sandboxing and review exist.
- **An untrusted contributor with unusually powerful tools** (2, 4). Manage
  a coding agent the way you would manage a brilliant stranger with root.
- **Productivity gains raise the bar, not the ceiling** (2, 4). Once the
  gain exists, it becomes expected; treat it as a dependency to manage or a
  risk to mitigate, not a bonus to promise onward.
- **Not just a tool, a tool wielder** (1, 3). The thing that changed is
  that the software now uses other software.
- **Most-likely, not correct** (1). Generative models produce the most
  probable continuation, not a verified answer, and not the same one twice.
- **Vibe coding is off-limits where the result matters** (4). Letting a
  model produce code unchecked, without review or accountability, is not an
  engineering practice.
- **Shadow AI** (2). When governed tools are absent or bad, people use
  ungoverned ones. Minimum viable governance beats no governance; the safe
  path has to be the easy path.
- **Try it this week, then keep re-trying** (3). Half an hour with a
  colleague who already uses the tool, on something low-risk. Capabilities
  move on a roughly two-month cycle; what failed six months ago may work
  now.
- **Saying no is a valid design outcome** (2, 6). A fully reasoned, costed
  decision to build nothing for a sensitive document set, because no
  option could prove who had access. "Better than leaking data." The
  argument for single-sign-on groups: they have audit logs, so you can
  prove the set of people who ever had access. A rare case study in
  declining.

## Practices for coding with agents (area 4, some 5)

- **An eight-step team workflow**: requirement in the tracker (with a
  design record where needed) → branch → plan, written to a durable
  `docs/<feature>.md` → execute → commit → merge request → review → merge
  and deploy. The durable plan file is the concrete, teachable habit.
- **Memory in layers**: a root instructions file plus modular rule files
  that load only when relevant.
- **The project settings file is the permission boundary.** Decide what
  power the agent has per project, in the repository, reviewed like code.
- **Prefer the forge's CLI over an MCP server** for git hosting; see
  [`mcp-security.md`](./mcp-security.md) section 6.
- **Open the agent in the service directory**, not the repository root.
- **Agent definitions live in the repository**; do not hardcode tools,
  model or permission mode in them.
- **Plans belong in git**, not in the issue tracker the agent cannot read.
- **Keep plans abstract until implementation starts**; then write a
  detailed plan per task and assign focused agents.
- **Coherence engineering** (4): the artifacts of a system (specification,
  code, tests, documentation) should agree, and an agent can measure and
  improve their coherence. The teachable move is "code and tests should
  agree; now extend that to every artifact".
- **The workshop shape** for customizing agents (5): a short concept talk,
  then build your own skill, then apply it to a real bottleneck in your
  own workflow.

## Quality and evaluation (areas 4, 6)

- **No change for the sake of change.** Every refactor addresses a concrete
  technical concern or a user need.
- **A bad-smell list** for AI-heavy codebases: untestable code, code that
  cannot be extended, inflexible implementations, deprecated or unused
  code, design decisions made for a proof of concept and never revisited,
  flaky tests.
- **Remove barriers to testing** by documenting the standard and providing
  one worked example of every kind of test.
- **Testing stochastic components** deserves its own phase: evaluations for
  a summarizer before its output is stored; question-answer pairs over a
  known test corpus; a check on generated documentation; a comparison of
  embedding choices. Optionally, public coding benchmarks or hand-picked
  exercises to compare agents. This is the bridge from classical testing
  to evals.
- **Deterministic gates for probabilistic output**: tests, type checks,
  linters and builds decide; a second model only advises.

## Reviewing dependencies the agent pulled in (area 4, lesson L7)

A review method for external components, in the tradition of the public
third-party review guidelines listed in [`references.md`](./references.md).
Agents add dependencies fast and confidently; this is the counterweight.

Principles:

- **Effort proportional to risk.** Find the biggest risks the external code
  introduces and spend the review there. Compare with the risk of writing
  it yourself.
- **Think about future cost.** A convenient shortcut today can be a big
  problem later; solving a general class of problems once pays repeatedly.
- **Be wary of surprises.** A confusing piece of code or API is paid for
  many times over.
- **No default outcome.** The same principles govern "use the library" and
  "write it ourselves".
- **Give back.** Report genuine findings upstream, for the parts you use.
- **Share assessments** so the next team does not redo them.

Six review dimensions, with which apply when:

| Change                    | Architecture | Quality | Governance and support | Security | Code | License            |
| ------------------------- | ------------ | ------- | ---------------------- | -------- | ---- | ------------------ |
| New direct dependency     | yes          | yes     | yes                    | yes      | yes  | yes                |
| New transitive dependency | no           | yes     | yes                    | yes      | yes  | yes                |
| Version bump              | no           | no      | no                     | yes      | yes  | if license changed |

Questions per dimension:

- *Architecture*: do we already have something similar? How many
  sub-dependencies, how large? Is the review cost disproportionate to the
  benefit? Does the API make sense here (async, platform assumptions)? Is
  it documented; are there undocumented invariants or unsafe code?
- *Quality*: would we fork and maintain it if abandoned? Are there
  meaningful tests, passing in CI? Duplication and complexity as red flags.
- *Governance and support*: multiple maintainers, known authors, many
  reverse dependencies, recent activity, foundation backing or one vendor.
  Crisp definition: a project has open governance when it is clear how
  decisions are made; not when one company leads it or contributors sign
  their copyright away.
- *Security*: the OpenSSF Scorecard checks (known vulnerabilities, a
  dependency-update tool, maintained, no binary artifacts, branch
  protection, no dangerous workflows, code review, token permissions,
  signed releases).
- *Code*: find the risks (code needing specialist expertise such as
  concurrency, cryptography, network protocols, unsafe blocks; code on the
  critical path; code that is too complicated) and **skip what is
  irrelevant**: style, unchanged already-reviewed code, individual test
  cases, platform-specific code for platforms you will never use,
  non-API documentation. The skip list is what makes the method affordable.
- *License*: what does it require (attribution, notice reproduction, share
  alike) and does it fit the project's policy.

A one-page template (metadata, changelog with verdict, one table per
dimension) makes a good graded exercise: run it on a dependency the agent
just added.

## For knowledge workers (area 3, some 2)

### The use-case one-pager (authoring pattern)

A ten-section template for describing one way of using an AI assistant. It
is about 95% generic and is proposed as the house format for Using-agents
lessons.

01. **Title**: specific.
02. **Goal**: the outcome in one or two sentences, not the process.
03. **Trigger moments**: real signals that this is the moment to use it,
    such as joining a project midway, preparing for a check-in, ramping up
    after leave. Triggers make adoption intuitive.
04. **The 70/30 model**: who does what (below).
05. **Steps**: two to five, no more.
06. **Starter prompts**: three to six, copy-paste ready; optional advanced
    ones.
07. **Example output**: show what good looks like; it lowers fear and aligns
    expectations.
08. **Pitfalls and tips**: start broad then go specific; if the answer seems
    off, name the sources; keep confidential detail out of anything shared
    externally.
09. **Variants** per department, same structure, different wording.
10. **Indicator**: expected time saved, frequency, kind of value.

The 70/30 model:

| The assistant's 70% | Your 30%                |
| ------------------- | ----------------------- |
| Searches sources    | Checks accuracy         |
| Summarizes          | Adjusts nuance          |
| Drafts              | Finalizes the message   |
| Suggests next steps | Decides what to execute |

It normalizes expectations and takes the "AI perfection" anxiety out of the
room.

### Eight questions to ask any AI vendor

From a transparency Q&A written for one office assistant, with the answers
removed; the questions generalize.

1. What data is shared with you when I use the AI features, and does the
   AI bypass any of my existing permissions?
2. What is stored, for how long, and encrypted how?
3. Who else receives it (subprocessors, model vendors), and can I turn them
   off?
4. Is my data used to train models? Say where that is written.
5. Which certifications cover the AI features specifically, and in which
   role do you act (processor or controller)?
6. How is intellectual property protected: indemnity, citations, content
   credentials on generated media?
7. How do you reduce over-reliance on wrong answers (grounding in my own
   data, citations, confidence signals)?
8. How do you detect and handle prompt injection, direct and indirect?

Concepts the answers introduce, worth glossary entries (area 1): grounding,
user versus cross-prompt injection, content credentials (C2PA).

### A four-tier data classification

What may I paste in? A four-tier model:

| Tier                  | Meaning                                                                                                  | Typical AI-tool rule           |
| --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Public                | Anyone may see it                                                                                        | Fine                           |
| Internal confidential | Ours; not for disclosure; we are the data controller                                                     | Approved tools only            |
| Client-related        | Metadata we hold to serve a client; may include personal data of their people; joint controller at least | Approved tools, with care      |
| Client data           | Part of the client's own product or service; we are a processor                                          | Only with the client's consent |

The controller/processor distinction is the part people miss; keep it.

### Small concepts (area 1, 2)

- **Residency at rest is not processing location.** A vendor promising EU
  storage may still process elsewhere. Ask both questions.
- **Web grounding sends a derived query, not the prompt.** Good explainer
  of what a search-enabled assistant does and why sensitive prompts still
  leak in part.
- **"Agents" that are just prompts.** Some vendors' agents are saved
  prompts with no tools; they cannot act outside the model.
- **Your tool's cost display may be wrong.** Verify spend at the gateway or
  provider, not in the client's UI.
- **Enterprise tiers sell governance.** Audit logs, single sign-on
  provisioning, retention control. Each one you lack needs a compensating
  control.
- **A license filter for model output.** Some assistants can block
  suggestions that match public code; without it there is a chance of
  reproducing copyleft code verbatim. Legally and ethically unsettled;
  worth one honest paragraph.
- **Copyleft aside, output disclosure is the norm to teach.** One line
  saying content is AI-generated.

## Organizational patterns (leaders; not a current lesson)

- **Personas for an AI security programme**: user, implementor, automator,
  and the person responsible for a client team. Each needs different
  guidance.
- **Survey, workshop, guide, rollout**: build practical guidance together
  rather than write policy in isolation. "Workshops, not lectures."
- **Roles and non-roles** for an internal AI platform: knowledge worker,
  engineer (a specialization), client-facing director, AI engineer,
  platform engineer, security engineer, innovation specialist; and
  explicitly who it is *not* for, including the attacker, with the honest
  note that injection into knowledge bases was not yet guarded against.
  Saying who a system is not for is a design skill.
- **An adoption ladder** from experiment to service: discovery → try it →
  ask about policy → level 1 → level 2 with an operations team taking joint
  ownership → validation → handover → level 3. A readiness checklist in
  three columns: strategic clarity (problem, plan, decision authority),
  tactical (pricing model, rollout, communication, training, metrics),
  operational (cost monitoring, governance cleared, access management,
  support).
- **Rollout lessons**: many channels create awareness fast; let a few teams
  see real benefit before scaling; plan the handover before the pilot
  ends, because it will not plan itself.

## Concept syllabus check (area 1, 6)

A concept checklist to compare against S02: attention and the key/value cache;
positional embeddings; architecture patterns (prompting, retrieval, agents,
multimodal, fine-tuning); evaluation-driven development and re-ranking;
retrieval in depth (grounding; chunking by fixed size, overlap, recursion,
document, semantics or agent; extraction; vector stores and semantic
search; embedding models versus generative models; cosine, dot product and
Euclidean distance; graph-shaped retrieval); problem framing (what is and
is not an AI-shaped problem; human versus model performance). Use it as a
checklist against the S02 concept lists.
