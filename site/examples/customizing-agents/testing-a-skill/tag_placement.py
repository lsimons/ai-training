"""Shows which success test tells a tag on the release commit from a tag one commit too early.

It releases 0.4.0 twice in the author's repository, once with `git tag`
run before the release commit and once after it. Each time it prints the
release check, the tag list the first version of the skill's "Done when"
reads (one line per tag in git's output, joined with spaces here), and
`git describe --tags`, with the commit hash that git appends replaced by
`<hash>`.
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

from clones import Repo, author_repo

NEW_VERSION = "0.4.0"


def prepare_release(repo: Repo) -> None:
    """Steps 2 and 3 of the skill: the version line and the changelog entry."""
    source = repo.path / "notes.py"
    source.write_text(
        source.read_text(encoding="utf-8").replace(
            '__version__ = "0.3.0"', f'__version__ = "{NEW_VERSION}"'
        ),
        encoding="utf-8",
    )
    changelog = repo.path / "CHANGELOG.md"
    entry = f"## {NEW_VERSION}\n\n- Document where notes are stored.\n\n"
    changelog.write_text(
        changelog.read_text(encoding="utf-8").replace(
            "# Changelog\n\n", f"# Changelog\n\n{entry}", 1
        ),
        encoding="utf-8",
    )


def release_check(repo: Repo) -> str:
    result = subprocess.run(
        [sys.executable, "release_check.py"],
        cwd=repo.path,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.stdout.strip()


def commit(repo: Repo) -> None:
    repo.git("add", "notes.py", "CHANGELOG.md")
    repo.git("commit", "-q", "-m", f"release: {NEW_VERSION}")


def show(name: str, repo: Repo) -> None:
    tags = repo.git("tag", "--list", "v*").stdout.split()
    described = repo.git("describe", "--tags").stdout.strip()
    print(name)
    print(f"  release_check.py: {release_check(repo)}")
    print("  git tag --list 'v*': " + " ".join(tags))
    print("  git describe --tags: " + re.sub(r"-g[0-9a-f]+$", "-g<hash>", described))


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        early = author_repo(root / "early")
        prepare_release(early)
        early.git("tag", f"v{NEW_VERSION}")
        commit(early)
        show("tag before the commit", early)

        right = author_repo(root / "right")
        prepare_release(right)
        commit(right)
        right.git("tag", f"v{NEW_VERSION}")
        show("tag after the commit", right)
