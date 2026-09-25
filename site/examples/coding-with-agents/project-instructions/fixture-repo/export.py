"""Writing the list as CSV, for a spreadsheet.

Usage:
    python3 export.py > todos.csv
"""

import csv
import sys

import store


def rows(items):
    for number, item in enumerate(items, start=1):
        state = "done" if item["done"] else "open"
        yield [number, item["text"], state]


def main():
    writer = csv.writer(sys.stdout)
    writer.writerow(["number", "text", "state"])
    for row in rows(store.load()):
        writer.writerow(row)
    return 0


if __name__ == "__main__":
    sys.exit(main())
