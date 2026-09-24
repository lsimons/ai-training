"""Applies the scoped change to a copy and prints the test verdict."""

import sys

from _common import apply_undo, in_copy, print_test_verdict


def main(repo: str) -> int:
    apply_undo(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
