#!/bin/sh
# PreToolUse hook on Bash for the code-reviewer agent
# (.claude/agents/code-reviewer.md): only read-only review commands run.
# The allowed list and its tests are in scripts/agent_hooks.py and
# tests/test_agent_hooks.py.
exec python3 "$(dirname "$0")/../../scripts/agent_hooks.py" review-bash
