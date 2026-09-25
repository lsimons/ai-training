# Summary: report service session

Written for the lesson as an example of a summary made without
instructions. It is not the output of a model.

The goal of the session was to add a JSON format to the `/v2/export`
endpoint of the report service.

- `routes.py`: `/v2/export` takes `format=csv` (the default) or
  `format=json`.
- `export.py`: new `to_json()`, a line wrapped and an unused import
  removed after the linter ran.
- New test `test_export_json` checks that JSON and CSV hold the same rows.
- README.md shows an example request with `format=json`.
- Tests: 42 passed, 1 failed. `test_export_timezone` fails on the main
  branch too and is left open until after the release.

Next step: add the JSON format to `docs/api.md`.
