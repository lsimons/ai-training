# Bringing an AI tool into an organization: three levels

A proportionate way to decide what controls a new AI tool needs. This is
the backbone of L6 in the [README](./README.md), and the level 1 checklist
is its downloadable exercise.

## The principle

The more sensitive the data, the stronger the controls. Experimenting with
made-up data: keep it simple. Handling personal or mission-critical data:
everything matters. Each level includes everything from the level below.

## Find your level

Judge the tool on four axes: **who can access it**, **confidentiality of
the data**, **integrity of the data** (can the tool change or delete it),
**availability** (does anything depend on the tool staying up).

| Level                       | Data                                                                      | Impact if it breaks or leaks              | Approval                                                          | Time      |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- | --------- |
| **1. Experimenting**        | Dummy, synthetic or public data only                                      | None                                      | Self-service; read the guidelines                                 | Immediate |
| **2. Internal only**        | Internal data; no personal data; no client or production data             | Embarrassing, recoverable                 | Team lead plus a security check                                   | Days      |
| **3. Personal or critical** | Client data, personal data, production access, or something depends on it | Contractual, legal, or operational damage | Full assessment; the data owner's consent; formal risk acceptance | Weeks     |

Two boundaries deserve emphasis:

- **Level 1 ends the moment real information appears.** Using the tool in a
  meeting with a client, or on non-public notes, is no longer experimenting.
- **Moving from level 1 to level 2 requires an owner.** Someone must own the
  tool: patching, vulnerabilities, access, cleanup. No owner, no level 2.

## What each level requires

Condensed from a ten-category matrix.

| Category                    | Level 1                                                                                                                        | Level 2 adds                                                                                                               | Level 3 adds                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Data                        | Dummy or public data only                                                                                                      | Internal data only; teach the boundaries; encryption at rest and in transit                                                | Data owner's approval; classification; minimization; retention limits; an exit plan                                                       |
| Vendor                      | Nothing formal                                                                                                                 | Approved model providers; acceptable residency; vendor is real, alive and maintaining the product                          | Recognized certification (for example SOC 2 Type 2 or ISO 27001); residency commitments verified                                          |
| Approval                    | Self-service                                                                                                                   | Team lead; security check                                                                                                  | Full assessment; formal risk acceptance; data owner's approval                                                                            |
| Access control              | Not required                                                                                                                   | Basic roles; access limited to the team; review every six months; no admin accounts for integrations                       | Single sign-on; strict least privilege; approval for admin access; quarterly review; optionally time-limited grants, separation of duties |
| Integrations                | No production read or write access                                                                                             | Minimum permissions; avoid automation-platform fan-out; backups where write access exists; secrets in a vault              | Each integration reviewed; delegated authentication preferred; read-only preferred; architecture documented; secrets lifecycle managed    |
| Monitoring and logging      | Not required                                                                                                                   | Rate limits; basic usage monitoring                                                                                        | Full audit logs for sensitive actions, stored securely; anomaly monitoring; documented access to logs for incident response               |
| Budget                      | Spending limits on API use                                                                                                     | Rate limits against exhaustion                                                                                             | Same, applied to every operation                                                                                                          |
| Incident response, recovery | Clean up when done                                                                                                             | Quarterly cleanup; documented basic recovery; secrets rotated, including when someone leaves                               | Documented backup and restore; notification procedure for affected parties; tested kill switch; automatic cleanup of abandoned workflows  |
| Change management           | Not required                                                                                                                   | Not required                                                                                                               | Optional: review for all changes, test outside production, rollback plan, announced maintenance                                           |
| Documentation               | What you are testing; share what you learn                                                                                     | An architecture sketch of how the tool connects                                                                            | Clear usage guidelines; an exit strategy                                                                                                  |
| **What you may skip**       | Formal approvals, security review, audit logging, access control, formal documentation, incident procedures, change management | Full assessment, detailed audit logs, data owner approval, incident procedures, hardened access control, change management | Nothing silently. Whatever is skipped is an **explicitly accepted risk**, written down                                                    |

The "what you may skip" row is the teaching device. Most frameworks only
list obligations; this one teaches proportionality by saying what not to
bother with, and where the line is where "skip" turns into "accept in
writing".

## Level 1 self-assessment

Five to ten minutes, no approval needed, keep a copy for the team. Every
requirement carries its reason.

| Requirement                                                                                                  | Why                                                                        |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| I will only use dummy, synthetic or public data: no real company data, no client data, no production systems | Real data, even internal, needs a proper assessment and can be exposed     |
| I have checked that no real names, email addresses, IP addresses or production data are involved             | "Anonymized" real data can often be re-identified                          |
| The tool has no access to production systems, read or write                                                  | Production access from an experimental tool can cause outages or data loss |
| The tool has no access to real company systems or data stores                                                | Even read access to real systems exposes information                       |
| I have set spending limits where the tool bills by use                                                       | Experiments left running rack up bills                                     |
| I will delete accounts, data and integrations when the experiment ends                                       | Forgotten experimental accounts become vulnerabilities over time           |
| I have written down what I am testing and will share what I learn                                            | Others learn from it and avoid duplicate work                              |
| I will report security concerns or incidents to the security team                                            | Fast reporting limits damage                                               |

## Level 2 checklist, highlights

The full template has about twenty-five items in eight sections, each with a
rationale. The ones worth teaching:

- Train the team on data boundaries **before** they start using the tool.
- Verify where data is stored and processed; jurisdiction matters.
- The vendor is a real, active company with a track record, and the product
  is actively maintained. Defunct vendors stop patching and may sell the
  data.
- The tool can be restricted to an approved list of model providers.
- No shared accounts; review access every six months; remove leavers.
- No admin or service accounts for integrations. Use delegated
  authentication so the tool acts with the user's own permissions; stored
  admin credentials are hard to track and compromised without detection.
- Do not chain the tool to further third-party platforms, including MCP
  servers, without a separate assessment. Each one widens the attack
  surface.
- If the tool can write or delete, confirm tested backups exist.
- Secrets live in a vault, not in code or documents, and are rotated on a
  schedule and whenever someone with access leaves.
- Rate limits and usage caps against runaway consumption; basic usage
  monitoring, because a spike may mean compromise, misconfiguration or
  misuse.
- Audit logs are available to the team.
- Quarterly cleanup of unused workflows, projects and users.
- A basic recovery procedure, written down.
- A simple architecture diagram of how the tool connects to other systems.

## Notes for the lesson author

- L6 is a Foundations lesson. Teach the levels and the L1 checklist in
  full; show level 2 as "what changes when real data appears"; describe
  level 3 in one paragraph and point engineers to L1 and L5.
- Checkpoint: three short tool descriptions, learner assigns a level.
  Include one that looks like level 1 but is not, because a client is in
  the meeting.
- Exercise: fill in the level 1 checklist for a tool the learner actually
  wants to try.
- Pair with the "Can I…?" table and the data classification tiers in
  [`ideas.md`](./ideas.md).
