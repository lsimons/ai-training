"""Checks the prepared agent branch against the five success criteria of SPEC.md.

Each line is one criterion, checked the way the spec states it: run the
command, compare the output. `ok` means the branch does what the line says,
and a failure quotes what the branch did instead. Criterion 2 is checked
before criterion 1 writes a date to the file, and the lines print in spec
order. The suite verdict is the last line of `python3 -m unittest -q`.
"""

import json
import os
import sys

from _common import in_copy, run_todo, test_verdict


def read_items(repo: str) -> "list[dict[str, object]]":
    with open(os.path.join(repo, "todos.json"), encoding="utf-8") as handle:
        return json.load(handle)


VERDICTS: "dict[int, str]" = {}


def verdict(number: int, name: str, problems: "list[str]") -> None:
    VERDICTS[number] = f"{number}. {name}: {'ok' if not problems else '; '.join(problems)}"


def quote(output: str) -> str:
    return "an empty line" if output == "\n" else repr(output.rstrip("\n"))


def check_list_shows_date(repo: str) -> None:
    before = run_todo(repo, "list").stdout.splitlines()
    run_todo(repo, "due", "1", "2026-10-01")
    after = run_todo(repo, "list").stdout.splitlines()
    problems = []
    first = after[0] if after else ""
    if first != "1. [ ] Buy milk (due 2026-10-01)":
        problems.append(f"first line is {first!r}")
    if after[1:] != before[1:]:
        problems.append("other lines changed")
    verdict(1, "due then list", problems)


def check_committed_file_lists_as_before(repo: str) -> None:
    output = run_todo(repo, "list").stdout
    expected = "\n".join(
        [
            "1. [ ] Buy milk",
            "2. [x] Call the plumber",
            "3. [x] Renew the passport",
            "4. [ ] Water the plants",
            "2 open, 2 done",
            "",
        ]
    )
    problems = [] if output == expected else [f"printed {quote(output)}"]
    verdict(2, "committed file lists as before", problems)


def check_overdue(repo: str) -> None:
    """Runs after criterion 1 set the date on item 1, as the spec's order has it."""
    problems = []
    past = run_todo(repo, "overdue", today="2026-10-02").stdout
    if past != "1. [ ] Buy milk (due 2026-10-01)\n":
        problems.append(f"2026-10-02 printed {quote(past)}")
    future = run_todo(repo, "overdue", today="2026-09-30").stdout
    if future != "nothing overdue\n":
        problems.append(f"2026-09-30 printed {quote(future)}")
    verdict(3, "overdue", problems)


def check_bad_date(repo: str) -> None:
    before = read_items(repo)
    result = run_todo(repo, "due", "1", "tomorrow")
    problems = []
    if result.stdout != "bad date: tomorrow\n":
        problems.append(f"printed {quote(result.stdout)}")
    if result.returncode != 2:
        problems.append(f"exit status {result.returncode}")
    if read_items(repo) != before:
        problems.append("file changed")
    verdict(4, "bad date", problems)


def check_suite(repo: str) -> None:
    VERDICTS[5] = f"5. unittest: {test_verdict(repo)}"


def main(repo: str) -> int:
    check_committed_file_lists_as_before(repo)
    check_list_shows_date(repo)
    check_overdue(repo)
    check_bad_date(repo)
    check_suite(repo)
    for number in sorted(VERDICTS):
        print(VERDICTS[number])
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
