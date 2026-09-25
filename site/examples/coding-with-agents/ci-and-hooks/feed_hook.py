"""Feeds the hook three tool calls, the way Claude Code does before an edit.

Each call is JSON on the hook's stdin, with the tool's name, its input and
the session's working directory, and CLAUDE_PROJECT_DIR is set to the
project root. The file paths are absolute, as the tool gives them. The
script prints each call's tool and file, the hook's exit status, and what
the hook wrote to stderr.
"""

import json
import os
import subprocess
import sys
import tempfile

from _gates import make_project

CALLS = [
    ("Edit", "importer.py"),
    ("Edit", "test_nights.py"),
    ("Write", "nights/2026-09-15/store-09.csv"),
]


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_project(tmpdir)
        hook = os.path.join(copy, ".claude", "hooks", "protect_paths.py")
        env = dict(os.environ, CLAUDE_PROJECT_DIR=copy)
        for tool, path in CALLS:
            call = {
                "hook_event_name": "PreToolUse",
                "cwd": copy,
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
