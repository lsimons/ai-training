"""Fixture for the lesson's `tool_result` example: runs that step of wire.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import wire

if __name__ == "__main__":
    wire.STEPS["tool_result"]()
