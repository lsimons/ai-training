"""Fixture for "A model as the grader": the `prefer` step of grade.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import grade

if __name__ == "__main__":
    grade.STEPS["prefer"]()
