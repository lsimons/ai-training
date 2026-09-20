"""Runs the checker on the committed JSON sample.

The lesson shows `python3 check_items.py sample/items.json`. Every item in
the sample passes, so this exits with the checker's exit code.
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    result = subprocess.run([sys.executable, "check_items.py", "sample/items.json"], cwd=HERE)
    sys.exit(result.returncode)
