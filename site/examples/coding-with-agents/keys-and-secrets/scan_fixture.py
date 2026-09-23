"""Runs the scanner over the fixture as it ships.

scan.py exits 1 when it finds something, which is what a scanner in CI
should do. This runner exits 0 so the example runner compares the output.
"""

import sys

from _common import clean_env, in_copy, run


def main(repo: str) -> int:
    run(repo, "scan.py", clean_env())
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
