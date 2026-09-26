"""Fixture for "Cost, caching and pinning the model": the `budget` step of ops.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ops

if __name__ == "__main__":
    ops.STEPS["budget"]()
