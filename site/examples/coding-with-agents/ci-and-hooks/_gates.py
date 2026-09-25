"""Shared helpers for the ci-and-hooks fixtures.

The project is the nightly import with its test, as the self-checking-loops
lesson leaves it before the agent's fix. That lesson's `_common.py` makes
the copy and applies the fix, and it is loaded here under another name, so
a change there reaches this lesson too. This lesson adds the hook, its
settings and the CI workflow to the copy, at the paths the page gives.

The CI job can't run here, so `run_job` runs the `run:` lines of the
workflow's steps in order in the copy, and stops at the first step that
exits with a status other than 0, the way the runner does. `python3` at the
start of a step runs as the interpreter that runs the fixture.
"""

import importlib.machinery
import importlib.util
import os
import shutil
import subprocess
import sys
import tempfile
from typing import Any

HERE = os.path.dirname(os.path.abspath(__file__))
LOOPS_COMMON = os.path.join(os.path.dirname(HERE), "self-checking-loops", "_common.py")


def _load_loops() -> Any:
    loader = importlib.machinery.SourceFileLoader("loops_common", LOOPS_COMMON)
    spec = importlib.util.spec_from_loader("loops_common", loader)
    if spec is None:
        raise SystemExit(f"can't load {LOOPS_COMMON}")
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


loops = _load_loops()


def make_project(tmpdir: str) -> str:
    """The learner's copy: the import, the test, the hook, its settings and the workflow."""
    copy = loops.make_copy(tmpdir)
    os.makedirs(os.path.join(copy, ".claude", "hooks"))
    os.makedirs(os.path.join(copy, ".github", "workflows"))
    shutil.copy(os.path.join(HERE, "protect_paths.py"), os.path.join(copy, ".claude", "hooks"))
    shutil.copy(
        os.path.join(HERE, "settings.sample.json"), os.path.join(copy, ".claude", "settings.json")
    )
    shutil.copy(os.path.join(HERE, "checks.yml"), os.path.join(copy, ".github", "workflows"))
    return copy


def steps(workflow: str) -> "list[tuple[str, str]]":
    """The (name, command) of each step with a `run:` line, in order."""
    found: list[tuple[str, str]] = []
    name = ""
    with open(workflow, encoding="utf-8") as handle:
        for line in handle:
            text = line.strip()
            if text.startswith("- name:"):
                name = text.split(":", 1)[1].strip()
            elif text.startswith("run:"):
                found.append((name, text.split(":", 1)[1].strip()))
                name = ""
    if not found:
        raise SystemExit(f"{workflow} has no run steps")
    return found


def run_job(copy: str) -> None:
    """Print a log of the job's run steps, and the job's result."""
    for name, command in steps(os.path.join(copy, ".github", "workflows", "checks.yml")):
        words = command.split()
        if words[0] == "python3":
            words[0] = sys.executable
        print(f"step: {name}")
        print(f"$ {command}")
        result = subprocess.run(words, cwd=copy, capture_output=True, text=True, check=False)
        print(result.stdout + result.stderr, end="")
        if result.returncode != 0:
            print(f"job failed: the step exited with status {result.returncode}")
            return
    print("job passed")


def job_on(apply_fix: bool) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_project(tmpdir)
        if apply_fix:
            loops.apply_fix(copy)
        run_job(copy)
