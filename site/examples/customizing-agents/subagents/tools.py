"""Models how Claude Code resolves a subagent's tool list from its frontmatter.

The rules follow the vendor's subagents page (code.claude.com/docs/en/sub-agents,
checked 2026-09-24): a subagent inherits every tool available to subagents
when `tools` is omitted, and `disallowedTools` removes tools from that pool.
With both fields present the removals come first, and the `tools` list then
picks from what survived them, so a tool named in both is gone. The real tool
pool is longer than the short one below, and the real filters also remove a
few tools from every subagent and narrow the set for a subagent that runs in
the background. This model covers only the three frontmatter cases the lesson
compares.
"""

from typing import Optional

# A shortened model of the tools the main conversation has.
POOL = ["Read", "Grep", "Glob", "Bash", "Edit", "Write"]


def resolve(
    pool: list[str], tools: Optional[list[str]] = None, disallowed: Optional[list[str]] = None
) -> list[str]:
    """The tools a subagent ends up with, from its `tools` and `disallowedTools`."""
    remaining = [tool for tool in pool if tool not in (disallowed or [])]
    if tools is None:
        return remaining
    return [tool for tool in remaining if tool in tools]


DEFINITIONS = {
    "reviewer": {"tools": ["Read", "Grep", "Glob"]},
    "no-writes": {"disallowed": ["Write", "Edit"]},
    "helper": {},
}


if __name__ == "__main__":
    for name, fields in DEFINITIONS.items():
        print(f"{name}: {', '.join(resolve(POOL, **fields))}")
