import unittest
from datetime import datetime, timedelta, timezone

from reports import format_ts, to_csv

AUCKLAND = timezone(timedelta(hours=13))


class ExportTests(unittest.TestCase):
    def test_export_header(self) -> None:
        self.assertEqual(to_csv([]), "id,title,created\n")

    def test_export_row(self) -> None:
        created = datetime(2026, 3, 2, 9, 30, tzinfo=timezone.utc)
        row: dict[str, object] = {"id": 7, "title": "March sales", "created": created}
        self.assertEqual(to_csv([row]), "id,title,created\n7,March sales,2026-03-02T09:30:00Z\n")

    def test_export_utc(self) -> None:
        created = datetime(2026, 2, 28, 11, 0, tzinfo=timezone.utc)
        self.assertEqual(format_ts(created), "2026-02-28T11:00:00Z")

    def test_export_timezone(self) -> None:
        created = datetime(2026, 3, 1, 0, 0, tzinfo=AUCKLAND)
        self.assertEqual(format_ts(created), "2026-03-01T00:00:00+13:00")


if __name__ == "__main__":
    unittest.main()
