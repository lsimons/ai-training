"""Prints the session 2 log without its two-line header and the blank line after it.

The same lines as `tail -n +4 sessions/session-2.txt`, run from the lesson's
fixture directory. The page shows this output, so the log on the page is the
file in `sessions/`.
"""

import os
import sys

from _common import SESSIONS

HEADER_LINES = 3


def main() -> int:
    with open(os.path.join(SESSIONS, "session-2.txt"), encoding="utf-8") as handle:
        lines = handle.readlines()
    if len(lines) <= HEADER_LINES:
        raise SystemExit("session-2.txt has no log lines after its header")
    if not lines[0].startswith("# Session 2.") or lines[HEADER_LINES - 1].strip():
        raise SystemExit("session-2.txt no longer starts with the header the page skips")
    sys.stdout.write("".join(lines[HEADER_LINES:]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
