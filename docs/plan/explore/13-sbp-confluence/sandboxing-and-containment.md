# Sandboxing and containment for coding agents

Why a coding agent needs containment, what the options are, and a layered
pattern built from public tools. Feeds L2 and L3 in the
[README](./README.md).

## 1. What does your agent actually send?

A trace of a popular terminal coding agent (a 2.0.x release, autumn 2025)
on a laptop with telemetry switched off and a custom API endpoint
configured. Method: a host firewall that records connections, packet
capture into a protocol analyzer, then a local TLS-intercepting proxy to
read the requests, then a block test.

Findings:

- DNS lookups went to exactly three hosts: the npm registry, the vendor's
  API host, and the configured endpoint.
- Even with the auto-updater disabled, the agent shelled out to the package
  manager to check the current published version, hitting the registry.
- Even with telemetry disabled, one small authenticated call went to the
  vendor's API host and returned an empty object.
- On startup the agent fired a "warmup" request to the configured endpoint.
  Its system prompt contained the working directory, platform, OS version,
  date and model, and the **current git branch and the last five commit
  subjects**. None of this is visible in the UI.
- Blocking the registry and the vendor host at the firewall: the agent
  started and worked without visible errors.
- One ordinary question produced a few calls to the configured endpoint
  and nothing else.

Conclusion as written: not great that the tool phones home on startup, but
nothing important leaks beyond that it is being used. The lesson
is the method and the mindset: **you can find out, and you should.**

Teaching uses: a `Predict` before the findings ("which hosts will it
contact?"), a checkpoint on what the hidden system prompt contained, and
the motivation for everything below. If the site reproduces the trace, do
it on a fresh checkout with no real history and redact every credential.

## 2. Ways to isolate an agent

| Approach                              | For                                                                                                 | Against                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| The agent's built-in sandbox          | Easy to start                                                                                       | Limited control over what's enforced                                  |
| Hardened container (docker or podman) | Full control; one container per project; same setup for the team; can hold credentials in a sidecar | Setup effort                                                          |
| Hardened devcontainer                 | Fits the editor workflow                                                                            | Docker-in-docker is awkward; easy to leave unmaintained               |
| Hardened virtual machine              | Set up once, use for everything; easy to see and monitor; strong isolation                          | Projects share one VM and can bleed into each other; VM upkeep; heavy |
| Vendor-hosted agent in the cloud      | Easy to start; nothing on your machine                                                              | Preview-grade; limited control; your code leaves your machine         |
| No isolation, permission prompts only | Nothing to set up                                                                                   | You are the sandbox                                                   |

The line to end the table with: even in a locked-down sandbox you should be
careful.

A public, Apache-2.0 **hardened container** for one popular agent exists
(see [`references.md`](./references.md)). Its README is a good worked
example because it has a written threat model:

- Credentials are off by default; each cloud or forge credential is an
  explicit opt-in flag.
- A per-session **auth proxy sidecar** holds the forge token, so the agent
  container never sees it; what remains exposed is live capability for the
  session's duration.
- Flags for an ephemeral session (no persisted state) and read-only
  workspaces, combined for reviewing untrusted repositories.
- The threat model spells out what's protected (host filesystem outside
  the workspaces, long-lived keys), what's exposed per session (the
  workspaces, opted-in short-lived tokens), what's exposed across sessions
  (persisted OAuth state, shell and conversation history), and the
  **runtime code-fetch risk**: `npx`, `uvx`, `pnpm dlx` and toolchain
  installers fetch and run arbitrary code on first use.
- Its incident advice: if a session is compromised, assume exfiltration
  already happened, then rotate every credential that was opted in.
- Kernel capabilities dropped at runtime; image vulnerability scanning in
  CI.

## 3. A layered containment pattern

The layers below come from different vendors, and none documents them
together. Teach the pattern with public building blocks.

