"""Runs the checker on the sample that a bare "return JSON" prompt produced.

The lesson shows `python3 check_items.py sample/bare.json` as its pitfall:
the model chose its own keys and its own priority words, so every item
fails. The checker exits 1 on a failing item. The exit code is ignored here
on purpose, because the example runner treats a non-zero exit as a broken
fixture, and this fixture shows a failing run.
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    subprocess.run([sys.executable, "check_items.py", "sample/bare.json"], cwd=HERE)
