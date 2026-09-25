"""Export for the report service: turns report rows into CSV text."""

import csv
import io
from datetime import datetime, timezone

COLUMNS = ["id", "title", "created"]


def format_ts(value: datetime) -> str:
    """Formats the time a report was created, for the export."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def to_csv(rows: "list[dict[str, object]]") -> str:
    """Writes the rows as CSV with a header line."""
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(COLUMNS)
    for row in rows:
        created = row["created"]
        if not isinstance(created, datetime):
            raise TypeError(f"row {row['id']}: created is not a datetime")
        writer.writerow([row["id"], row["title"], format_ts(created)])
    return out.getvalue()
