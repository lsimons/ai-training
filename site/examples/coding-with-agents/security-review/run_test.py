"""Runs test_notes_search.py against the agent's version and the fixed one.

Each run copies the test, the shared set-up and one version of
notes_search.py to a temporary directory, so the two versions never meet.
The script prints the last line of `python3 -m unittest` for each.
"""

import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
VERSIONS = [
    ("agent version", os.path.join(HERE, "notes_search.py")),
    ("fixed version", os.path.join(HERE, "fixed", "notes_search.py")),
]


def verdict(module: str) -> str:
    with tempfile.TemporaryDirectory() as tmpdir:
        for name in ("_common.py", "test_notes_search.py"):
            shutil.copyfile(os.path.join(HERE, name), os.path.join(tmpdir, name))
        shutil.copyfile(module, os.path.join(tmpdir, "notes_search.py"))
        env = dict(os.environ, PYTHON_COLORS="0", NO_COLOR="1", PYTHONDONTWRITEBYTECODE="1")
        # The agent version is expected to fail, so the exit status is not
        # this script's exit status.
        result = subprocess.run(
            [sys.executable, "-m", "unittest", "test_notes_search"],
            cwd=tmpdir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
    return result.stdout.strip().splitlines()[-1]


for label, module in VERSIONS:
    print(f"{label}: {verdict(module)}")
