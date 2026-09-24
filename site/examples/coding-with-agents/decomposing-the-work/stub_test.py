"""Adds the acceptance test and a stub parser to a copy: the test still fails."""

import sys

from _common import add_acceptance_test, add_stub, in_copy, print_test_verdict


def main(repo: str) -> int:
    add_acceptance_test(repo)
    add_stub(repo)
    return print_test_verdict(repo)


if __name__ == "__main__":
    sys.exit(in_copy(main))
