# Due dates

## Goal

An item can carry a due date, and a new command lists the items whose
date has passed.

## Commands

- `due N YYYY-MM-DD` sets the date on item N and prints
  `due #N: <text> by YYYY-MM-DD`.
- `list` shows the date after the text: `1. [ ] Buy milk (due 2026-10-01)`.
  An item without a date is shown as it is today.
- `overdue` prints the open items whose date is before today, numbered as
  in `list`, or `nothing overdue`. `TODO_TODAY=YYYY-MM-DD` overrides today,
  so a test can pick the day.

## Limits

- `add`, `list`, `done` and `clear` keep working as they do.
- An item in `todos.json` without a `due` field stays valid. No migration.
- A malformed date is refused with `bad date: <input>` and changes nothing.
- Standard library only.

## Success criteria

1. `due 1 2026-10-01` then `list` shows `1. [ ] Buy milk (due 2026-10-01)`,
   and the other lines are unchanged.
2. The committed `todos.json` lists as before, with no date shown.
3. With `TODO_TODAY=2026-10-02`, `overdue` prints item 1 and nothing else.
   With `TODO_TODAY=2026-09-30` it prints `nothing overdue`.
4. `due 1 tomorrow` prints `bad date: tomorrow`, exits with status 2, and
   the file is unchanged.
5. `python3 -m unittest -q` passes after every increment.

## Increments

1. `due` sets the field and `list` shows it. Old items are unchanged.
   Criteria 1, 2 and 5.
2. `overdue`, with `TODO_TODAY`. Criterion 3.
3. Refuse a malformed date. Criterion 4.
