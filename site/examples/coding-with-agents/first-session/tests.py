"""Runs the fixture's test suite and prints only the verdict line."""

import os
import subprocess
import sys

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixture-repo")

if __name__ == "__main__":
    env = dict(os.environ, PYTHON_COLORS="0", NO_COLOR="1")
    # The suite is meant to fail (the fixture has a bug), so its exit status
    # is not this script's exit status.
    result = subprocess.run(
        [sys.executable, "-m", "unittest", "-q"],
        cwd=REPO,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    lines = result.stdout.strip().splitlines()
    print(lines[-1] if lines else "")
