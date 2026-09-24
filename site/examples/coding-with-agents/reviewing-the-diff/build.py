"""Builds the prepared agent branch into a directory you name, and keeps it.

    python3 build.py ~/review-me

The directory must not exist yet. Afterwards `~/review-me/fixture-repo` is a
git repository with the program and `SPEC.md` on `main` and the agent's
commit on the checked-out branch `due-dates`, ready for the exercise. Delete
the directory when you are done.
"""

import os
import sys

from _common import build


def main(argv: "list[str]") -> int:
    if len(argv) != 2:
        print((__doc__ or "").strip(), file=sys.stderr)
        return 2
    parent = os.path.abspath(argv[1])
    if os.path.exists(parent):
        print(f"{parent} exists already, name a directory that doesn't", file=sys.stderr)
        return 2
    os.makedirs(parent)
    repo = build(parent)
    print(f"branch due-dates is checked out in {repo}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
