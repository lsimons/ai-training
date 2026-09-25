"""Print the notes server's log, one tool call per line.

    python3 show_log.py notes-log.jsonl

Each line gives who the token names, the tool, its arguments, and what
the server did with the call.
"""

import json
import os
import sys


def format_entry(entry):
    arguments = ", ".join(f'{key}="{value}"' for key, value in entry["arguments"].items())
    return f"{entry['owner']} {entry['tool']}({arguments}) -> {entry['outcome']}"


def show(path):
    if not os.path.exists(path):
        print(f"No calls logged yet: {path} does not exist.")
        return
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            print(format_entry(json.loads(line)))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: show_log.py <log-file>", file=sys.stderr)
        sys.exit(2)
    show(sys.argv[1])
