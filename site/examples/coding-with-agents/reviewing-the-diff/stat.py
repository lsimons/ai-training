"""Lands the prepared agent branch on a copy and shows which files it changed.

`git diff --stat=80 main` lists every file the branch touched against `main`,
with the number of added plus removed lines per file. The width is fixed so
the output is the same whatever the terminal is. The list is the first thing
to read: the spec describes two commands, a change to `list` and tests, and
the branch touched six files.
"""

import sys

from _common import git, in_copy


def main(repo: str) -> int:
    sys.stdout.write(git(repo, "diff", "--stat=80", "main").stdout)
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
