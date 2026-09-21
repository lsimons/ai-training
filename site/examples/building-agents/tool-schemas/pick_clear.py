"""Fixture for the "Predict again" checkpoint: runs the `pick_clear` step of tools.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import tools

if __name__ == "__main__":
    tools.STEPS["pick_clear"]()
