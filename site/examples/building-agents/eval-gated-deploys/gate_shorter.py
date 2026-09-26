"""Fixture for "Gating a deploy on the evaluation": python3 gate.py shorter"""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gate

if __name__ == "__main__":
    gate.gate("shorter")
