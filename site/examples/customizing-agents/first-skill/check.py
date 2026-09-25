"""Runs the fixture package's release check on a copy, as the skill's last step does."""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def python_env() -> "dict[str, str]":
    """The only variables the release check sees.

    An allow-list, so a PYTHONPATH, PYTHONSAFEPATH or color setting in the
    caller's environment can't change what the check prints. The same list
    is `python_env` in testing-a-skill's `clones.py`: keep the two in step.
    """
    return {
        "PATH": os.environ.get("PATH", os.defpath),
        "LANG": "C",
        "LC_ALL": "C",
        "PYTHONDONTWRITEBYTECODE": "1",
        "NO_COLOR": "1",
        "PYTHON_COLORS": "0",
    }


def run_check(package: Path) -> str:
    """The output of `python3 release_check.py` in the package directory."""
    result = subprocess.run(
        [sys.executable, "release_check.py"],
        cwd=package,
        env=python_env(),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode not in (0, 1) or result.stderr:
        return f"exit {result.returncode}: {result.stdout}{result.stderr}".rstrip("\n")
    return result.stdout.rstrip("\n")


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        copy = Path(tmp) / "fixture-package"
        shutil.copytree(HERE / "fixture-package", copy)
        print(run_check(copy))
