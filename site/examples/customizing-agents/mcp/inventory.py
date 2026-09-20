"""Fixture for the "Count the inventory" checkpoint: runs the `inventory` step of ops.py."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ops  # noqa: E402

if __name__ == "__main__":
    ops.STEPS["inventory"]()
