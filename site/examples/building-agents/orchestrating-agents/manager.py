"""Fixture for "Orchestration in code or by a model": runs the `manager` step of agent.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent

if __name__ == "__main__":
    agent.STEPS["manager"]()
