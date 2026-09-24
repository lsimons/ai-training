"""Lands the three increments as one commit each on a branch and shows the log.

The spec's three increments become three commits on the `due-dates` branch,
on top of the two commits on `main`. `git log main..HEAD` shows only the
branch's own commits, newest first. The suite passes at the tip.
"""

import sys

from _common import commit_each_increment, in_copy, init_repo, print_log, print_test_verdict


def main(repo: str) -> int:
    init_repo(repo)
    commit_each_increment(repo)
    print_log(repo)
    print_test_verdict(repo)
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
