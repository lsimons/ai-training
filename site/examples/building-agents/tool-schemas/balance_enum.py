"""Fixture for the "Predict with the enum" checkpoint: runs the `balance_enum` step of tools.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import tools

if __name__ == "__main__":
    tools.STEPS["balance_enum"]()
