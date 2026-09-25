"""Builds the git repositories the testing-a-skill fixtures compare.

Both start from a copy of the first-skill fixture package, one directory
over, and never change that package. The author's repository has the history
the release skill was written in: the package committed as release 0.3.0,
the tag `v0.3.0` on that commit, and one change after it. The clean clone is
what a colleague has after copying the package and committing it: one commit
and no tag.

Every git command runs with an allow-list environment: PATH, a temporary
HOME, LC_ALL=C, a fixed identity and date, and the global and system config
at /dev/null. No setting or hook from the machine that runs the fixture
reaches the repositories, so the output is the same everywhere.
"""

import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent / "first-skill" / "fixture-package"

CHANGE_SUBJECT = "Document where notes are stored"
CHANGE_TEXT = "\nNotes are stored in `notes.json`, next to `notes.py`.\n"
FIXED_DATE = "2026-09-25T12:00:00+00:00"


def git_env(home: Path) -> dict[str, str]:
    """The only variables git sees. Nothing else from the caller's environment passes."""
    return {
        "PATH": os.environ.get("PATH", os.defpath),
        "HOME": str(home),
        "LC_ALL": "C",
        "GIT_CONFIG_GLOBAL": os.devnull,
        "GIT_CONFIG_SYSTEM": os.devnull,
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_AUTHOR_NAME": "Learner",
        "GIT_AUTHOR_EMAIL": "learner@example.com",
        "GIT_AUTHOR_DATE": FIXED_DATE,
        "GIT_COMMITTER_NAME": "Learner",
        "GIT_COMMITTER_EMAIL": "learner@example.com",
        "GIT_COMMITTER_DATE": FIXED_DATE,
    }


class Repo:
    """A copy of the fixture package with its own git repository."""

    def __init__(self, path: Path, home: Path) -> None:
        self.path = path
        self.env = git_env(home)

    def git(self, *args: str, check: bool = True) -> "subprocess.CompletedProcess[str]":
        result = subprocess.run(
            ["git", *args],
            cwd=self.path,
            env=self.env,
            capture_output=True,
            text=True,
            check=False,
        )
        if check and result.returncode != 0:
            raise SystemExit(f"git {' '.join(args)} failed:\n{result.stdout}{result.stderr}")
        return result

    def last_tag(self) -> Optional[str]:
        """What `git describe --tags --abbrev=0` prints, or None when it fails."""
        result = self.git("describe", "--tags", "--abbrev=0", check=False)
        return result.stdout.strip() if result.returncode == 0 else None

    def subjects(self, since: Optional[str]) -> list[str]:
        """The commit subjects after the tag `since`, or of the whole log, newest first."""
        revisions = [f"{since}..HEAD"] if since else []
        return self.git("log", "--format=%s", *revisions).stdout.splitlines()


def _copy_package(root: Path, name: str) -> Repo:
    home = root / f"{name}-home"
    home.mkdir(parents=True)
    path = root / name
    shutil.copytree(PACKAGE, path, ignore=shutil.ignore_patterns("__pycache__"))
    repo = Repo(path, home)
    repo.git("init", "-q", "--initial-branch=main")
    return repo


def author_repo(root: Path) -> Repo:
    """The repository the skill was written in: release 0.3.0 tagged, and one change since."""
    repo = _copy_package(root, "author")
    repo.git("add", ".")
    repo.git("commit", "-q", "-m", "release: 0.3.0")
    repo.git("tag", "v0.3.0")
    with (repo.path / "README.md").open("a", encoding="utf-8") as readme:
        readme.write(CHANGE_TEXT)
    repo.git("commit", "-q", "-a", "-m", CHANGE_SUBJECT)
    return repo


def clean_clone(root: Path) -> Repo:
    """A colleague's copy: the package committed once, with no tag."""
    repo = _copy_package(root, "clean-clone")
    repo.git("add", ".")
    repo.git("commit", "-q", "-m", "Import the notes package")
    return repo
