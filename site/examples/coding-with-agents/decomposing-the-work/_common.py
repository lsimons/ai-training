"""Shared helpers for the decomposing-the-work fixtures.

Every fixture copies `fixture-repo` to a temporary directory and works on the
copy, so the committed fixture stays in its starting state. The copy is what
the learner's working directory holds at that point in the lesson: the
acceptance test for the parser added, or the test added and a stub parser
next to it.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Callable

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, "fixture-repo")
ACCEPTANCE_TEST = os.path.join(HERE, "test_importer.py")
STUB = os.path.join(HERE, "stub_importer.py")


def copy_repo(tmpdir: str) -> str:
    copy = os.path.join(tmpdir, "fixture-repo")
    shutil.copytree(REPO, copy)
    return copy


def add_acceptance_test(repo: str) -> None:
    """The step where the learner has written the test and nothing else."""
    shutil.copyfile(ACCEPTANCE_TEST, os.path.join(repo, "test_importer.py"))


def add_stub(repo: str) -> None:
    """A parser that exists and does nothing, to show the test rejects it."""
    shutil.copyfile(STUB, os.path.join(repo, "importer.py"))


def run_todo(repo: str, *args: str) -> int:
    """Runs a todo.py command against the copy's own todos.json."""
    env = dict(os.environ, TODO_FILE=os.path.join(repo, "todos.json"))
    result = subprocess.run([sys.executable, "todo.py", *args], cwd=repo, env=env)
    return result.returncode


def print_test_verdict(repo: str) -> int:
    """Runs the suite and prints only its last line, OK or FAILED."""
    env = dict(os.environ, PYTHON_COLORS="0", NO_COLOR="1")
    # A failing suite is expected at two steps of the lesson, so its exit
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
