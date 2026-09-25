"""Runs the importer three times on each night's exports and prints the result.

The report says the import "sometimes fails". Running the same input again is
the first test of that: if every rerun of a night gives the same result, the
failure depends on the input and not on timing or luck. For a night that
passes, the line ends with the total the last run printed.
"""

import sys

from _common import NIGHTS, run_importer, verdict


def main() -> int:
    for night in NIGHTS:
        runs = [run_importer(f"nights/{night}/*.csv") for _ in range(3)]
        line = f"{night}: {' '.join(verdict(status) for status, _ in runs)}"
        status, output = runs[-1]
        if status == 0:
            line += f" ({output.splitlines()[-1].split(' ', 1)[1]})"
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
