"""Adds the acceptance test to a copy and runs the suite before importer.py exists."""

import sys

from _common import add_acceptance_test, in_copy, print_test_verdict


def main(repo: str) -> int:
    add_acceptance_test(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
