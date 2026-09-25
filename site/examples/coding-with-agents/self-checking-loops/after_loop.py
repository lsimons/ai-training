"""Checks the result of the bounded run: which files changed, then the test.

The copy is committed and tagged `before-run` before the run. Afterwards
`git add -A` stages every change, new files included, and
`git diff --cached --stat before-run` lists every file that differs from
the tag, whether or not the agent made commits of its own. The run briefed
in the lesson may change only importer.py, and the test file must not
appear in the list. The width of the stat is fixed, so the output doesn't
depend on the terminal.
"""

import sys
import tempfile

from _common import apply_fix, git, make_copy, run_test, start_repository


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        start_repository(copy)
        apply_fix(copy)
        print("$ git add -A")
        git(copy, "add", "-A")
        print("$ git diff --cached --stat before-run")
        print(git(copy, "diff", "--cached", "--stat=80", "before-run"), end="")
        status, output = run_test(copy)
        print("$ python3 test_nights.py")
        print(output, end="")
        print(f"exit status {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
