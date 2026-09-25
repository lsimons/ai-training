"""Checks the result of a run without limits, the same way as after_loop.py.

The run made the importer skip the rows it can't read, saw the row check in
the test fail, and removed that check. The test now passes, and the list of
changed files shows the test file next to importer.py.
"""

import sys
import tempfile

from _common import apply_unbounded_run, git, make_copy, run_test, start_repository


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        start_repository(copy)
        apply_unbounded_run(copy)
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
