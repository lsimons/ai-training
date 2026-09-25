"""Feeds the hook five tool calls, the way Claude Code does before an edit.

Each call is JSON on the hook's stdin, with the tool's name, its input and
the session's working directory, and CLAUDE_PROJECT_DIR is set to the
project root. The file paths are absolute, as the tool gives them. The
script prints each call's tool and file, the hook's exit status, and what
the hook wrote to stderr. The last two calls edit files in a Claude Code
worktree under `.claude/worktrees/`, where the hook checks the same paths
as in the project.
"""

import json
import os
import subprocess
import sys
import tempfile

from _gates import make_project

WORKTREE = ".claude/worktrees/fix-import"

# The tool, the file relative to the project root, and the session's cwd.
CALLS = [
    ("Edit", "importer.py", ""),
    ("Edit", "test_nights.py", ""),
    ("Write", "nights/2026-09-15/store-09.csv", ""),
    ("Edit", f"{WORKTREE}/importer.py", WORKTREE),
    ("Edit", f"{WORKTREE}/test_nights.py", WORKTREE),
]


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_project(tmpdir)
        hook = os.path.join(copy, ".claude", "hooks", "protect_paths.py")
        env = dict(os.environ, CLAUDE_PROJECT_DIR=copy)
        for tool, path, cwd in CALLS:
            call = {
                "hook_event_name": "PreToolUse",
                "cwd": os.path.join(copy, cwd),
                "tool_name": tool,
                "tool_input": {"file_path": os.path.join(copy, path)},
            }
            result = subprocess.run(
                [sys.executable, hook],
                input=json.dumps(call),
                cwd=copy,
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            print(f"{tool} {path}: exit status {result.returncode}")
            if result.stderr:
                print(f"  {result.stderr.strip()}")


if __name__ == "__main__":
    main()
