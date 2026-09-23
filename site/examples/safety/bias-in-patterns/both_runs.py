"""Runs the ranker twice, names swapped, and prints both rankings with scores.

The lesson shows `python3 rank.py`. Each run is printed in full so the learner
can see that either ranking on its own looks like a defensible shortlist.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import rank  # noqa: E402  (imported after sys.path knows this directory)

if __name__ == "__main__":
    rank.main(["rank.py"])
