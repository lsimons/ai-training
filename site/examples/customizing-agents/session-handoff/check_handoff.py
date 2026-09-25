"""Check which parts of the session in `session.md` a handoff file names.

For the lesson "Handing work to the next session".

Run it on a handoff file:   python3 check_handoff.py samples/files-only.md

The session ended with work left to do. A next session needs these facts
from it, and none of them is in the diff:

- the state: the edit to `test_reports.py` was ruled out and must be undone
- three decisions with their reasons: keep each time's own offset because
  customers read the export in their own zone, keep UTC as `Z` because the
  billing import reads it, and treat a time without an offset as UTC, as the
  database team confirmed for rows before migration 0007
- the failing test: `test_export_timezone`
- what was ruled out: the server's local time zone
- where the fix goes: `format_ts()` in `reports.py`

For each fact the script looks for the words that name it, without regard to
upper or lower case, and prints `named` or `missing`. It only matches words.
A handoff that states a fact in other words is reported as `missing`, so
read the file yourself before you trust a `missing`. A `named` only means
that the words are there, not that the handoff states the fact.
"""

import sys
from pathlib import Path

# Each fact is a label and a list of word groups. Every group must match,
# and a group matches when any one of its words is in the handoff.
FACTS: "list[tuple[str, list[list[str]]]]" = [
    (
        "state, undo the edit to test_reports.py",
        [["test_reports.py"], ["undo", "revert", "restore", "roll back", "put back"]],
    ),
    ("decision, keep each offset, for customers", [["offset"], ["customer"]]),
    ("decision, UTC stays Z, for billing", [["billing"]]),
    ("decision, no offset means UTC", [["0007", "database team"]]),
    ("failing test, test_export_timezone", [["test_export_timezone"]]),
    ("ruled out, the server's time zone", [["server"]]),
    ("where the fix goes, format_ts()", [["format_ts"]]),
]


def is_named(text: str, groups: "list[list[str]]") -> bool:
    """Return True when every word group has a word in `text`."""
    lower = text.lower()
    return all(any(word in lower for word in group) for group in groups)


def report(label: str, text: str) -> "list[str]":
    """Return the lines the script prints for one handoff file."""
    lines = [label]
    named = 0
    for name, groups in FACTS:
        if is_named(text, groups):
            named += 1
            lines.append(f"  {name}: named")
        else:
            lines.append(f"  {name}: missing")
    lines.append(f"named {named} of {len(FACTS)}")
    return lines


def main(argv: "list[str]") -> int:
    if len(argv) != 2:
        print("usage: python3 check_handoff.py <handoff-file>", file=sys.stderr)
        return 2
    path = Path(argv[1]).expanduser()
    print("\n".join(report(argv[1], path.read_text(encoding="utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
