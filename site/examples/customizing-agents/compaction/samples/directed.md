# Summary: report service session

Written for the lesson as an example of a summary made with instructions
that ask for decisions, open items and rules. It is not the output of a
model.

Goal: add a JSON format to the `/v2/export` endpoint of the report
service.

Rules for this work:

- Don't change anything under `migrations/`. The database team owns it.

Decisions:

- Keep `/v1/export` until March 31, because version 4.2 of the mobile app
  still calls it.
- JSON is a `format=json` query parameter on `/v2/export`, and CSV stays
  the default.

Open items:

- `test_export_timezone` fails on the main branch too. It is a known date
  formatting bug, to be fixed after this release.
- Add the JSON format to `docs/api.md`.

State: `to_json()` and `test_export_json` added, README updated. Tests: 42
passed, 1 failed (`test_export_timezone`).
