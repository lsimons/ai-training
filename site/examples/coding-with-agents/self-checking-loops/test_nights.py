"""The reproduction steps of the nightly import, as a test the agent can run.

Copy this file next to importer.py and run it from that directory:

    python3 test_nights.py

It runs the importer on each night the same way the nightly job does, and
prints one line per night. It exits with status 0 when every night passes and
with status 1 when one fails, so an agent can run it and read the result.

A night passes when the importer exits with status 0 and parses every data
row of the night's exports. The test counts those rows itself, one per line
after the header, so a fix that skips a row it can't read still fails. The
two nights that passed before the fault was found must also print the same
totals as before.
"""

import glob
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# Each night, with the total it must print, or None when the total is not
# pinned yet.
NIGHTS = {
    "2026-09-14": "22975.95 EUR",
    "2026-09-15": None,
    "2026-09-16": "23257.33 EUR",
    "2026-09-17": None,
}


def data_rows(paths):
    """Count the rows of the exports: every non-empty line after the header."""
    count = 0
    for path in paths:
        with open(os.path.join(HERE, path), encoding="utf-8") as handle:
            lines = handle.read().splitlines()
        count += len([line for line in lines[1:] if line])
    return count


def check_night(night, total):
    """Return the problems found for one night, or an empty list."""
    paths = sorted(
        os.path.relpath(path, HERE)
        for path in glob.glob(os.path.join(HERE, "nights", night, "*.csv"))
    )
    result = subprocess.run(
        [sys.executable, "importer.py", *paths],
        cwd=HERE,
        capture_output=True,
        text=True,
        check=False,
    )
    problems = []
    if result.returncode != 0:
        problems.append(f"exit status {result.returncode}")
    expected = data_rows(paths)
    parsed = f"INFO parsed {expected} rows"
    if parsed not in result.stdout.splitlines():
        found = [line for line in result.stdout.splitlines() if "parsed" in line]
        seen = found[0].split("parsed ", 1)[1] if found else "no rows"
        problems.append(f"parsed {seen}, expected {expected} rows")
    if total is not None and f"INFO total: {total}" not in result.stdout:
        problems.append(f"total is not {total}")
    return problems


def main():
    failed = 0
    for night, total in NIGHTS.items():
        problems = check_night(night, total)
        if problems:
            failed += 1
            print(f"{night}: FAIL: {'; '.join(problems)}")
        else:
            print(f"{night}: pass")
    print(f"{len(NIGHTS) - failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
