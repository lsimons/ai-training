#!/bin/sh
# PostToolUse hook on Edit and Write (.claude/settings.json): Biome for an
# edited file under site/, ruff for a .py file. Never fails the tool call.
# The logic is in scripts/agent_hooks.py.
python3 "$(dirname "$0")/../../scripts/agent_hooks.py" format || true
exit 0
