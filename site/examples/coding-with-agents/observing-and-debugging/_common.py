"""Shared helpers for the observing-and-debugging fixtures.

The program under `nightly/` adds up one night's sales exports. It reads only
the files it is given and writes nothing, so the fixtures run it in place.
Each fixture runs it the way the lesson tells the learner to, from `nightly/`
with a shell pattern for the files, and expands the pattern in sorted order,
as the shell does for these names.
"""

import glob
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
NIGHTLY = os.path.join(HERE, "nightly")
NIGHTS = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17"]


def files(pattern: str, root: str) -> list[str]:
    """The paths a shell in `root` expands `pattern` to, relative to `root`."""
    matches = glob.glob(os.path.join(root, pattern))
    found = sorted(os.path.relpath(path, root) for path in matches)
    if not found:
        raise SystemExit(f"no files match {pattern}")
    return found


def run_importer(
    pattern: str, importer: str = "importer.py", cwd: str = NIGHTLY
) -> tuple[int, str]:
    """Run `python3 importer.py <pattern>` from `cwd` and return (status, log)."""
    result = subprocess.run(
        [sys.executable, importer, *files(pattern, cwd)],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.stderr:
        raise SystemExit(f"the importer wrote to stderr:\n{result.stderr}")
    return result.returncode, result.stdout


def verdict(status: int) -> str:
    return "ok" if status == 0 else "rejected"
