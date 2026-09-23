"""Runs `clear` and then `list` on a copy, which shows the bug."""

import sys

from _common import in_copy, run_todo


def main(repo: str) -> int:
    run_todo(repo, "clear")
    return run_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
