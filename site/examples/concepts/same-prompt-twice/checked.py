"""Ten runs at temperature 1.0 with the check applied, for the lesson's last example.

The lesson shows `python3 sample.py --temperature 1.0 --runs 10 --check`.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import sample  # noqa: E402  (imported after sys.path knows this directory)

if __name__ == "__main__":
    sys.exit(sample.main(["sample.py", "--temperature", "1.0", "--runs", "10", "--check"]))
