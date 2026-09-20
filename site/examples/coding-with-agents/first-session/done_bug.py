"""Marks item 1 done on a temporary copy of the list, so the fixture stays clean."""

import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixture-repo")

if __name__ == "__main__":
    tmpdir = tempfile.mkdtemp()
    try:
        copy = os.path.join(tmpdir, "todos.json")
        shutil.copyfile(os.path.join(REPO, "todos.json"), copy)
        env = dict(os.environ, TODO_FILE=copy)
        result = subprocess.run([sys.executable, "todo.py", "done", "1"], cwd=REPO, env=env, check=True)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
    sys.exit(result.returncode)
