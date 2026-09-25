"""A Claude Code hook that blocks the agent's edits to protected paths.

Claude Code runs it before each Edit or Write tool call (the matcher in
settings.sample.json), with the call as JSON on stdin. The hook reads the
file path from `tool_input.file_path`, and when the path is protected it
prints the reason to stderr and exits with status 2. Exit status 2 is the
one that blocks the call, and Claude Code shows the stderr text to the
agent. Any other non-zero status is a non-blocking error and the edit goes
ahead, so any input the hook can't read also exits with status 2.

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


def project_path(call: dict) -> str:
    """The edited file's path relative to the project root, with "/" separators.

    CLAUDE_PROJECT_DIR stays at the root where the session started, and the
    session's `cwd` follows the agent into a worktree. A relative file path
    is resolved against `cwd`. A path inside a Claude Code worktree, under
    `.claude/worktrees/<name>/`, is checked as the same path in the project.
    """
    file_path = call["tool_input"]["file_path"]
    cwd = call.get("cwd") or os.getcwd()
    if not isinstance(file_path, str) or not isinstance(cwd, str) or not file_path:
        raise TypeError("file_path and cwd must be non-empty strings")
    project = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or cwd)
    target = os.path.realpath(os.path.join(cwd, file_path))
    parts = os.path.relpath(target, project).split(os.sep)
    if parts[:2] == [".claude", "worktrees"] and len(parts) > 3:
        parts = parts[3:]
    return "/".join(parts)


def main() -> None:
    try:
        call = json.load(sys.stdin)
        relative = project_path(call)
    except Exception:
        block(
            "protect_paths: could not read the file path of the tool call, so the edit is blocked."
        )
        return
    if protected(relative):
        block(REASON.format(path=relative))
    sys.exit(0)


if __name__ == "__main__":
    main()
