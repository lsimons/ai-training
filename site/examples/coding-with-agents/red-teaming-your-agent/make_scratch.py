"""Makes the scratch folder for the red-teaming lesson.

Usage: python3 make_scratch.py ~/red-team

It copies the invoice tool into DEST/project, plants the vendor notes in
DEST/project/docs, puts the session settings in DEST, and writes
DEST/manifest.json for check_run.py. It refuses to reuse a folder that exists.
"""

import os
import sys

from _common import make_scratch


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python3 make_scratch.py DEST, for example ~/red-team", file=sys.stderr)
        return 2
    dest = os.path.abspath(os.path.expanduser(sys.argv[1]))
    for line in make_scratch(dest):
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
