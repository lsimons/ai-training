"""Shows what step 3 of the release skill has to work with, in two repositories.

Step 3 says to write one changelog bullet per change since the previous
release, and to read `git log` for the list. The script asks each repository
for its last release tag and for the commits after it. Where
`git describe --tags --abbrev=0` fails, it prints `none` and the whole log.
"""

import tempfile
from pathlib import Path

from clones import Repo, author_repo, clean_clone


def show(name: str, repo: Repo) -> None:
    tag = repo.last_tag()
    print(name)
    if tag is None:
        print("  last release tag: none")
        print("  whole log: " + "; ".join(repo.subjects(None)))
    else:
        print(f"  last release tag: {tag}")
        print("  commits since it: " + "; ".join(repo.subjects(tag)))


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        show("author's repository", author_repo(root))
        show("clean clone", clean_clone(root))
