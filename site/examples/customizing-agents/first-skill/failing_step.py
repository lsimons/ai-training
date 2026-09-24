"""Shows what the release check prints after a half-done release, and after the missing step.

It copies the fixture package, bumps the version in `notes.py` to 0.4.0 the
way step 2 of the release skill says, and runs the check. Then it adds the
changelog heading from step 3 and runs the check again. The first run is
what an agent sees when it skips a step, and the second is what the skill
tells it to reach.
"""

import shutil
import tempfile
from pathlib import Path

from check import run_check

HERE = Path(__file__).resolve().parent
NEW_VERSION = "0.4.0"


def bump(package: Path, old: str, new: str) -> None:
    source = package / "notes.py"
    source.write_text(
        source.read_text(encoding="utf-8").replace(
            f'__version__ = "{old}"', f'__version__ = "{new}"'
        ),
        encoding="utf-8",
    )


def add_changelog_entry(package: Path, version: str, line: str) -> None:
    changelog = package / "CHANGELOG.md"
    text = changelog.read_text(encoding="utf-8")
    entry = f"## {version}\n\n- {line}\n\n"
    changelog.write_text(
        text.replace("# Changelog\n\n", f"# Changelog\n\n{entry}", 1), encoding="utf-8"
    )


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        copy = Path(tmp) / "fixture-package"
        shutil.copytree(HERE / "fixture-package", copy)
        bump(copy, "0.3.0", NEW_VERSION)
        print("after step 2:", run_check(copy))
        add_changelog_entry(copy, NEW_VERSION, "Add `remove N`.")
        print("after step 3:", run_check(copy))
