"""Shared helpers for the spec-driven-increments fixtures.

Every fixture copies `fixture-repo` to a temporary directory and works on the
copy, so the committed fixture stays in its starting state. The copy is what
the learner's session would have produced at that point in the lesson: the
spec added, or the spec added and the first increment landed.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Callable

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, "fixture-repo")
SPEC = os.path.join(HERE, "SPEC.md")
DUE_TEST = os.path.join(HERE, "test_due.py")

TODO_USAGE_BEFORE = """    python3 todo.py done 1
    python3 todo.py clear
"""

TODO_USAGE_AFTER = """    python3 todo.py done 1
    python3 todo.py due 1 2026-10-01
    python3 todo.py clear
"""

TODO_DONE_BEFORE = """    return f"done #{number}: {items[index]['text']}"
"""

TODO_DONE_AFTER = """    return f"done #{number}: {items[index]['text']}"


def due(items, number, date):
    index = number - 1
    if index < 0 or index >= len(items):
        return f"no item #{number}"
    items[index]["due"] = date
    return f"due #{number}: {items[index]['text']} by {date}"
"""

TODO_DISPATCH_BEFORE = """    elif command == "clear":
"""

TODO_DISPATCH_AFTER = """    elif command == "due" and len(argv) == 4 and argv[2].isdigit():
        message = due(items, int(argv[2]), argv[3])
    elif command == "clear":
"""

RENDER_BEFORE = """        lines.append(f"{number}. [{mark}] {item['text']}")
"""

RENDER_AFTER = """        line = f"{number}. [{mark}] {item['text']}"
        if item.get("due"):
            line += f" (due {item['due']})"
        lines.append(line)
"""


def copy_repo(tmpdir: str) -> str:
    copy = os.path.join(tmpdir, "fixture-repo")
    shutil.copytree(REPO, copy)
    return copy


def add_spec(repo: str) -> None:
    """The step where the learner has written SPEC.md and nothing else."""
    shutil.copyfile(SPEC, os.path.join(repo, "SPEC.md"))


def _replace(repo: str, name: str, pairs: "list[tuple[str, str]]") -> None:
    path = os.path.join(repo, name)
    with open(path, encoding="utf-8") as handle:
        source = handle.read()
    for before, after in pairs:
        if before not in source:
            raise SystemExit(f"{name} no longer holds the text the lesson changes")
        source = source.replace(before, after)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(source)


def land_first_increment(repo: str) -> None:
    """The first increment: `due` sets the field, `list` shows it, plus its test."""
    add_spec(repo)
    _replace(
        repo,
        "todo.py",
        [
            (TODO_USAGE_BEFORE, TODO_USAGE_AFTER),
            (TODO_DONE_BEFORE, TODO_DONE_AFTER),
            (TODO_DISPATCH_BEFORE, TODO_DISPATCH_AFTER),
        ],
    )
    _replace(repo, "render.py", [(RENDER_BEFORE, RENDER_AFTER)])
    shutil.copyfile(DUE_TEST, os.path.join(repo, "test_due.py"))


def run_todo(
    repo: str, *args: str, today: "str | None" = None
) -> "subprocess.CompletedProcess[str]":
    """Runs a todo.py command against the copy's own todos.json and captures it."""
    env = dict(os.environ, TODO_FILE=os.path.join(repo, "todos.json"))
    if today is not None:
        env["TODO_TODAY"] = today
    return subprocess.run(
        [sys.executable, "todo.py", *args],
        cwd=repo,
        env=env,
        capture_output=True,
        text=True,
    )


def show_todo(repo: str, *args: str) -> int:
    """Runs a todo.py command and prints what it printed, as the learner sees it."""
    result = run_todo(repo, *args)
    sys.stdout.write(result.stdout)
    return result.returncode


def print_test_verdict(repo: str) -> int:
    """Runs the suite and prints only its last line, OK or FAILED."""
    env = dict(os.environ, PYTHON_COLORS="0", NO_COLOR="1")
    result = subprocess.run(
        [sys.executable, "-m", "unittest", "-q"],
        cwd=repo,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    lines = result.stdout.strip().splitlines()
    print(lines[-1] if lines else "")
    return 0


def in_copy(fn: Callable[[str], int]) -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        return fn(copy_repo(tmpdir))
