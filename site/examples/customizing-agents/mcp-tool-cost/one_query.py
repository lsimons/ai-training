"""Fixture for "One query, two ways": the same search through the server and through the CLI."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import measure

if __name__ == "__main__":
    call, result = measure.server_query({"state": "open", "labels": ["bug", "login"]})
    command, output = measure.cli_query(["list", "--label", "bug", "--label", "login"])
    print(output, end="")
    print()
    print(f"server: call {measure.tokens(call)} tokens, result {measure.tokens(result)} tokens")
    print(f"cli: call {measure.tokens(command)} tokens, result {measure.tokens(output)} tokens")
