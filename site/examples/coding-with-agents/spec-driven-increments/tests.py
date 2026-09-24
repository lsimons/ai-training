"""Runs the fixture's test suite as it ships and prints only the verdict."""

import sys

from _common import in_copy, print_test_verdict

if __name__ == "__main__":
    sys.exit(in_copy(print_test_verdict))
