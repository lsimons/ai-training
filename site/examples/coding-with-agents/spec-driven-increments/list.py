"""Shows the committed list, on a copy so the fixture stays untouched."""

import sys

from _common import in_copy, show_todo


def main(repo: str) -> int:
    return show_todo(repo, "list")


if __name__ == "__main__":
    sys.exit(in_copy(main))
