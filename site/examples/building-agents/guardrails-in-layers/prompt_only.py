"""Fixture for "Guardrails in layers".

Runs the `prompt_only` step of guardrails.py.
"""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import guardrails

if __name__ == "__main__":
    guardrails.STEPS["prompt_only"]()