| Layer                                      | What it does                                                                                                                                                                                                                                                                                                                          | Public building blocks                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Isolation**                              | One container per agent on its own network, with the dev toolchain inside, and nothing mounted except the workspace                                                                                                                                                                                                                   | docker, podman, devcontainers         |
| **Enforcement outside the trust boundary** | A wrapper spawns the agent as a child process, points `HTTP_PROXY`/`HTTPS_PROXY` at itself and intercepts TLS with an ephemeral CA. It enforces a default-deny host allowlist and a shell-command allowlist with path containment and injection checks. It also **redacts secrets from tool results before they reach the model API** | mitmproxy, a small custom proxy       |
| **Review gate**                            | The agent pushes to a throwaway local git server; a human reviews there; only then does anything reach the real remote                                                                                                                                                                                                                | Forgejo, Gitea, a bare repo           |
| **Supply-chain hygiene**                   | Pre-commit secret scanning; a minimum release age for dependencies so day-zero packages are never installed                                                                                                                                                                                                                           | gitleaks, `minimumReleaseAge` in pnpm |
| **Observation**                            | Declarative policies compiled to kernel-level probes watch network, file, process and privilege-escalation events around the container. "Sees everything, doesn't block anything."                                                                                                                                                    | Tetragon, Falco                       |

The one sentence to teach: controls are enforced **outside the agent's
trust boundary**. Permission prompts and hooks inside the harness are
useful, but the agent can be talked into anything the harness allows; a
proxy it can't see can't be talked into anything.

Secret redaction on the way *out* deserves its own beat. Most people think
about secrets going *in*; an agent that reads a `.env` file and quotes it in
a tool result has just sent the secret to the model provider.

## 4. Configuration hygiene

Small, concrete, vendor-specific but generalizable:

- Lock down the agent's settings file (`chmod 600`); it can hold or point at
  credentials.
- Keep the API key out of the settings file. Use the agent's key-helper
  hook to call a script that reads the key from a password manager at
  start.
- Switch off telemetry, error reporting, non-essential traffic,
  experimental betas and the auto-updater with the documented environment
  variables. Then verify with a trace (section 1), because "off" wasn't
  entirely off.
- Install the agent through a package manager with a minimum release age
  rather than a bare `npm install -g`.
- Editor integrations may not read the same settings file as the CLI. Check
  where each one gets its endpoint and key.
- Open the agent in the subdirectory of the service you are working on, not
  at the repository root. That gives a smaller blast radius and a smaller
  context.

## 5. Unsupervised mode

The argument: running the agent with all permission prompts disabled means downloading instructions from the
internet that were generated by a tool which advertises that it makes
mistakes, and executing them without review. The flag that enables it in
one agent literally contains the word "dangerously", and in another it is
`--yolo`. "The warning is right there in the flag." Inside a container this
narrows the blast radius compared to the host, but it doesn't make it
safe: the workspace, any opted-in credential and full network egress are
still exposed.

Contrast with a first-party middle ground: one agent offers
`--sandbox workspace-write --ask-for-approval on-request`, a combination
that may suit most users but has little track record. Teach the axes (filesystem scope, approval policy,
network) rather than the flags.

Counter-example: at least one coding agent that's open source ships with *only* an
unsupervised mode and no guardrail layer at all. Its own author calls it
unsuitable for serious work. The lesson: guardrails are a property of the
**harness**, not the model.

## 6. Practices from a team that used agents in containers

- Choose tools with least privilege so you never need to reach for the
  skip-permissions flag.
- Don't hardcode tools, model or permission mode in agent definitions;
  decide those at run time.
- Store agent definitions in the repository so everyone runs the same ones.
- Track plan state in git, not the issue tracker; the agent can't read the
  tracker, and the plan should be committed next to the code.
- Expect friction: the container couldn't commit because the password
  manager prompted for the signing key on the host, and couldn't run tests
  because native modules were built for another platform. Design the
  sandbox for the whole workflow, not just for the model calls.

## Notes for the lesson author

- L2 is an Engineering lesson with two comfort levels. Less comfortable:
  enable the built-in sandbox and read the trace. More comfortable: run the
  agent in the public hardened container, trace it, then add one layer of
  the containment pattern.
- L3 is a short for everyone: it presents the trace findings and skips the
  setup.
- `Predict` candidates: which hosts the agent contacts; what a blocked host
  does to startup; what a `.env` in the workspace does to the tool results.
- Keep the vendor-hosted option honest: the trade is convenience against
  control, and the code leaves your machine.
