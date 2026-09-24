"""Applies the scoped change to a copy, then runs `undo` and `list` against it."""

import sys

from _common import apply_undo, in_copy, run_todo


def main(repo: str) -> int:
    apply_undo(repo)
    run_todo(repo, "undo", "2")
    return run_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
