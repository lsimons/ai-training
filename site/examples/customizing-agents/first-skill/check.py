"""Runs the fixture package's release check on a copy, as the skill's last step does."""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def run_check(package: Path) -> str:
    """The output of `python3 release_check.py` in the package directory."""
    result = subprocess.run(
        [sys.executable, "release_check.py"],
        cwd=package,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.rstrip("\n")


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        copy = Path(tmp) / "fixture-package"
        shutil.copytree(HERE / "fixture-package", copy)
        print(run_check(copy))
