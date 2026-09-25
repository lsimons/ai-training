"""A Claude Code hook that blocks the agent's edits to protected paths.

Claude Code runs it before each Edit or Write tool call (the matcher in
settings.sample.json), with the call as JSON on stdin. The hook reads the
file path from `tool_input.file_path`, and when the path is protected it
prints the reason to stderr and exits with status 2. Exit status 2 is the
one that blocks the call, and Claude Code shows the stderr text to the
agent. Any other non-zero status is a non-blocking error and the edit goes
ahead, so input the hook can't read also exits with status 2.

Copy it to `.claude/hooks/protect_paths.py` in the project.
"""

import json
import os
import sys

# Paths relative to the project root. A directory ends in "/" and protects
# everything under it. The hook and its settings are on the list, so the
# agent can't switch the rule off by editing them.
PROTECTED = [
    "test_nights.py",
    "nights/",
    ".claude/",
    ".github/",
]

REASON = (
    "{path} is protected: agents may not change it. If it must change, stop and tell the user why."
)


def block(message: str) -> None:
    print(message, file=sys.stderr)
    sys.exit(2)


def protected(relative: str) -> bool:
    for entry in PROTECTED:
        if entry.endswith("/") and relative.startswith(entry):
            return True
        if relative == entry:
            return True
    return False


def main() -> None:
    try:
        call = json.load(sys.stdin)
        file_path = call["tool_input"]["file_path"]
    except (ValueError, KeyError, TypeError):
        block(
            "protect_paths: could not read the file path of the tool call, so the edit is blocked."
        )
        return
    project = os.environ.get("CLAUDE_PROJECT_DIR") or call.get("cwd") or os.getcwd()
    project = os.path.realpath(project)
    target = os.path.realpath(os.path.join(project, file_path))
    relative = os.path.relpath(target, project).replace(os.sep, "/")
    if protected(relative):
        block(REASON.format(path=relative))
    sys.exit(0)


if __name__ == "__main__":
    main()
