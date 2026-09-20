"""Check action items against what a tracker import accepts.

The tracker in the lesson imports one item at a time, and each item needs
exactly four fields: owner, task, due (a date written as YYYY-MM-DD) and
priority (one of high, medium, low). This script reads a file of items
that a chat assistant produced and prints one line per item, `ok` or
`FAIL`, then a summary. Two input formats are accepted, and the file
decides which one is read:

- A JSON array (the file starts with `[`), one object per item.
- One line per item, fields separated by `|`, each written as `name: value`.

Lines that start with three backticks are skipped, because chat tools often
wrap their answer in a code fence.

Usage: python3 check_items.py FILE

Standard library only, Python 3.9 or later.
"""

import datetime
import json
import sys

FIELDS = ["owner", "task", "due", "priority"]
PRIORITIES = {"high", "medium", "low"}


def strip_fences(text):
    """Drop the code fence lines a chat tool may wrap its answer in."""
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith("```"))


def parse_lines(text):
    """One item per non-empty line, fields as `name: value` separated by `|`."""
    items = []
    for line in text.splitlines():
        if not line.strip():
            continue
        item = {}
        for part in line.split("|"):
            name, sep, value = part.partition(":")
            if sep:
                item[name.strip()] = value.strip()
        items.append(item)
    return items


def parse(text):
    """Return the items as a list of dicts, or an error message."""
    text = strip_fences(text).strip()
    if not text.startswith("["):
        return parse_lines(text), None
    try:
        data = json.loads(text)
    except ValueError as exc:
        return [], f"not valid JSON: {exc}"
    if not all(isinstance(item, dict) for item in data):
        return [], "expected a JSON array of objects, one per item"
    return data, None


def problems(item):
    """Every reason this one item would be rejected by the import."""
    found = []
    missing = [f for f in FIELDS if f not in item]
    extra = [k for k in item if k not in FIELDS]
    if missing:
        text = "missing " + ", ".join(missing)
        if extra:
            text += " (found " + ", ".join(extra) + ")"
        found.append(text)
    elif extra:
        found.append("unexpected " + ", ".join(extra))
    for name in ("owner", "task"):
        if name in item and not str(item[name]).strip():
            found.append(f"{name} is empty")
    if "due" in item:
        try:
            datetime.date.fromisoformat(str(item["due"]))
        except ValueError:
            found.append(f'due "{item["due"]}" is not a date written as YYYY-MM-DD')
    if "priority" in item and item["priority"] not in PRIORITIES:
        allowed = ", ".join(sorted(PRIORITIES))
        found.append(f'priority "{item["priority"]}" is not one of {allowed}')
    return found


def report(items):
    """Print one line per item and problem, then the summary. Returns the pass count."""
    passed = 0
    for number, item in enumerate(items, start=1):
        found = problems(item)
        if found:
            for text in found:
                print(f"FAIL {number}: {text}")
        else:
            passed += 1
            print(f"ok {number}: " + ", ".join(str(item[f]) for f in FIELDS))
    print(f"{passed} of {len(items)} items pass")
    return passed


def main(argv):
    if len(argv) != 2:
        print("usage: python3 check_items.py FILE")
        return 2
    with open(argv[1], encoding="utf-8") as f:
        items, error = parse(f.read())
    if error:
        print(f"FAIL: {error}")
        return 1
    passed = report(items)
    return 0 if items and passed == len(items) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
