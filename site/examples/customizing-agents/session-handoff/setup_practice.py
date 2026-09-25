"""Builds the practice repository for the lesson in a directory you name.

    python3 setup_practice.py ~/handoff-practice

The directory must not exist yet. Afterwards it is a git repository with the
report service on `main` and one edit that isn't committed, as the session in
`session.md` left it. The script changes nothing outside that directory.
Delete the directory when you are done.
"""

import os
import sys

from _common import build, git


def main(argv: "list[str]") -> int:
    if len(argv) != 2:
        print((__doc__ or "").strip(), file=sys.stderr)
        return 2
    repo = os.path.abspath(os.path.expanduser(argv[1]))
    if os.path.exists(repo):
        print(f"{repo} exists already, name a directory that doesn't", file=sys.stderr)
        return 2
    build(repo)
    print(f"practice repository ready in {repo}")
    sys.stdout.write(git(repo, "status", "--short").stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
