"""Shared helpers for the plan-then-test fixtures.

Every fixture copies `fixture-repo` to a temporary directory and works on the
copy, so the committed fixture stays in its starting state. The copy is what
the learner's session would have produced at that point in the lesson: the
failing test added, or the test added and store.py fixed.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Callable

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, "fixture-repo")
FAILING_TEST = os.path.join(HERE, "test_clear.py")

BUGGY_REMOVE_DONE = '''def remove_done(items):
    """Drops every done item from the list in place. Returns how many went."""
    removed = 0
    for item in items:
        if item["done"]:
            items.remove(item)
            removed += 1
    return removed
'''

FIXED_REMOVE_DONE = '''def remove_done(items):
    """Drops every done item from the list in place. Returns how many went."""
    kept = [item for item in items if not item["done"]]
    removed = len(items) - len(kept)
    items[:] = kept
    return removed
'''


def copy_repo(tmpdir: str) -> str:
    copy = os.path.join(tmpdir, "fixture-repo")
    shutil.copytree(REPO, copy)
    return copy


def add_failing_test(repo: str) -> None:
    """The step where the agent has written the test and nothing else."""
    shutil.copyfile(FAILING_TEST, os.path.join(repo, "test_clear.py"))


def apply_fix(repo: str) -> None:
    """The one-function change the lesson shows in the diff."""
    path = os.path.join(repo, "store.py")
    with open(path, encoding="utf-8") as handle:
        source = handle.read()
    if BUGGY_REMOVE_DONE not in source:
        raise SystemExit("store.py no longer holds the function the lesson fixes")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(source.replace(BUGGY_REMOVE_DONE, FIXED_REMOVE_DONE))


def run_todo(repo: str, *args: str) -> int:
    """Runs a todo.py command against the copy's own todos.json."""
    env = dict(os.environ, TODO_FILE=os.path.join(repo, "todos.json"))
    result = subprocess.run([sys.executable, "todo.py", *args], cwd=repo, env=env)
    return result.returncode


def print_test_verdict(repo: str) -> int:
    """Runs the suite and prints only its last line, OK or FAILED."""
    env = dict(os.environ, PYTHON_COLORS="0", NO_COLOR="1")
    # A failing suite is expected at one step of the lesson, so its exit
    # status is not this script's exit status.
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
