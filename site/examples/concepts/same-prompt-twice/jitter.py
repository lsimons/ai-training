"""Ten runs at temperature 0 with jittered scores, for the lesson's third example.

The lesson shows `python3 sample.py --temperature 0 --runs 10 --jitter`.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import sample  # noqa: E402  (imported after sys.path knows this directory)

if __name__ == "__main__":
    sys.exit(sample.main(["sample.py", "--temperature", "0", "--runs", "10", "--jitter"]))
