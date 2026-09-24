"""Lands the first increment on a copy, sets a date on item 1 and lists."""

import sys

from _common import in_copy, land_first_increment, show_todo


def main(repo: str) -> int:
    land_first_increment(repo)
    show_todo(repo, "due", "1", "2026-10-01")
    return show_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
