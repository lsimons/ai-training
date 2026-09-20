"""Print only the summary line of the Scorecard triage.

Runs triage.py as a subprocess so the lesson's checkpoint asserts one line
while the full script stays the one the learner reads. Standard library
only, Python 3.9 or later.
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    out = subprocess.run(
        [sys.executable, os.path.join(HERE, "triage.py")],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    print(out.rstrip("\n").splitlines()[-1])


if __name__ == "__main__":
    main()
