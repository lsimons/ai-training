# Public references

Everything here is public. Licenses were checked on 2026-09-20 where a
repository was involved. Grouped by the lesson they serve.

## Sandboxing and containment

| Reference                                                   | License     | Use                                                                                                                        |
| ----------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| <https://github.com/schubergphilis/claude-docker>           | Apache-2.0  | Hardened container for one coding agent; README has a written threat model, credential opt-in flags, an auth proxy sidecar |
| <https://github.com/rthewhite/xray>                         | none stated | Sandboxed VMs with snapshots for agent sessions; link only                                                                 |
| <https://github.com/rtk-ai/rtk>                             | Apache-2.0  | CLI proxy that trims tool output to cut token use; an example of a wrapper around the agent                                |
| <https://code.claude.com/docs/en/sandboxing>                | docs        | The built-in sandbox; the baseline the comparison table starts from                                                        |
| <https://github.com/openai/codex/blob/main/docs/sandbox.md> | docs        | A first-party sandbox and approval-mode matrix for contrast                                                                |
| <https://github.com/badlogic/pi-mono>                       | check       | A coding agent with only an unsupervised mode; the counter-example                                                         |
| <https://github.com/Piebald-AI/claude-code-system-prompts>  | check       | Extracted system prompts; shows what the harness adds around the model                                                     |
| mitmproxy, Tetragon, Falco, Forgejo, Gitea, gitleaks        | OSS         | Public building blocks for the layered containment pattern                                                                 |
| <https://pnpm.io/settings#minimumreleaseage>                | docs        | Minimum release age for dependencies                                                                                       |

## Agent configuration and workflow

| Reference                                                  | Use                                                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| <https://code.claude.com/docs/en/memory>                   | Root instructions file and modular rules                                                 |
| <https://code.claude.com/docs/en/sub-agents>               | Agent definitions in the repository                                                      |
| <https://code.claude.com/docs/en/skills>                   | Skills; the build-your-own-skill workshop                                                |
| <https://code.claude.com/docs/en/hooks-guide>              | Hooks as in-harness CI steps                                                             |
| <https://code.claude.com/docs/en/mcp>                      | MCP client configuration                                                                 |
| <https://code.claude.com/docs/en/plugin-marketplaces>      | Plugins and private marketplaces                                                         |
| <https://github.com/schubergphilis/agents.md> (Apache-2.0) | A public collection of agent instruction files; compare with the fork's AGENTS.md lesson |
| <https://github.com/kasbuunk/coherence-engineering>        | The coherence idea for area 4                                                            |
| <https://github.com/lsimons/caseum> (CC BY 4.0)            | The role-description format used for personas                                            |

## MCP security

| Reference                                                                            | Use                                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| <https://modelcontextprotocol.io/>                                                   | The specification; attribute the USB-C analogy to it      |
| Atlassian Rovo MCP documentation (getting started, OAuth 2.1, admin controls, audit) | The public side of the reviewed server                    |
| <https://github.com/MicrosoftDocs/mcp>                                               | A public, unauthenticated documentation server            |
| <https://github.com/hashicorp/terraform-mcp-server>                                  | Well-written tool descriptions that enforce call order    |
| <https://github.com/microsoft/playwright-mcp>                                        | Browser driving via the accessibility tree; isolated mode |
| OWASP Top 10 for LLM Applications                                                    | Cross-reference for scenarios and MCP risks               |

## Regulation and governance

| Reference                                                                       | Use                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Regulation (EU) 2024/1689 on EUR-Lex                                            | The only citation for the EU AI Act lesson       |
| European Commission AI Act pages; the European AI Office                        | Application dates, guidance                      |
| <https://artificialintelligenceact.eu/>                                         | Navigation aid only                              |
| <https://c2pa.org/>                                                             | Content credentials for generated media          |
| Microsoft Learn: Copilot privacy, transparency note, enterprise data protection | Worked example for the eight vendor questions    |
| Microsoft security blog on detecting prompt injection (user and cross-prompt)   | Definitions of the two injection kinds           |
| ISO/IEC 42001, ISO 27001, SOC 2                                                 | Named standards in the charter and vendor checks |

## Dependency review

| Reference                                                      | Use                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| <https://scorecard.dev/>                                       | The security checks the review method is built on             |
| Fuchsia third-party review guidelines (Google, public)         | The provenance of the review method; acknowledge it           |
| <https://doc.rust-lang.org/cargo/reference/build-scripts.html> | Example of build-time code execution as a review concern      |
| ISO/IEC 25010                                                  | Quality model referenced in the incremental-improvement phase |

## Concepts and onboarding

| Reference                                                                                                                                                         | Use                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Vaswani et al., "Attention Is All You Need" (2017), arXiv                                                                                                         | The origin story                                     |
| DORA research on AI as an amplifier                                                                                                                               | Cite the report, not the paraphrase                  |
| Collins Dictionary Word of the Year 2025, "vibe coding"                                                                                                           | One line of color                                    |
| <https://platform.claude.com/docs/en/about-claude/models/choosing-a-model>                                                                                        | Model choice, for the setup lesson                   |
| <https://www.1password.dev/ssh>, <https://www.1password.dev/cli/get-started>                                                                                      | Password-manager-backed SSH and CLI secrets in setup |
| <https://github.com/git-guides/install-git>, <https://docs.github.com/en/get-started/git-basics/set-up-git>                                                       | Git setup in the on-ramp                             |
| <https://learn.microsoft.com/en-us/windows/package-manager/winget/>                                                                                               | Windows package manager in the on-ramp               |
| <https://www.deeplearning.ai/courses/generative-ai-for-everyone>, <https://www.deeplearning.ai/courses/ai-prompting-for-everyone>, <https://cs50.harvard.edu/ai/> | Already covered by explore/03 and /05                |
| Framework docs: CrewAI, AutoGen, LangChain, n8n, Make, Zapier, Copilot Studio                                                                                     | Only for the no-code / low-code / code axis          |

## Claims that need a primary source before use

- "About half of AI-generated code contains security vulnerabilities."
- "Most engineering tasks get slower when complex AI is misapplied."
- "Over a third of people worldwide use AI for medical, mental health or
  relationship advice."
- "More than 30% of code at large AI companies is now produced by AI."

None of these came with a citation. Find one or drop the claim.
