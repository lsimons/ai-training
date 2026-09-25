"""Fixture for "Reading failures one by one": the `week2` step of errors.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import errors

if __name__ == "__main__":
    errors.STEPS["week2"]()
