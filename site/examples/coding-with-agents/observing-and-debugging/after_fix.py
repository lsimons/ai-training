"""Applies the fix the lesson briefs for, on a copy, and reruns the reproduction.

The fix reads each export with the `csv` module, so a quoted amount such as
"1,250.00" stays one field, and drops the thousands separator before the
amount is turned into a number. The check is the reproduction from the start
of the lesson: every night, run the same way, and the totals of the nights
that passed before must not change.
"""

import os
import shutil
import sys
import tempfile

from _common import NIGHTLY, NIGHTS, run_importer, verdict

BUGGY_READ_ROWS = """    with open(path, encoding="utf-8") as handle:
        lines = handle.read().splitlines()
    return [line.split(",") for line in lines[1:] if line]
"""

FIXED_READ_ROWS = """    with open(path, encoding="utf-8", newline="") as handle:
        rows = list(csv.reader(handle))
    return [fields for fields in rows[1:] if fields]
"""

BUGGY_TOTAL = "float(amount) * rates[currency]"
FIXED_TOTAL = 'float(amount.replace(",", "")) * rates[currency]'


def apply_fix(importer: str) -> None:
    with open(importer, encoding="utf-8") as handle:
        source = handle.read()
    if BUGGY_READ_ROWS not in source or BUGGY_TOTAL not in source:
        raise SystemExit("importer.py no longer holds the code the lesson fixes")
    source = source.replace(BUGGY_READ_ROWS, FIXED_READ_ROWS)
    source = source.replace(BUGGY_TOTAL, FIXED_TOTAL)
    source = source.replace("import json\n", "import csv\nimport json\n")
    with open(importer, "w", encoding="utf-8") as handle:
        handle.write(source)


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = os.path.join(tmpdir, "nightly")
        shutil.copytree(NIGHTLY, copy)
        apply_fix(os.path.join(copy, "importer.py"))
        for night in NIGHTS:
            status, output = run_importer(f"nights/{night}/*.csv", cwd=copy)
            last = output.splitlines()[-1]
            print(f"{night}: {verdict(status)}, {last.split(' ', 1)[1]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
