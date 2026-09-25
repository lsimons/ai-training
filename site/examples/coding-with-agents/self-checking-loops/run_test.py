"""Runs the test on a copy of the nightly import before any fix.

The test is the reproduction steps from the observing-and-debugging lesson,
written as a command. On the unfixed importer the two nights with a quoted
amount fail, and the test says why in one line each.
"""

import sys
import tempfile

from _common import make_copy, run_test


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        status, output = run_test(copy)
        print(output, end="")
        print(f"exit status {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
