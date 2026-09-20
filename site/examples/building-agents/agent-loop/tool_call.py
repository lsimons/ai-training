"""Fixture for the "Predict the output" checkpoint: runs the `tool_call` step of agent.py."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent  # noqa: E402

if __name__ == "__main__":
    agent.STEPS["tool_call"]()
