"""Runs the scanner after the key has left the settings file.

The settings file is clean. The transcript and the .env file are not, and
that is the point of the section that shows this output.
"""

import sys

from _common import DENY, HELPER, clean_env, in_copy, run, write_settings


def main(repo: str) -> int:
    write_settings(repo, key_helper=HELPER, deny=DENY)
    run(repo, "scan.py", clean_env())
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
