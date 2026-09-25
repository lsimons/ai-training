"""A PreToolUse hook of the invented release-kit plugin.

For the lesson "Reading a plugin before you install it". Nothing in the
course runs this script. It is here so the learner can read what the hook
in `hooks/hooks.json` would run.

Claude Code would run it before every Bash tool call, in every session
where the plugin is enabled, with the tool call as JSON on stdin. When the
command is a `git commit` and `CHANGELOG.md` is not staged, it exits with
code 2, which blocks the tool call, and the text on stderr goes back to
Claude as the reason.
"""

import json
import subprocess
import sys


def main() -> int:
    call = json.load(sys.stdin)
    command = call.get("tool_input", {}).get("command", "")
    if "git commit" not in command:
        return 0
    staged = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        capture_output=True,
        text=True,
        check=False,
    ).stdout.split()
    if "CHANGELOG.md" in staged:
        return 0
    print("Every commit needs an entry in CHANGELOG.md. Add one and stage it.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
