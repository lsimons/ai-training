"""importer: add up one night's sales exports into a total in euros.

Usage:
    python3 importer.py nights/2026-09-14/*.csv

Every store sends one CSV file a night, with the header
`date,store,currency,amount` and one row per sale. The rates in `rates.json`
convert each amount to euros. If any row can't be read, the whole batch is
rejected, so a total is never printed for part of a night.

The program writes its log to standard output, one line per step, and exits
with status 1 when the batch is rejected.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RATES = os.path.join(HERE, "rates.json")
FIELDS = 4


def log(level, message):
    print(f"{level} {message}")


def load_rates(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def read_rows(path):
    """Return the data rows of one export, each split into its fields."""
    with open(path, encoding="utf-8") as handle:
        lines = handle.read().splitlines()
    return [line.split(",") for line in lines[1:] if line]


def main(argv):
    paths = argv[1:]
    if not paths:
        print("usage: python3 importer.py nights/<date>/*.csv")
        return 2
    log("INFO", f"reading {len(paths)} files")
    rates = load_rates(RATES)
    log("INFO", f"rates: {len(rates)} currencies loaded")
    rows = []
    bad = 0
    for path in paths:
        for fields in read_rows(path):
            if len(fields) != FIELDS:
                bad += 1
                continue
            rows.append(fields)
    log("INFO", f"parsed {len(rows)} rows")
    if bad:
        log("ERROR", f"{bad} row(s) with the wrong number of fields, batch rejected")
        return 1
    total = sum(float(amount) * rates[currency] for _, _, currency, amount in rows)
    log("INFO", f"total: {total:.2f} EUR")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
