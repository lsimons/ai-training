"""Prints the fixture's instructions file, AGENTS.md, as `cat AGENTS.md` does."""

import os
import sys

from _common import REPO


def main() -> int:
    with open(os.path.join(REPO, "AGENTS.md"), encoding="utf-8") as handle:
        sys.stdout.write(handle.read())
    return 0


if __name__ == "__main__":
    sys.exit(main())
