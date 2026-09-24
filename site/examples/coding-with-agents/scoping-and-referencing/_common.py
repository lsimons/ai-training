"""Shared helpers for the scoping-and-referencing fixtures.

Every fixture copies `fixture-repo` to a temporary directory and works on the
copy, so the committed fixture stays in its starting state. The copy is what
the learner's session would have produced at that point in the lesson.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Callable

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, "fixture-repo")
UNDO_TEST = os.path.join(HERE, "test_undo.py")

DONE_FUNCTION = """def done(items, number):
    index = number - 1
    if index < 0 or index >= len(items):
        return f"no item #{number}"
    items[index]["done"] = True
    return f"done #{number}: {items[index]['text']}"
"""

UNDO_FUNCTION = """def undo(items, number):
    index = number - 1
    if index < 0 or index >= len(items):
        return f"no item #{number}"
    items[index]["done"] = False
    return f"open #{number}: {items[index]['text']}"
"""

DONE_BRANCH = """    elif command == "done" and len(argv) == 3 and argv[2].isdigit():
        message = done(items, int(argv[2]))
"""

UNDO_BRANCH = """    elif command == "undo" and len(argv) == 3 and argv[2].isdigit():
        message = undo(items, int(argv[2]))
"""


def repo_files(repo: str) -> list[str]:
    """Every file in the repository, as a sorted relative path with slashes."""
    root = Path(repo)
    paths = [p for p in root.rglob("*") if p.is_file() and "__pycache__" not in p.parts]
    return sorted(p.relative_to(root).as_posix() for p in paths)


def copy_repo(tmpdir: str) -> str:
    copy = os.path.join(tmpdir, "fixture-repo")
    shutil.copytree(REPO, copy)
    return copy


def apply_undo(repo: str) -> None:
    """The change the scoped brief asks for: `undo` in todo.py, next to `done`."""
    path = os.path.join(repo, "todo.py")
    with open(path, encoding="utf-8") as handle:
        source = handle.read()
    if DONE_FUNCTION not in source or DONE_BRANCH not in source:
        raise SystemExit("todo.py no longer holds the done command the lesson imitates")
    source = source.replace(DONE_FUNCTION, DONE_FUNCTION + "\n\n" + UNDO_FUNCTION)
    source = source.replace(DONE_BRANCH, DONE_BRANCH + UNDO_BRANCH)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(source)
    shutil.copyfile(UNDO_TEST, os.path.join(repo, "test_undo.py"))


def run_todo(repo: str, *args: str) -> int:
    """Runs a todo.py command against the copy's own todos.json."""
    env = dict(os.environ, TODO_FILE=os.path.join(repo, "todos.json"))
    result = subprocess.run([sys.executable, "todo.py", *args], cwd=repo, env=env)
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
