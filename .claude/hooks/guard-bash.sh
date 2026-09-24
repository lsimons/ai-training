#!/bin/sh
# PreToolUse hook on Bash (.claude/settings.json). The rules and their
# tests are in scripts/agent_hooks.py and tests/test_agent_hooks.py.
# Exit 2 blocks the command and shows the reason to the agent.
exec python3 "$(dirname "$0")/../../scripts/agent_hooks.py" guard-bash
