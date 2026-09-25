"""Fixture for "What every extra agent costs": the `tokens` step of tax.py."""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import tax

if __name__ == "__main__":
    tax.STEPS["tokens"]()
