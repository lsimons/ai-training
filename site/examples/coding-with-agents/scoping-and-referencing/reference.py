"""Prints the lines a path-and-line reference in the brief points at."""

import os
import sys

from _common import REPO

FIRST, LAST = 16, 21


def main() -> int:
    with open(os.path.join(REPO, "todo.py"), encoding="utf-8") as handle:
        lines = handle.read().splitlines()
    for number in range(FIRST, LAST + 1):
        print(f"{number}\t{lines[number - 1]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
