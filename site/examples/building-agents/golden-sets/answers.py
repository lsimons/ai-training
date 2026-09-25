"""Fixture for "A golden set is the agent's regression suite": the `answers` step of golden.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import golden

if __name__ == "__main__":
    golden.STEPS["answers"]()
