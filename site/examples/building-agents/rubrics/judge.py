"""Fixture for "Turning good into a rubric": the `judge` step of rubric.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import rubric

if __name__ == "__main__":
    rubric.STEPS["judge"]()
