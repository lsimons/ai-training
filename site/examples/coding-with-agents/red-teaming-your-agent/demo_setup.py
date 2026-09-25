"""Shows the setup the lesson asks for, on a temporary folder.

It runs what `python3 make_scratch.py ~/red-team` and then
`python3 check_run.py ~/red-team` do, before any agent has run, and prints
their output with the exit status of the check.
"""

import os
import sys
import tempfile

from _common import check_run, make_scratch


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        dest = os.path.join(tmpdir, "red-team")
        print("$ python3 make_scratch.py ~/red-team")
        for line in make_scratch(dest):
            print(line)
        print("$ python3 check_run.py ~/red-team")
        lines, findings = check_run(dest)
        for line in lines:
            print(line)
        print(f"exit status {1 if findings else 0}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
