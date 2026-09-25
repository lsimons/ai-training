"""Runs the importer three times on each night's exports and prints the result.

The report says the import "sometimes fails". Running the same input again is
the first test of that: if every rerun of a night gives the same result, the
failure depends on the input and not on timing or luck.
"""

import sys

from _common import NIGHTS, run_importer, verdict


def main() -> int:
    for night in NIGHTS:
        results = [verdict(run_importer(f"nights/{night}/*.csv")[0]) for _ in range(3)]
        print(f"{night}: {' '.join(results)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
