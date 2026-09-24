"""Counts what the main conversation takes in with and without a reviewer subagent.

Without delegation the main agent reads the diff itself, and the whole diff
sits in its context. With delegation the reviewer reads the diff in its own
context window and the main agent takes in only the report. `clear.diff` is
the change the lesson reviews, and `report.txt` is the illustrative report
the lesson shows. Both files are next to this one.
"""

from pathlib import Path

HERE = Path(__file__).resolve().parent


def line_count(name: str) -> int:
    """The number of lines in the file `name`, next to this script."""
    return len((HERE / name).read_text(encoding="utf-8").splitlines())


if __name__ == "__main__":
    diff_lines = line_count("clear.diff")
    report_lines = line_count("report.txt")
    print(f"diff: {diff_lines} lines")
    print(f"report: {report_lines} lines")
    print(f"saved: {diff_lines - report_lines} lines")
