"""Adds the test, applies the fix to store.py and runs the suite: OK."""

import sys

from _common import add_failing_test, apply_fix, in_copy, print_test_verdict


def main(repo: str) -> int:
    add_failing_test(repo)
    apply_fix(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
