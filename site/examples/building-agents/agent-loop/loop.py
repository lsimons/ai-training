"""Fixture for the "Predict the loop" checkpoint: runs the `loop` step of agent.py."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent  # noqa: E402

if __name__ == "__main__":
    agent.STEPS["loop"]()
