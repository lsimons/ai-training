# Guardrails for AI-assisted engineering

Twenty-one rules in five groups, written in "we" voice so a team can copy
the charter, tailor it and agree it with a client before work starts. The
heading structure is the lesson skeleton for L1 in the [README](./README.md).
Part 2 is the everyday version for people who aren't engineers.

## Part 1: the charter

These guardrails govern the use of AI tools in the engineering process
(coding, testing, reviewing, documenting) where the result matters: systems
whose failure has real consequences for real people. They assume the team
delivers for a client, but apply equally to a team working on its own
systems.

### Acting responsibly

1. Only people with the domain knowledge and judgment to evaluate the result
   direct the AI and judge its output.
2. We pick the model that fits the task, weighing capability against cost;
   the most capable model isn't the default for everything.
3. Source code goes only to AI services that contractually retain none of
   it.
4. Other sensitive information, in particular personal data of the client's
   people or customers, doesn't go to external AI services, beyond what a
   user needs to log in.
5. Data residency requirements are checked per provider before we use it.
6. We comply with applicable law and regulation, including the EU AI Act.
7. The use and scope of AI on a project is agreed with the client up front.

### Delivering quality

1. The same engineering standards apply whether work is AI-assisted or not.
2. AI-produced work is verified with deterministic quality gates (tests,
   type checks, linters, builds, reproducible pipelines), never only with
   another probabilistic tool.
3. We keep a complete, auditable record of how production changes came
   about: specifications, review records, deliverables.
4. Audit trails meet the compliance standards agreed for the project (for
   example ISO 27001 or SOC 2).

### Keeping humans in the loop

1. We take full accountability for everything we deliver, however it was
   produced.
2. Engineers make the final decisions. AI may propose; humans review and
   decide.

### Governing our AI tooling

1. Only tools that have passed a risk assessment are used on a project.
2. AI tooling is kept separate from production systems, and deployments go
   through the normal secure delivery pipeline. Read access may be granted;
   write access isn't.
3. Intellectual property created with AI is handled as agreed with the
   client; it doesn't stay with the AI provider.
4. Every use of AI is documented in the project documentation.
5. The delivery process keeps working if an AI tool becomes unavailable.

### Applying least privilege

1. AI tools get only the access to data and environments that the project
   needs.
2. The same access control policy applies to AI tools as to human and
   service accounts: defined and documented per project.
3. AI tool permissions that are no longer needed are reviewed and removed
   at least quarterly.

### Companion framings

These came with the charter's onboarding material and belong in the lesson
prose, not in the rules:

- Stop when uncertain, fatigued or under pressure; stay critical of AI
  output. Accountability doesn't transfer to the tool.
- Hosted AI tools run at roughly two-nines availability. That isn't
  mission-critical grade. Plan for the tool being down.
- Productivity gains raise the bar, not the ceiling. Treat them as either an
  accepted dependency or a risk to mitigate; don't promise them onward.
- Broad, long-lived tokens in an agent's hands create an unacceptable blast
  radius. Scope tokens tightly in both permission and duration.
- Treat coding agents as untrusted contributors with unusually powerful
  tools, and manage them accordingly.

## Part 2: plain-language rules for everyone

Vendor-specific facts (where data is processed, retention periods, which
search engine is used) are deliberately absent; the lesson should teach the
learner to look those facts up for their own tool.

- **Know where your data goes.** Every prompt and response is processed by
  the provider, in the region the provider chooses. Find out which region,
  how long conversations are kept, and whether the contract rules out
  training on your data. Consumer subscriptions often do train on it;
  business tiers usually don't.
- **Never put personal data in.** No identity numbers, identity documents,
  medical or HR file content, financial records with account numbers. A
  useful test: nothing you would not put in an email to a colleague.
- **Never paste secrets.** No passwords, API keys, tokens, or certificates.
  Use placeholders instead. A leaked secret is an incident, whoever leaked
  it.
- **Other people's data needs their permission.** Client code, reports and
  knowledge may not be shared with a subprocessor unless the contract allows
  it or the client has agreed. Ask first.
- **You own the output.** The model is confident when it is wrong. Review
  everything before it reaches production or another person. You are
  accountable for the result, not the tool.
- **A chat tool isn't storage.** Assume no backup and no restore. Copy out
  what you need to keep.
- **Web search leaks part of your prompt.** When the assistant searches the
  web, a derived query goes to a search provider with its own retention
  policy, separate from the model provider's. Keep sensitive detail out of
  prompts that trigger search, or turn search off.
- **Private matters stay private.** Many people use AI for medical, mental
  health or relationship questions. That content is hard to get back. Be
  aware whom you are telling.

### "Can I…?"

A three-state table is more memorable than prose. Generic version:

| Question                                         | Answer                                     |
| ------------------------------------------------ | ------------------------------------------ |
| Review our own code with it?                     | Yes                                        |
| Paste our own source code?                       | Yes                                        |
| Discuss architecture and design?                 | Yes                                        |
| Use colleagues' names and email addresses?       | Yes, normal business use                   |
| Paste a client's source code?                    | Only with the client's approval            |
| Share a client's infrastructure details?         | Only with the client's approval            |
| Use web search for a sensitive topic?            | Avoid; the search provider keeps the query |
| Paste API keys or passwords?                     | Never                                      |
| Upload identity numbers, HR, or medical records? | Never                                      |
| Trust the output in production without review?   | Never                                      |

### API key hygiene

For anyone with direct API access:

- A key is personal and tied to a spending limit. Treat it like a password.
- Never commit a key to source control. Never share a key; everyone gets
  their own.
- Keep it in a password manager or an environment variable, never in plain
  text in a file or document.
- If you suspect a key is compromised, revoke it first and tell people
  second.
- Don't route another party's workload through a shared account: it
  breaks data separation, billing attribution, and ownership of liability.

### Disclosure

When AI generated the content, say so. A one-line notice is enough:
"Contains AI-generated content, which may be incorrect." Pair this with the
transparency obligations in [`eu-ai-act.md`](./eu-ai-act.md) and with
content credentials (C2PA) for generated images.

## Notes for the lesson author

- The charter is a template. The lesson should have the learner tailor it,
  not memorize it: which rules would their team drop, tighten, or add?
- A real organization should have legal review of its own version. Say so.
- The sample "Watch Out" narrative for L1: a team lets the agent run a
  migration with a service account that has production write access; the
  migration succeeds and deletes a column nobody meant to drop. Ask which
  three rules would have prevented it.
