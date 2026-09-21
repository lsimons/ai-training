"""Ten runs at temperature 0, for the lesson's first Predict block.

The lesson shows `python3 sample.py --temperature 0 --runs 10 --quiet`.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import sample  # noqa: E402  (imported after sys.path knows this directory)

if __name__ == "__main__":
    sys.exit(sample.main(["sample.py", "--temperature", "0", "--runs", "10", "--quiet"]))
