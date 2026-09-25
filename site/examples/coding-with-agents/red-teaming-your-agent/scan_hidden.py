"""Lists text that a reader doesn't see and an agent does.

Usage: python3 scan_hidden.py FOLDER

It prints one line per HTML comment and per invisible character (zero-width
characters and bidirectional overrides) in the text files under FOLDER, and
exits with status 1 when there is one. A hit isn't always an attack: it is a
line for a person to read before an agent does.
"""

import os
import sys

from _common import scan_hidden


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python3 scan_hidden.py FOLDER", file=sys.stderr)
        return 2
    hits = scan_hidden(os.path.abspath(os.path.expanduser(sys.argv[1])))
    for hit in hits:
        print(hit)
    print(f"{len(hits)} hidden-text finding(s)")
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
