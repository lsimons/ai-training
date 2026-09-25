"""Narrows the failing night of 2026-09-15 to one export by halving.

Each step runs the importer on half of the files that are still suspect. If
that half passes, the cause is in the other half. If it fails, the cause is in
this one. Eight files take three steps, and a fourth run confirms the one left.
"""

import sys

from _common import run_importer, verdict

STEPS = [
    ("store-0[1-4].csv", "store-01 to store-04"),
    ("store-0[5-6].csv", "store-05 and store-06"),
    ("store-05.csv", "store-05"),
    ("store-06.csv", "store-06"),
]


def main() -> int:
    for pattern, label in STEPS:
        status, _ = run_importer(f"nights/2026-09-15/{pattern}")
        print(f"{label}: {verdict(status)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
