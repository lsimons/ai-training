"""Read an agent's permission list and print what each row reaches.

The fixture behind the lesson "Sizing an agent's blast radius". The task is
to tidy one shared folder. The permission list is what the agent was given
for it. For each row the fixture prints what the row reaches, how many
people can be affected, and whether its actions can be undone. It then
does the same for the list with the rows the task does not need crossed out
and the rest narrowed to the one folder.

Nothing here talks to a model, a drive or a mail server. The rows and the
audience sizes are invented, and the undo rule is written out below.
"""

from typing import NamedTuple, Optional


class Row(NamedTuple):
    number: int
    kind: str  # read, write or send
    where: str
    actions: str


# Who a row reaches in each place: a label for the report and a head count.
# A count of None means there is no fixed limit.
AUDIENCE = {
    "Team drive, every folder": ("14 people", 14),
    "Team drive/Projects/2025": ("5 people", 5),
    "your mailbox": ("you, and everyone who wrote to you", 1),
    "mail from your address": ("anyone with an address", None),
    "all-staff chat channel": ("120 people", 120),
}

GRANTED = [
    Row(1, "read", "Team drive, every folder", "open, list"),
    Row(2, "write", "Team drive, every folder", "create, move, rename"),
    Row(3, "write", "Team drive, every folder", "delete (no trash)"),
    Row(4, "read", "your mailbox", "open, search"),
    Row(5, "send", "mail from your address", "to any address"),
    Row(6, "send", "all-staff chat channel", "post"),
]

# The same list after the tidy-up task is applied to it: rows 4, 5 and 6
# crossed out, and rows 1 to 3 narrowed to the one folder.
FOLDER = "Team drive/Projects/2025"
NEEDED = [
    Row(1, "read", FOLDER, "open, list"),
    Row(2, "write", FOLDER, "create, move, rename"),
    Row(3, "write", FOLDER, "delete (no trash)"),
]


def undo(row: Row) -> str:
    """Return whether the row's actions can be undone.

    Reading changes nothing. A move or a rename can be moved or renamed
    back. A delete with no trash cannot be restored, and a message that
    someone has read cannot be taken back.
    """
    if row.kind == "read":
        return "nothing to undo"
    if row.kind == "send" or "delete" in row.actions:
        return "no"
    return "yes"


def most(rows: list[Row]) -> Optional[str]:
    """Return the widest audience among the rows that change something."""
    changing = [AUDIENCE[row.where] for row in rows if row.kind != "read"]
    unlimited = [label for label, count in changing if count is None]
    if unlimited:
        return unlimited[0]
    if not changing:
        return None
    return max(changing, key=lambda audience: audience[1] or 0)[0]


def report(title: str, rows: list[Row]) -> str:
    """Return one block of the report: a line per row, then a summary."""
    lines = [title]
    for row in rows:
        lines.append(f"  row {row.number}  {row.kind:<5}  {row.where}: {row.actions}")
        lines.append(f"         reaches: {AUDIENCE[row.where][0]}   can be undone: {undo(row)}")
    final = [str(row.number) for row in rows if undo(row) == "no"]
    lines.append(f"  rows that cannot be undone: {', '.join(final) or 'none'}")
    lines.append(f"  most people one wrong step can affect: {most(rows) or 'nobody'}")
    return "\n".join(lines)


if __name__ == "__main__":
    print(report("as granted", GRANTED))
    print()
    print(report("as the task needs", NEEDED))
