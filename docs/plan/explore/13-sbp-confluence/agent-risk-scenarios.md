# Agent risk scenarios

A lightweight method for assessing any AI tool before connecting it to
systems or data. The scenarios are the checkpoint material for L1 in the
[README](./README.md), and the rating scales and template are its exercise.

The stance to teach with it: good enough to get started, improve as you
learn, move fast while being responsible.

## Six domains, one question each

| Domain               | Question                                |
| -------------------- | --------------------------------------- |
| Data leakage         | Where does data go and who can see it?  |
| Integration security | What other systems connect, and how?    |
| Access control       | Who can do what?                        |
| Platform trust       | Can we rely on this tool for real work? |
| Operational security | What happens when things go wrong?      |
| Lifecycle management | How do we keep things clean over time?  |

Platform trust has three layers, and each needs a separate judgment: the
tool itself, the vendor behind it, and the second-order vendor whose model
the tool calls. A vendor question later added a seventh concern: what happens to
the data if the vendor is acquired or fails.

## Fourteen scenarios

Each scenario names a failure and typical countermeasures. Read them as the
failure modes of a tool-using agent, because most aren't specific to any
product.

### Data leakage

- **1. Data sent to an external model provider that shouldn't have it.**
  The tool forwards company or client data to a model service that the
  contracts don't cover. Countermeasures: limit who may add AI
  integrations; keep an approved list of providers; require vetting before
  a new provider is enabled; in some contexts block external models
  entirely.
- **2. Fan-out through an automation platform.** The tool connects to a
  workflow-automation service that itself connects to hundreds of
  downstream services, none vetted. Countermeasures: as above, with extra
  scrutiny for platforms that connect to many services.
- **3. Files kept as input or memory.** Uploaded files and memory stores can
  leak outside the organization or between users of the same platform.
  Countermeasures: teach what's safe to upload; understand the platform's
  isolation model, and clean up old files.
- **4. Third-party data pulled in through connectors.** Someone connects the
  tool to a wiki or document store that holds a client's data; the client
  never agreed to this processor. Countermeasures: teach what may be
  processed; require the data owner's approval before connecting their
  systems, and put this in onboarding.
- **5. Cross-context mixing.** Confidential data becomes input to a public
  query or is mixed with data from another security context.
  Countermeasures: a clear data classification and training on safe
  handling.

### Integration security

- **6. Excessive permissions.** The tool's integrations have permissions
  ordinary users don't have, and those can be abused by mistake, through
  prompt injection, or by a bug. Countermeasures: review every
  integration; avoid admin-level accounts; prefer delegated authentication
  so the user's own permissions apply, and ship safe default
  configurations.
- **7. Destructive actions at machine speed.** The tool can act destructively
  across every connected system, quickly. Countermeasures: connect only
  systems with tested, restorable backups; require approval for write
  permissions, and make it safe to ask "is this a bad idea?".
- **8. Resource exhaustion.** One agent running wild burns through all
  tokens, storage or API quota, or effectively denies service to an
  integrated system. Countermeasures: spending and rate limits per
  integration, sensible defaults, and usage monitoring.

### Access control

- **09. Admin exposure.** Platform administrators on your side and the vendor's
  can see everything every project processes. Countermeasures:
  train admins on their responsibilities; control and periodically review
  who is admin; approval flows for admin access; minimize permissions;
  accept the remaining risk explicitly.
- **10. Excessive user permissions.** Ordinary users see data they shouldn't.
  Countermeasures: as above, plus proper role-based access control.
- **11. Repudiation.** Someone acts through the tool and later denies it, and
  no log can settle it. Countermeasures: full audit logs of actions the
  platform performs, stored securely, focused on the integrations that
  matter (document stores, issue trackers) rather than on every model
  query.

### Platform trust

- **12. Unsuitable platform.** The platform can't meet the standards promised
  to clients for non-public information. Countermeasures: a vendor
  assessment before mission-critical use; check certifications and
  security documentation; document what the platform may and may not be
  used for.
- **13. Reliability for critical workflows.** The platform is down, or the
  model is wrong, in a workflow that matters. Countermeasures: include
  reliability in the assessment; teach appropriate use cases; set clear
  expectations of what AI can be trusted for.

### Operational security and lifecycle

- **14. Platform compromise.** An attacker takes the platform and inherits
  every integration with one or more users' permissions. Countermeasures:
  keep the estate small by cleaning up; have a tested kill switch;
  accept that some risk remains.
- **15. Abandoned workflows.** Old workflows keep collecting data nobody
  needs, widening the blast radius of a breach. Countermeasures: a
  lifecycle procedure; owners review their workflows on a schedule;
  automatic reminders or cleanup.

(Fifteen items in six domains. Merge or split as the lesson needs.)

## Rating scales

**Impact (1-5)**

1. Minimal: minor inconvenience.
2. Low: limited data exposure or operational impact.
3. Medium: moderate exposure or business disruption.
4. High: a large data breach or client impact.
5. Critical: severe breach, legal consequences, or major business failure.

**Likelihood (1-5)**

1. Rare: unlikely in practice.
2. Unlikely: could happen, not expected.
3. Possible: might happen occasionally.
4. Likely: probably happens at some point.
5. Almost certain: happens.

## Assessment template

Basic information: tool name, date, participants, use case, a configuration
diagram. Then one row per applicable scenario:

| ID  | Scenario | Countermeasures | Impact (1-5) | Likelihood (1-5) | Notes |
| --- | -------- | --------------- | ------------ | ---------------- | ----- |

Then actions required before go-live (guidelines and training, allow lists
for models and integrations, role-based access, logging and monitoring,
sign-off on remaining risks), and a decision: approved, approved with
conditions, or not approved, with conditions, approver, and date.

## Notes for the lesson author

- Cross-reference the OWASP Top 10 for LLM Applications; excessive agency,
  prompt injection and supply chain map directly onto these scenarios.
- Checkpoint idea: show a short tool description and ask which three
  scenarios apply most (sorting or multi-choice).
- Exercise idea: rate two scenarios for one tool on both scales, then
  compare with a worked answer. Less comfortable gets the scenario list,
  and more comfortable also writes the countermeasures.
- The three-layer trust model is under-taught. Give it its own paragraph
  and a concept entry: a chat tool built on a gateway built on a model
  vendor means three privacy policies, three retention periods, three
  jurisdictions.
