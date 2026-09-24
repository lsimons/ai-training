"""Shared helpers for the reversible-changes fixtures.

The fixtures start from the spec-driven-increments fixture repository and its
spec, one directory over, and never change them. Each fixture copies that
directory to a temporary place, turns the copy into a git repository, lands
the three increments of `SPEC.md` as one commit each on a branch, and then
works on the commits. The copy is what the learner's session would have
produced at that point in the lesson.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Callable

HERE = os.path.dirname(os.path.abspath(__file__))
SIBLING = os.path.join(os.path.dirname(HERE), "spec-driven-increments")
REPO = os.path.join(SIBLING, "fixture-repo")
SPEC = os.path.join(SIBLING, "SPEC.md")
DUE_TEST = os.path.join(SIBLING, "test_due.py")
OVERDUE_TEST = os.path.join(HERE, "test_overdue.py")
BAD_DATE_TEST = os.path.join(HERE, "test_bad_date.py")

GIT_ENV = dict(
    os.environ,
    GIT_AUTHOR_NAME="Learner",
    GIT_AUTHOR_EMAIL="learner@example.com",
    GIT_COMMITTER_NAME="Learner",
    GIT_COMMITTER_EMAIL="learner@example.com",
    GIT_CONFIG_GLOBAL=os.devnull,
    GIT_CONFIG_SYSTEM=os.devnull,
)

# Increment 1: `due` sets the field and `list` shows it.

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

# Increment 2: `overdue`, with today from TODO_TODAY or the clock.

OVERDUE_FUNCTION_BEFORE = """def clear(items):
"""

OVERDUE_FUNCTION_AFTER = """def overdue(items):
    import datetime
    import os

    today = os.environ.get("TODO_TODAY") or datetime.date.today().isoformat()
    lines = []
    for number, item in enumerate(items, start=1):
        if not item["done"] and item.get("due") and item["due"] < today:
            lines.append(f"{number}. [ ] {item['text']} (due {item['due']})")
    return "\\n".join(lines) if lines else "nothing overdue"


def clear(items):
"""

OVERDUE_DISPATCH_BEFORE = """    elif command == "list":
        message = render.list_items(items)
"""

OVERDUE_DISPATCH_AFTER = """    elif command == "list":
        message = render.list_items(items)
    elif command == "overdue":
        message = overdue(items)
"""

# Increment 3: refuse a malformed date and change nothing.

BAD_DATE_FUNCTION_BEFORE = """def due(items, number, date):
    index = number - 1
"""

BAD_DATE_FUNCTION_AFTER = """def valid_date(text):
    import datetime

    try:
        datetime.date.fromisoformat(text)
    except ValueError:
        return False
    return True


def due(items, number, date):
    index = number - 1
"""

BAD_DATE_DISPATCH_BEFORE = """    elif command == "due" and len(argv) == 4 and argv[2].isdigit():
        message = due(items, int(argv[2]), argv[3])
"""

BAD_DATE_DISPATCH_AFTER = """    elif command == "due" and len(argv) == 4 and argv[2].isdigit():
        if not valid_date(argv[3]):
            print(f"bad date: {argv[3]}")
            return 2
        message = due(items, int(argv[2]), argv[3])
"""

COMMIT_SUBJECTS = [
    "feat: due command and the date in list",
    "feat: overdue command with TODO_TODAY",
    "feat: refuse a malformed date",
]


def copy_repo(tmpdir: str) -> str:
    copy = os.path.join(tmpdir, "fixture-repo")
    shutil.copytree(REPO, copy)
    return copy


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


def git(repo: str, *args: str) -> "subprocess.CompletedProcess[str]":
    """Runs one git command in the copy, with a fixed identity and no user config."""
    result = subprocess.run(
        ["git", "-c", "commit.gpgsign=false", *args],
        cwd=repo,
        env=GIT_ENV,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed:\n{result.stdout}{result.stderr}")
    return result


def init_repo(repo: str) -> None:
    """The fixture as the learner receives it: one commit on main, and a branch."""
    git(repo, "init", "-q", "--initial-branch=main")
    git(repo, "add", ".")
    git(repo, "commit", "-q", "-m", "chore: the to-do program before due dates")
    shutil.copyfile(SPEC, os.path.join(repo, "SPEC.md"))
    git(repo, "add", "SPEC.md")
    git(repo, "commit", "-q", "-m", "docs: spec for due dates")
    git(repo, "switch", "-q", "-c", "due-dates")


def land_increment_1(repo: str) -> None:
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


def land_increment_2(repo: str) -> None:
    _replace(
        repo,
        "todo.py",
        [
            (OVERDUE_FUNCTION_BEFORE, OVERDUE_FUNCTION_AFTER),
            (OVERDUE_DISPATCH_BEFORE, OVERDUE_DISPATCH_AFTER),
        ],
    )
    shutil.copyfile(OVERDUE_TEST, os.path.join(repo, "test_overdue.py"))


def land_increment_3(repo: str) -> None:
    _replace(
        repo,
        "todo.py",
        [
            (BAD_DATE_FUNCTION_BEFORE, BAD_DATE_FUNCTION_AFTER),
            (BAD_DATE_DISPATCH_BEFORE, BAD_DATE_DISPATCH_AFTER),
        ],
    )
    shutil.copyfile(BAD_DATE_TEST, os.path.join(repo, "test_bad_date.py"))


INCREMENTS: "list[Callable[[str], None]]" = [land_increment_1, land_increment_2, land_increment_3]


def commit_each_increment(repo: str) -> None:
    """Lands the three increments as one commit each on the branch."""
    for land, subject in zip(INCREMENTS, COMMIT_SUBJECTS):
        land(repo)
        git(repo, "add", ".")
        git(repo, "commit", "-q", "-m", subject)


def revert_middle_increment(repo: str) -> None:
    """Reverts the second commit of the branch, the `overdue` command."""
    git(repo, "revert", "--no-edit", "HEAD~1")


def print_log(repo: str) -> None:
    """Prints the branch's commit subjects, newest first, without the hashes."""
    sys.stdout.write(git(repo, "log", "--format=%s", "main..HEAD").stdout)


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


def print_test_verdict(repo: str) -> None:
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


def in_copy(fn: Callable[[str], int]) -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        return fn(copy_repo(tmpdir))
