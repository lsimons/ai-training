"""Fixture for "Where an agent's memory lives": the `grown` step of memory.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import memory

if __name__ == "__main__":
    memory.STEPS["grown"]()
