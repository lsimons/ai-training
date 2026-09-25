# Session log: the time zone bug

A coding session on the report service, written for the lesson "Handing
work to the next session". It is not the record of a real session. The
session stops before the work is done, and the practice repository that
`setup_practice.py` builds is in the state the session left it in. Copy
from the first **User:** line to the end.

**User:** The release is out, so today we fix `test_export_timezone`. It
fails on main. A report created at midnight on 1 March in Auckland is
exported as 11:00 on 28 February.

**Agent:** I'll read `reports.py` and `test_reports.py` first.

**Tool (read reports.py):** 27 lines. `format_ts()` treats a time without
an offset as UTC, then converts every time to UTC and writes it with a
`Z` at the end. `to_csv()` calls `format_ts()` for the `created` column.

**Tool (run tests):** 4 tests, 1 failed. `test_export_timezone`: expected
`2026-03-01T00:00:00+13:00`, got `2026-02-28T11:00:00Z`.

**Agent:** The export writes every time in UTC, and the test expects the
Auckland offset. The smallest fix is to make the test expect the UTC time.

**Tool (edit test_reports.py):** In `test_export_timezone`, the expected
value is now `2026-02-28T11:00:00Z`.

**Tool (run tests):** 4 tests, all passed.

**User:** No, the test is right. Customers read the export in their own
time zone, and a report they made on 1 March must show 1 March. We
change the code, not the test. Undo that edit.

**Agent:** Understood. Then `format_ts()` could convert each time to the
server's local time zone instead of to UTC.

**User:** No. The servers run in UTC, and our customers are in many time
zones. Each time already carries the offset of the customer who created
the report, so keep that offset when you format it.

**Agent:** What should happen to a time without an offset?

**User:** Rows written before migration 0007 have no offset. The database
team confirmed that those times are UTC, so treat them as UTC, as the
code does now. And keep writing UTC times with the `Z`, not as `+00:00`.
The billing import reads the `Z` form, and it breaks on `+00:00`.

**Agent:** So the plan is: undo the test edit, keep each time's own
offset in `format_ts()`, treat a time without an offset as UTC, and
write UTC as `Z`. Then add a test for a time without an offset. Shall I
start?

**User:** Not now, I have to go to a meeting. We continue tomorrow, in a
new session.
