"""Check which of the three planted facts a session summary still holds.

For the lesson "Directing the summary before compaction".

Run it on a summary file:   python3 check_summary.py samples/unguided.md

The log in `transcript.md` plants three facts in a session:

- a rule the user set at the start: don't change anything under
  `migrations/`
- a decision from the middle: keep `/v1/export` until March 31
- an open item from later on: the failing test `test_export_timezone`

For each fact the script looks for the words that name it, without regard
to upper or lower case, and prints `kept` or `lost`. It only matches words.
A summary that states a fact in other words ("the old export route") is
reported as `lost`, so read the summary yourself before you trust a `lost`.
"""

import sys
from pathlib import Path

# Each fact is a label and a list of word groups. Every group must match,
# and a group matches when any one of its words is in the summary.
FACTS: list[tuple[str, list[list[str]]]] = [
    ("rule, don't change migrations/", [["migrations"]]),
    (
        "decision, keep /v1/export until March 31",
        [["v1"], ["march 31", "31 march", "mar 31", "31 mar", "03-31", "3/31"]],
    ),
    ("open item, test_export_timezone", [["test_export_timezone"]]),
]


def is_kept(text: str, groups: list[list[str]]) -> bool:
    """Return True when every word group has a word in `text`."""
    lower = text.lower()
    return all(any(word in lower for word in group) for group in groups)


def report(label: str, text: str) -> list[str]:
    """Return the lines the script prints for one summary."""
    lines = [label]
    kept = 0
    for name, groups in FACTS:
        if is_kept(text, groups):
            kept += 1
            lines.append(f"  {name}: kept")
        else:
            lines.append(f"  {name}: lost")
    lines.append(f"kept {kept} of {len(FACTS)}")
    return lines


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: python3 check_summary.py <summary-file>", file=sys.stderr)
        return 2
    path = Path(argv[1])
    print("\n".join(report(argv[1], path.read_text(encoding="utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
