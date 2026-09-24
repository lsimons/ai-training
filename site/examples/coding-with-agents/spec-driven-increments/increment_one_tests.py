"""Lands the first increment on a copy and runs the suite: it passes."""

import sys

from _common import in_copy, land_first_increment, print_test_verdict


def main(repo: str) -> int:
    land_first_increment(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
