"""todo: a tiny to-do list kept in a JSON file.

Usage:
    python3 todo.py add "Buy milk"
    python3 todo.py list
    python3 todo.py done 1
"""

import json
import os
import sys

TODO_FILE = os.environ.get("TODO_FILE", "todos.json")


def load():
    if not os.path.exists(TODO_FILE):
        return []
    with open(TODO_FILE, encoding="utf-8") as handle:
        return json.load(handle)


def save(items):
    with open(TODO_FILE, "w", encoding="utf-8") as handle:
        json.dump(items, handle, indent=2)
        handle.write("\n")


def add(items, text):
    items.append({"text": text, "done": False})
    return f"added #{len(items)}: {text}"


def list_items(items):
    if not items:
        return "nothing to do"
    lines = []
    for number, item in enumerate(items, start=1):
        mark = "x" if item["done"] else " "
        lines.append(f"{number}. [{mark}] {item['text']}")
    return "\n".join(lines)


def done(items, number):
    index = number
    if index < 0 or index >= len(items):
        return f"no item #{number}"
    items[index]["done"] = True
    return f"done #{number}: {items[index]['text']}"


def main(argv):
    items = load()
    command = argv[1] if len(argv) > 1 else "list"
    if command == "add" and len(argv) > 2:
        message = add(items, " ".join(argv[2:]))
    elif command == "list":
        message = list_items(items)
    elif command == "done" and len(argv) == 3 and argv[2].isdigit():
        message = done(items, int(argv[2]))
    else:
        print((__doc__ or "").strip(), file=sys.stderr)
        return 2
    save(items)
    print(message)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
