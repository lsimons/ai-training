"""Shows the committed to-do list, against a copy of the fixture."""

import sys

from _common import in_copy, run_todo


def main(repo: str) -> int:
    return run_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
