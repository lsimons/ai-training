"""The first version of todo, one file, kept for reference.

Nothing imports this module. The commands moved to todo.py, the file
handling to store.py and the formatting to render.py.
"""

import json
import sys

TODO_FILE = "todos.json"


def load():
    try:
        with open(TODO_FILE, encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return []


def save(items):
    with open(TODO_FILE, "w", encoding="utf-8") as handle:
        json.dump(items, handle)


def mark(items, number, done):
    items[number - 1]["done"] = done
    return items[number - 1]["text"]


def undone(items, number):
    """Marks a done item as open again."""
    return "reopened: " + mark(items, number, False)


def show(items):
    for number, item in enumerate(items, start=1):
        flag = "x" if item["done"] else " "
        print(f"[{flag}] {number} {item['text']}")


def main(argv):
    items = load()
    if argv[1:2] == ["add"]:
        items.append({"text": " ".join(argv[2:]), "done": False})
    elif argv[1:2] == ["done"]:
        mark(items, int(argv[2]), True)
    elif argv[1:2] == ["undone"]:
        print(undone(items, int(argv[2])))
    else:
        show(items)
    save(items)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
