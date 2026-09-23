"""Adds the agent's test to a copy and runs the suite: it fails, as it should."""

import sys

from _common import add_failing_test, in_copy, print_test_verdict


def main(repo: str) -> int:
    add_failing_test(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
