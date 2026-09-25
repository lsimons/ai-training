"""Prints every todo.py command the agent ran in the two session logs.

The same lines as `grep -H '^run python3 todo.py' sessions/*.txt`, run from
the lesson's fixture directory.
"""

import os
import sys

from _common import SESSIONS

PREFIX = "run python3 todo.py"


def main() -> int:
    for name in sorted(os.listdir(SESSIONS)):
        if not name.endswith(".txt"):
            continue
        with open(os.path.join(SESSIONS, name), encoding="utf-8") as handle:
            for line in handle:
                if line.startswith(PREFIX):
                    print(f"sessions/{name}:{line.rstrip()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
