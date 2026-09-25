# Handoff: time zone fix

Written for the lesson as an example of a handoff that names the state,
the decisions and what was ruled out. It is not the output of a model.

## State

- `test_export_timezone` fails on main: a report created at midnight on
  1 March in Auckland is exported as 11:00 on 28 February (UTC).
- The working tree has one edit that isn't committed: the expected value
  of that test in `test_reports.py` was changed to the UTC time. It was
  ruled out. Undo it first, and the test fails again.
- No code is changed yet.

## Decisions

- Keep the offset each time carries. Customers read the export in their
  own time zone, and a report made on 1 March must show 1 March.
- Write UTC times with `Z`, never `+00:00`. The billing import reads the
  `Z` form and breaks on `+00:00`.
- Treat a time without an offset as UTC, as the code does now. Rows
  written before migration 0007 have no offset, and the database team
  confirmed they are UTC.

## Ruled out

- Changing the test to expect UTC: the test is right, the code is wrong.
- Converting to the server's local time zone: the servers run in UTC and
  customers are in many zones.

## Next

1. Undo the edit in `test_reports.py`.
2. Change `format_ts()` in `reports.py` to keep each time's offset, with
   the two rules above.
3. Add a test for a time without an offset.
4. Run `python3 -m unittest -q`. All tests pass when this is done.
