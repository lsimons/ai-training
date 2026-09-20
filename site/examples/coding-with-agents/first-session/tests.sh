#!/usr/bin/env bash
# Runs the fixture's test suite and prints only the verdict line.
set -euo pipefail
cd "$(dirname "$0")/fixture-repo"
# The suite is meant to fail (the fixture has a bug), so do not let its status fail this script.
{ PYTHON_COLORS=0 NO_COLOR=1 python3 -m unittest -q 2>&1 || true; } | tail -1
