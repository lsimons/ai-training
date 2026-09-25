"""A Claude Code PreToolUse hook that blocks a commit when a lockfile changed
and its manifest did not.

For the lesson "Writing a hook that blocks a mistake". The learner copies
this file into `.claude/hooks/` of their copy of the fixture repository.

Claude Code runs it before a Bash tool call, with the tool call as JSON on
stdin. When the command looks like a git commit (`git commit`, and also
`git -C . commit` or `git -c key=value commit`), it asks git which files
differ from the last commit: staged, unstaged and untracked. If a
`package-lock.json` is among them and the `package.json` next to it isn't,
it prints what to do on stderr and exits with code 2. Exit code 2 blocks the
tool call, and Claude Code gives the stderr text to Claude as the reason.

The hook fails closed. When it can't read the tool call, or git can't tell
it what changed, it also exits with code 2 and says why. It exits with code
0, and the command runs as usual, only for a command that isn't a commit
and for a commit that passes the check. The match is on the command text, so
a command such as `git log --grep commit` counts as a commit too, and it is
blocked only while a lockfile change without its manifest is waiting.
"""

import json
import re
import subprocess
import sys
from pathlib import PurePosixPath
from typing import Optional

# Each lockfile name, with the manifest in the same directory it is made from.
PAIRS = {"package-lock.json": "package.json"}

# `git`, then any options such as `-C .` or `-c key=value`, then `commit`,
# within one shell command (not across `;`, `&&`, `|` or a new line).
COMMIT = re.compile(r"\bgit\b[^;&|\n]*?\scommit\b")


def git_lines(cwd: str, *args: str) -> Optional[list[str]]:
    """The output lines of one git command, or None when it fails."""
    result = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return result.stdout.splitlines()


def changed_files(cwd: str) -> Optional[set[str]]:
    """Paths that differ from the last commit, untracked ones included.

    Returns None when git can't answer. Before the first commit there is no
    HEAD, and every file counts as changed.
    """
    untracked = git_lines(cwd, "ls-files", "--others", "--exclude-standard")
    if untracked is None:
        return None
    if git_lines(cwd, "rev-parse", "--verify", "--quiet", "HEAD") is None:
        tracked = git_lines(cwd, "ls-files", "--cached")
    else:
        tracked = git_lines(cwd, "diff", "--name-only", "HEAD")
    if tracked is None:
        return None
    return set(tracked) | set(untracked)


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
    try:
        call = json.load(sys.stdin)
        command = call["tool_input"]["command"]
        cwd = call.get("cwd", ".")
        if not isinstance(command, str) or not isinstance(cwd, str):
            raise TypeError("command and cwd must be strings")
    except (ValueError, KeyError, TypeError, AttributeError):
        print(
            "Blocked: the lockfile hook couldn't read the tool call it was given.", file=sys.stderr
        )
        return 2
    if not COMMIT.search(command):
        return 0
    changed = changed_files(cwd)
    if changed is None:
        print(
            "Blocked: the lockfile hook couldn't ask git what changed.\n"
            "Run git status to see why, and fix that before you commit.",
            file=sys.stderr,
        )
        return 2
    message = problem(changed)
    if message is None:
        return 0
    print(message, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
