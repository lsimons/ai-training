"""Fixture for the "Predict the cap" checkpoint: runs the `write_cap` step of ops.py."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ops

if __name__ == "__main__":
    ops.STEPS["write_cap"]()
