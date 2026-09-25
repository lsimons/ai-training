"""Runs the agent's tests on a fresh copy of the shop, before any change.

Every test passes, which says nothing yet about what the tests would catch.
"""

import sys
import tempfile

from _common import make_copy, print_tests


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        print_tests(make_copy(tmpdir))
    return 0


if __name__ == "__main__":
    sys.exit(main())
