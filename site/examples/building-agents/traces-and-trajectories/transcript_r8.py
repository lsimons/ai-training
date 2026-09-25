"""Fixture for "Recording and grading the path the agent took".

Runs the `show_r8` step of trajectory.py.
"""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import trajectory

if __name__ == "__main__":
    trajectory.STEPS["show_r8"]()
