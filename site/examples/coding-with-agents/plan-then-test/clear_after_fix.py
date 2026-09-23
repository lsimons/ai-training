"""Applies the fix to a copy, then runs `clear` and `list`."""

import sys

from _common import apply_fix, in_copy, run_todo


def main(repo: str) -> int:
    apply_fix(repo)
    run_todo(repo, "clear")
    return run_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
