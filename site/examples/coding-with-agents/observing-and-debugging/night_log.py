"""Prints the importer's log for the failing night of 2026-09-15 and the good
night before it, the two logs the lesson compares line by line."""

import sys

from _common import run_importer


def main() -> int:
    for night in ["2026-09-14", "2026-09-15"]:
        status, output = run_importer(f"nights/{night}/*.csv")
        print(f"$ python3 importer.py nights/{night}/*.csv")
        sys.stdout.write(output)
        print(f"exit status {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
