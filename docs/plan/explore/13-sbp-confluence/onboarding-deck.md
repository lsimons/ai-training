# Ideas from an engineering onboarding day on agentic engineering

A one-day onboarding deck (about eighty slides) and its ten-slide Claude Code
handout. Most of the content repeats the wiki material already captured in
this directory: the guardrails charter, the hyper-intelligent toddler, the
three prerequisites for value, the prompting technique list, the EU AI Act
outline and the maturity ladder. What follows is only what the decks add.
Company strategy, adoption figures, customer cases and the schedule are left
out.

## Framings (areas 2 and 4)

- **Capability outruns reliability.** Model capability grows many times over
  each year; reliability doesn't keep pace, and the mistakes are new kinds of
  mistakes. Teams can suddenly produce far more software than their quality
  controls were built to check. The lesson for area 4: when throughput
  jumps, review and verification are the bottleneck, and they must be
  redesigned, not just sped up. Pairs with "deterministic gates for
  probabilistic output" in [`guardrails.md`](./guardrails.md).
- **Time to value is a curve, not a step.** Individual adoption of coding
  agents tends to move through phases: autocomplete-style use first, then
  delegating whole tasks, then running more than one agent at once. Gains are
  small for months and then large; spend rises with them. Teach the shape,
  not any figure, and cite the DORA report on the return on AI-assisted
  development for the evidence base. Sets expectations for learners who try
  an agent once and see nothing.
- **AI literacy has three verbs.** Understanding what AI is and how it works
  at a conceptual level; engaging with it in everyday work; evaluating its
  output and wider effects critically. A clean framing for the Foundations
  course introduction. Check whether it derives from a public literacy
  framework before attributing it.
- **It is the people, actually.** Working at agent speed is tiring; people
  report trouble switching off. Adoption has to be sustainable: give teams
  the tools and the time to learn them properly, and don't promise the
  productivity gains onward until they're real and lasting. Belongs next
  to "productivity gains raise the bar, not the ceiling".
- **Data hygiene is a prerequisite.** Assistants grounded in your own data
  are only as good as that data; the first step is to remove the stale
  material and set rules to keep stores clean. Knowledge-worker material
  for area 3, and a plausible first "do" exercise: ask the assistant to
  help you plan the cleanup.
- **A reflective opener.** Before any content: how do you see AI, how do
  you relate to it? The deck ran it as a wordless warm-up. Fits the
  "understand, reflective" exercise type in [`literacy.md`](./literacy.md).

## A controls progression (area 2, engineers)

The deck's maturity ladder is left out as such, but the "what needs to be in
place" list behind it is a generic progression of engineering controls
worth keeping as a checklist, unbranded and ungraded:

1. Approved tooling only; no client data in public models; AI literacy for
   everyone; responsible-AI requirements written down.
2. A human reviews all output; static analysis and tests collect baseline
   evidence; security guardrails in place.
3. Spec-driven development; automated test validation; guarded deploy
   pipelines; identity and permissions enforced for agents; audit trails.
4. Independent inspection from outside the team; per-agent identity;
   observability and monitoring of all AI usage; architecture hardened for
   resilience.
5. External validation; transparency and a way to contest outcomes;
   sector-specific compliance.

Named standards along the way, for the references list: ISO/IEC 42001 for
AI management, ISO/IEC 15026 for assurance cases, IEC 62443, and IEC 61508
for security- and safety-critical systems.

## A syllabus for coding with agents (areas 4 and 5)

The deck's list of hands-on topics for a Claude Code training block. Use it
as a checklist against the S02 topics for both Engineering areas:

- Installation, sandboxing, dev containers
- Context management
- Spec-driven development (the deck used OpenSpec)
- The project instructions file
- Skills
- MCP and MCP servers
- Orchestration with agent teams
- Automated linting, testing, checks, and hooks
- Pull-request automation and automated review
- Model choice and reasoning effort
- Prompting, review prompting, adversarial prompting

The last item, adversarial prompting of one's own agent, has no home in the
current plan and deserves one.

## Exercises (do and judge)

From the prompting block, run in pairs for about thirty minutes each, with
the technique fixed and the prompt free:

- **Self-consistency for code.** Generate error-handling code three or four
  times, compare the answers, and keep the consistent core. *(do)*
- **Tree of thoughts for a design choice.** Explore algorithm optimizations,
  or compare IT strategies and their trade-offs by branching and pruning
  reasoning paths. *(judge)*
- **Role prompts.** Write role prompts for three roles or tasks and refine
  them until the output changes in the way you intended. *(do)*

From the handout, "beyond the basics":

- Read your project's instructions file and ask the agent to improve it;
  judge the diff. *(judge)*
- Set up one MCP server for yourself (documentation, issue tracker or
  infrastructure), then read its tool descriptions. *(do)*
- Try a published skill that interrogates your plan before you build
  (a "grill me" style skill), then write a skill for your current project.
  *(do)*
- **Build a multi-agent system** as the stretch exercise for a day. *(do,
  more comfortable)*

The deck also taught two techniques not in the usual four: **negative
prompting** (say what to avoid) and **anchor prompting** (a fixed template
the answer must fill). Cheap to teach alongside few-shot.

## Public resources

- *Say What You See*, a Google Arts & Culture experiment: guess the prompt
  behind an image, in levels. A five-minute warm-up for the concepts
  course, in the same class as the prompt-injection games in
  `literacy.md`.
- DORA, *The ROI of AI-assisted Software Development*.
- OpenSpec, a spec-driven development workflow for coding agents.
- The "grill me" skill at `aihero.dev`, as an example of a skill that
  questions the user rather than producing output.
- The 1956 disk-drive anecdote (five megabytes for the price of a car) as
  color for the "why now" story: knowledge digitized, storage cheap,
  compute fast, then the 2017 attention paper.

## Verdict

Nothing here changes the lesson list in the [README](./README.md). Fold the
framings into L1 and the Foundations introductions, add the syllabus check
and the exercises to `ideas.md` or `literacy.md` when those are acted on,
and add the public resources to `references.md`.
