"""Lands the prepared agent branch on a copy and shows which files it changed.

`git diff --stat main` lists every file the branch touched against `main`,
with the number of changed lines per file. The list is the first thing to
read: the spec names `todo.py`, `render.py` and a test, and the branch
touched more than that.
"""

import sys

from _common import git, in_copy


def main(repo: str) -> int:
    sys.stdout.write(git(repo, "diff", "--stat", "main").stdout)
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
