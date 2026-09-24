"""Searches the fixture for the words of the vague brief, the way an agent's
first grep would, and names the files each word matches."""

import os
import sys

from _common import REPO, repo_files

WORDS = ["done", "undo"]


def matches(word: str) -> list[str]:
    hits = []
    for name in repo_files(REPO):
        with open(os.path.join(REPO, name), encoding="utf-8") as handle:
            if word in handle.read().lower():
                hits.append(name)
    return hits


def main() -> int:
    for word in WORDS:
        hits = matches(word)
        noun = "file" if len(hits) == 1 else "files"
        print(f"{word}: {len(hits)} {noun}")
        for name in hits:
            print(f"  {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
