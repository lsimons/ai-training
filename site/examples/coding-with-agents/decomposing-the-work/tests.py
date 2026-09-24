"""Runs the fixture's own suite as it ships: it passes."""

import sys

from _common import in_copy, print_test_verdict

if __name__ == "__main__":
    sys.exit(in_copy(print_test_verdict))
