"""Builds the practice repository in a temporary directory and shows what a fresh session finds.

The lesson has the learner run `git status --short`, `git diff --stat=60`
and the tests in the practice repository. This wrapper runs the same three
in a temporary copy, so `mise run examples` can assert their output. The
width of the stat is fixed so the output doesn't depend on the terminal.
"""

import os
import sys
import tempfile

from _common import build, git, test_verdict


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        repo = os.path.join(tmpdir, "handoff-practice")
        build(repo)
        sys.stdout.write(git(repo, "status", "--short").stdout)
        sys.stdout.write(git(repo, "diff", "--stat=60").stdout)
        print(f"tests: {test_verdict(repo)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
