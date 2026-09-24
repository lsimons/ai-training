"""Reverts the middle commit and shows that the other two increments still work.

After `git revert HEAD~1` the `overdue` command is gone, and its test with it,
while `due` and the date in `list` from the first commit and the date check
from the third are untouched. The script prints the log, the suite's last
line, what `due 1 tomorrow` prints, and the exit status of `overdue`, which
is now an unknown command.
"""

import sys

from _common import (
    commit_each_increment,
    in_copy,
    init_repo,
    print_log,
    print_test_verdict,
    revert_middle_increment,
    run_todo,
)


def main(repo: str) -> int:
    init_repo(repo)
    commit_each_increment(repo)
    revert_middle_increment(repo)
    print_log(repo)
    print_test_verdict(repo)
    bad = run_todo(repo, "due", "1", "tomorrow")
    sys.stdout.write(bad.stdout)
    gone = run_todo(repo, "overdue", today="2026-10-02")
    print(f"overdue exits with status {gone.returncode}")
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
