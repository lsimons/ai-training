"""Print the notes server's log, one tool call per line.

    python3 show_log.py notes-log.jsonl

Each line gives who the token names, the tool, its arguments, and what
the server did with the call. The tool name and the argument values come
from the model, so a planted instruction chooses them. Every argument
value is printed as a JSON string, and a tool name, owner or key that
isn't a plain word is too, so no text in a call can end its line early or
write a line of its own.
"""

import json
import os
import re
import sys

PLAIN_WORD = re.compile(r"[A-Za-z0-9_+-]+")
PLAIN_OUTCOME = re.compile(r"[A-Za-z0-9_+ .,:-]+")


def word(text):
    """Return `text` as it is when it is a plain word, and as a JSON string otherwise."""
    text = str(text)
    return text if PLAIN_WORD.fullmatch(text) else json.dumps(text)


def format_arguments(arguments):
    if not isinstance(arguments, dict):
        return json.dumps(json.dumps(arguments))
    return ", ".join(f"{word(key)}={json.dumps(value)}" for key, value in arguments.items())


def format_entry(entry):
    outcome = str(entry["outcome"])
    if not PLAIN_OUTCOME.fullmatch(outcome):
        outcome = json.dumps(outcome)
    arguments = format_arguments(entry["arguments"])
    return f"{word(entry['owner'])} {word(entry['tool'])}({arguments}) -> {outcome}"


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
