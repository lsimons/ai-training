#!/usr/bin/env bash
# Marks item 1 done on a temporary copy of the list, so the fixture stays clean.
set -euo pipefail
cd "$(dirname "$0")/fixture-repo"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
cp todos.json "$tmp"
TODO_FILE="$tmp" python3 todo.py done 1
