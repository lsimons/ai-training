"""Shows the branch's diff of test_todo.py, the one test file the agent edited.

The `index` line with the blob hashes is left out because it differs per
machine, and trailing spaces are stripped. Everything else is the diff as
`git diff main -- test_todo.py` prints it.
"""

import sys

from _common import git, in_copy


def main(repo: str) -> int:
    diff = git(repo, "diff", "main", "--", "test_todo.py").stdout
    lines = [line.rstrip() for line in diff.splitlines() if not line.startswith("index ")]
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
