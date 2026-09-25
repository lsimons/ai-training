"""The complete program behind the lesson "Where an agent's memory lives".

Run any step with:  python3 memory.py <step>   where step is one of the
names in STEPS below. The lesson's examples run these in CI.

The memory is `preferences.txt`, one fact per line, which a person can
open and edit. The `whole` step reads it whole into the prompt, the way an
agent loads a small notes file at the start of a session. The `grown`
step builds a copy of ten thousand lines in memory and compares reading
it whole with a search tool that returns only the lines a question needs.
No model is called, so every run prints the same thing and needs no API key.
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PREFERENCES = HERE / "preferences.txt"

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def read_whole(lines: list[str]) -> str:
    """The text an agent puts in its prompt when it loads the notes whole."""
    return "\n".join(lines)


def search_notes(lines: list[str], query: str) -> list[str]:
    """A tool: return only the lines that contain the query, ignoring case."""
    return [line for line in lines if query.lower() in line.lower()]


def grown_notes(lines: list[str], total: int = 10000) -> list[str]:
    """The same notes after months of use: one line per project added."""
    extra = [
        f"project {number:04d}: send the status update on {DAYS[number % len(DAYS)]}"
        for number in range(1, total - len(lines) + 1)
    ]
    return lines + extra


def load() -> list[str]:
    return PREFERENCES.read_text(encoding="utf-8").splitlines()


def step_whole() -> None:
    lines = load()
    prompt_part = read_whole(lines)
    print(f"preferences.txt: {len(lines)} lines")
    print(f"read whole into the prompt: {len(prompt_part)} characters")


def step_grown() -> None:
    lines = grown_notes(load())
    prompt_part = read_whole(lines)
    found = search_notes(lines, "date format")
    print(f"grown notes: {len(lines)} lines")
    print(f"read whole into the prompt: {len(prompt_part)} characters")
    noun = "line" if len(found) == 1 else "lines"
    print(f"search_notes('date format'): {len(found)} {noun}, {len(read_whole(found))} characters")
    for line in found:
        print(f"  {line}")


STEPS = {
    "whole": step_whole,
    "grown": step_grown,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
