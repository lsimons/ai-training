"""Runs the ranker twice, names swapped, and prints only the totals line.

The lesson shows `python3 rank.py --totals`. The line is what the learner
predicts after counting the two shortlists on the page.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import rank  # noqa: E402  (imported after sys.path knows this directory)

if __name__ == "__main__":
    rank.main(["rank.py", "--totals"])
