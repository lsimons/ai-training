"""Lists every file in the fixture with its line count, and the total."""

import os
import sys

from _common import REPO, repo_files


def main() -> int:
    total = 0
    for name in repo_files(REPO):
        with open(os.path.join(REPO, name), encoding="utf-8") as handle:
            count = sum(1 for _ in handle)
        total += count
        print(f"{count:5d} {name}")
    print(f"{total:5d} total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
