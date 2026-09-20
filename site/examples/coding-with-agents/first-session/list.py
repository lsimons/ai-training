"""Shows the committed to-do list. Read-only against the fixture."""

import os
import subprocess
import sys

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixture-repo")

if __name__ == "__main__":
    result = subprocess.run([sys.executable, "todo.py", "list"], cwd=REPO, check=True)
    sys.exit(result.returncode)
