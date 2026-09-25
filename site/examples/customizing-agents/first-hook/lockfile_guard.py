"""A Claude Code PreToolUse hook that blocks a commit when a lockfile changed
and its manifest did not.

For the lesson "Writing a hook that blocks a mistake". The learner copies
this file into `.claude/hooks/` of their copy of the fixture repository.

Claude Code runs it before a Bash tool call, with the tool call as JSON on
stdin. When the command contains `git commit`, it asks git which files
differ from the last commit, staged or not. If a `package-lock.json` is
among them and the `package.json` next to it isn't, it prints what to do on
stderr and exits with code 2. Exit code 2 blocks the tool call, and Claude
Code gives the stderr text to Claude as the reason. Every other case exits
with code 0, and the command runs as usual.
"""

import json
import subprocess
import sys
from pathlib import PurePosixPath
from typing import Optional

# Each lockfile name, with the manifest in the same directory it is made from.
PAIRS = {"package-lock.json": "package.json"}


def changed_files(cwd: str) -> Optional[set[str]]:
    """The paths that differ from the last commit, or None when there is none."""
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD"],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return set(result.stdout.splitlines())


def problem(changed: set[str]) -> Optional[str]:
    """The message for the first lockfile whose manifest didn't change, or None."""
    for path in sorted(changed):
        lockfile = PurePosixPath(path)
        manifest_name = PAIRS.get(lockfile.name)
        if manifest_name is None:
            continue
        manifest = str(lockfile.with_name(manifest_name))
        if manifest not in changed:
            return (
                f"Blocked: {path} changed and {manifest} did not.\n"
                f"{path} is generated from {manifest}. Make the change in {manifest}\n"
                f"and regenerate {path} from it, or undo the lockfile change with\n"
                f"git checkout HEAD -- {path}"
            )
    return None


def main() -> int:
    call = json.load(sys.stdin)
    command = call.get("tool_input", {}).get("command", "")
    if "git commit" not in command:
        return 0
    changed = changed_files(call.get("cwd", "."))
    if changed is None:
        return 0
    message = problem(changed)
    if message is None:
        return 0
    print(message, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
