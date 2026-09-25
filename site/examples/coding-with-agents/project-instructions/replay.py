"""Replays the two recorded sessions on fresh copies and prints `git status --short`.

Each session gets its own committed copy of fixture-repo. The script applies
the change the session log describes, runs the suite, and runs every todo.py
command from the log the way the agent ran it, with no TODO_FILE. It fails
when the suite or a command prints something other than what the log shows,
so the logs on the page stay true to the program.
"""

import os
import shlex
import sys
from typing import Callable

from _common import SESSIONS, apply_remove, apply_rename, in_copy, run_todo, status, test_verdict

CHANGES: dict[str, Callable[[str], None]] = {
    "session-1.txt": apply_rename,
    "session-2.txt": apply_remove,
}


def recorded_runs(name: str) -> list[tuple[str, list[str]]]:
    """Each `run` line of a log, with the indented output lines right under it."""
    runs: list[tuple[str, list[str]]] = []
    collecting = False
    with open(os.path.join(SESSIONS, name), encoding="utf-8") as handle:
        for line in handle.read().splitlines():
            if line.startswith("run "):
                runs.append((line[len("run ") :], []))
                collecting = True
            elif collecting and line.startswith("  "):
                runs[-1][1].append(line[2:])
            else:
                collecting = False
    return runs


def replay(name: str) -> Callable[[str, str], int]:
    def session(repo: str, scratch: str) -> int:
        CHANGES[name](repo)
        for command, recorded in recorded_runs(name):
            if command == "python3 -m unittest -q":
                printed = [test_verdict(repo)]
            else:
                printed = run_todo(repo, None, *shlex.split(command)[2:]).splitlines()
            if printed != recorded:
                raise SystemExit(f"{name}: `{command}` printed {printed}, the log shows {recorded}")
        print(name)
        for line in status(repo):
            print(line)
        return 0

    return session


def main() -> int:
    for name in sorted(CHANGES):
        in_copy(replay(name))
    return 0


if __name__ == "__main__":
    sys.exit(main())
