"""A small notes command, the package the release skill in the lesson releases."""

import json
import sys
from pathlib import Path

__version__ = "0.3.0"

STORE = Path(__file__).resolve().parent / "notes.json"


def load() -> list[str]:
    """The saved notes, oldest first."""
    if not STORE.exists():
        return []
    return json.loads(STORE.read_text(encoding="utf-8"))


def save(notes: list[str]) -> None:
    STORE.write_text(json.dumps(notes, indent=2) + "\n", encoding="utf-8")


def add(notes: list[str], text: str) -> list[str]:
    return [*notes, text]


def render(notes: list[str]) -> str:
    return "\n".join(f"{i}. {note}" for i, note in enumerate(notes, start=1))


def main(argv: list[str]) -> int:
    if argv[:1] == ["--version"]:
        print(f"notes {__version__}")
        return 0
    if argv[:1] == ["add"] and len(argv) == 2:
        save(add(load(), argv[1]))
        return 0
    if argv[:1] == ["list"] or not argv:
        print(render(load()))
        return 0
    print("usage: notes.py [--version | list | add TEXT]", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
