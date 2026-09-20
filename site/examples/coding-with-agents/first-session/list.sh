#!/usr/bin/env bash
# Shows the committed to-do list. Read-only against the fixture.
set -euo pipefail
cd "$(dirname "$0")/fixture-repo"
python3 todo.py list
