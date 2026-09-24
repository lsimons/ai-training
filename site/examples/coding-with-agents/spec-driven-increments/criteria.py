"""Checks each success criterion of SPEC.md against a copy after increment one.

The spec is the source of truth, so the check reads like the spec: one line
per criterion, pass or not yet. After the first increment the criteria it
claims pass and the rest don't. Each criterion runs on its own fresh copy, so
one can't taint the next.
"""

import json
import os
import subprocess
import sys
from typing import Callable

from _common import in_copy, land_first_increment, run_todo


def criterion_1(repo: str) -> bool:
    run_todo(repo, "due", "1", "2026-10-01")
    lines = run_todo(repo, "list").stdout.splitlines()
    return lines == [
        "1. [ ] Buy milk (due 2026-10-01)",
        "2. [x] Call the plumber",
        "3. [x] Renew the passport",
        "4. [ ] Water the plants",
        "2 open, 2 done",
    ]


def criterion_2(repo: str) -> bool:
    return "(due" not in run_todo(repo, "list").stdout


def criterion_3(repo: str) -> bool:
    run_todo(repo, "due", "1", "2026-10-01")
    later = run_todo(repo, "overdue", today="2026-10-02")
    earlier = run_todo(repo, "overdue", today="2026-09-30")
    return (
        later.stdout == "1. [ ] Buy milk (due 2026-10-01)\n"
        and earlier.stdout == "nothing overdue\n"
    )


def criterion_4(repo: str) -> bool:
    path = os.path.join(repo, "todos.json")
    with open(path, encoding="utf-8") as handle:
        before = json.load(handle)
    result = run_todo(repo, "due", "1", "tomorrow")
    with open(path, encoding="utf-8") as handle:
        after = json.load(handle)
    return result.stdout == "bad date: tomorrow\n" and result.returncode == 2 and before == after


def criterion_5(repo: str) -> bool:
    result = subprocess.run(
        [sys.executable, "-m", "unittest", "-q"], cwd=repo, capture_output=True, text=True
    )
    return result.returncode == 0


CRITERIA: "list[Callable[[str], bool]]" = [
    criterion_1,
    criterion_2,
    criterion_3,
    criterion_4,
    criterion_5,
]


def check_on_fresh_copy(check: Callable[[str], bool]) -> bool:
    def prepared(repo: str) -> int:
        land_first_increment(repo)
        return int(check(repo))

    return bool(in_copy(prepared))


def main() -> int:
    passed = 0
    for number, check in enumerate(CRITERIA, start=1):
        ok = check_on_fresh_copy(check)
        passed += int(ok)
        print(f"criterion {number}: {'pass' if ok else 'not yet'}")
    print(f"{passed} of {len(CRITERIA)} criteria pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
