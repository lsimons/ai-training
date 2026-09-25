"""Builds the git repositories the testing-a-skill fixtures compare.

Both start from a copy of the first-skill fixture package, one directory
over, and never change that package. The author's repository has the history
the release skill was written in: the package committed as release 0.3.0,
the tag `v0.3.0` on that commit, and one change after it. The clean clone is
what a colleague has after copying the package and committing it: one commit
and no tag.

The copy holds the package as it is committed in the course repository, so
a local edit or an untracked file in `fixture-package` (left by a learner
who ran the first-skill exercise in place) doesn't change what the fixtures
print. Where the package isn't in a git checkout, as in a download of the
examples without `.git`, there is no committed version to read: the copy
takes the files as they are, and a note on stderr says so.

Every git command runs with an allow-list environment: PATH, a temporary
HOME, LC_ALL=C, a fixed identity and date, and the global and system config
at /dev/null. No setting or hook from the machine that runs the fixture
reaches the repositories, so the output is the same everywhere.
"""

import os
import shutil
import subprocess
import sys
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


def python_env() -> dict[str, str]:
    """The only variables the package's release check sees.

    An allow-list like `git_env`, so a PYTHONPATH, PYTHONSAFEPATH or color
    setting in the caller's environment can't change what the check prints.
    The same list is `python_env` in first-skill's `check.py`: keep the two
    in step.
    """
    return {
        "PATH": os.environ.get("PATH", os.defpath),
        "PYTHONDONTWRITEBYTECODE": "1",
        "NO_COLOR": "1",
        "PYTHON_COLORS": "0",
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


def _git_bytes(cwd: Path, env: dict[str, str], *args: str) -> Optional[bytes]:
    """What a git command prints, as bytes, or None when it fails."""
    result = subprocess.run(["git", *args], cwd=cwd, env=env, capture_output=True, check=False)
    return result.stdout if result.returncode == 0 else None


def copy_tracked(source: Path, dest: Path, env: dict[str, str]) -> bool:
    """Writes the files committed at HEAD under `source` into `dest`.

    Returns False, and writes nothing, when `source` isn't committed in a git
    checkout. Local edits and untracked files in `source` never reach `dest`.
    """
    prefix = _git_bytes(source, env, "rev-parse", "--show-prefix")
    if prefix is None:
        return False
    # `--full-tree` because ls-tree run in a subdirectory otherwise also
    # filters the listing by that subdirectory, and prints nothing here.
    tree = "HEAD:" + prefix.decode("utf-8").strip()
    listing = _git_bytes(source, env, "ls-tree", "--full-tree", "-r", "-z", tree)
    if not listing:
        return False
    for entry in listing.decode("utf-8").split("\0"):
        if not entry:
            continue
        meta, name = entry.split("\t", 1)
        mode, kind, obj = meta.split(" ")
        if "__pycache__" in name.split("/"):
            continue
        if kind != "blob" or mode not in ("100644", "100755"):
            raise SystemExit(f"{source / name}: mode {mode} {kind} is not a plain file")
        content = _git_bytes(source, env, "cat-file", "blob", obj)
        if content is None:
            raise SystemExit(f"git cat-file blob {obj} failed for {source / name}")
        target = dest / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        if mode == "100755":
            target.chmod(0o755)
    return True


def _copy_package(root: Path, name: str) -> Repo:
    home = root / f"{name}-home"
    home.mkdir(parents=True)
    path = root / name
    if not copy_tracked(PACKAGE, path, git_env(home)):
        print(
            f"note: {PACKAGE} is not committed in a git checkout, so the copy"
            " takes its files as they are, local edits included",
            file=sys.stderr,
        )
        shutil.copytree(PACKAGE, path, ignore=shutil.ignore_patterns(".git", "__pycache__"))
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
