#!/usr/bin/env bash
# Runs the Scorecard triage and prints only its summary line.
set -euo pipefail
cd "$(dirname "$0")"
python3 triage.py | tail -1
