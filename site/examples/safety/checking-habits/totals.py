"""Recompute the totals in a model-written summary table.

The fixture behind the lesson "Checking habits that run when you are in a
hurry". A chat assistant was asked to turn three monthly ticket counts per
team into a table with a total per team and a grand total. The program
adds each row again, compares the sum with the total the assistant wrote,
and flags the row that does not add up. Then it does the same for the
grand total.

Nothing here talks to a model. The table, the teams and the numbers are
invented for the lesson, and the wrong total is planted on purpose: it is
the kind of slip a model makes when it writes a table from prose.
"""

# The table as the assistant wrote it: team, the three monthly counts, and
# the total the assistant gave for the row.
TABLE = [
    ("Design", [124, 98, 111], 333),
    ("Support", [82, 86, 90], 258),
    ("Marketing", [145, 162, 139], 466),
    ("Operations", [67, 71, 69], 207),
]

# The grand total the assistant wrote under the table.
WRITTEN_GRAND_TOTAL = 1264


def check_rows(table: "list[tuple[str, list[int], int]]") -> "list[str]":
    """Return one line per row: the recomputed sum against the written total."""
    lines = []
    for team, months, written in table:
        computed = sum(months)
        verdict = "ok      " if computed == written else "MISMATCH"
        lines.append(f"{verdict}  {team:<11} written {written:>5}  recomputed {computed:>5}")
    return lines


def check_grand_total(table: "list[tuple[str, list[int], int]]", written: int) -> str:
    """Return the line for the grand total, recomputed from the months."""
    computed = sum(sum(months) for _, months, _ in table)
    verdict = "ok      " if computed == written else "MISMATCH"
    return f"{verdict}  {'Grand total':<11} written {written:>5}  recomputed {computed:>5}"


def mismatches(table: "list[tuple[str, list[int], int]]") -> "list[str]":
    """Return the names of the rows whose written total is not the sum of the months."""
    return [team for team, months, written in table if sum(months) != written]


def main() -> None:
    for line in check_rows(TABLE):
        print(line)
    print(check_grand_total(TABLE, WRITTEN_GRAND_TOTAL))
    wrong = mismatches(TABLE)
    print(f"{len(wrong)} of {len(TABLE)} rows do not add up: {', '.join(wrong)}")


if __name__ == "__main__":
    main()
