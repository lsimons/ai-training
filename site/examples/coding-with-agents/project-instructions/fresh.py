"""Replays the fresh session after the one-line fix to AGENTS.md.

The copy gets the fixed rule as its own commit, then the change session 2
made. The command is tried the way the fixed rule says, against a copy of the
list named by TODO_FILE. The script prints what the command printed and
`git status --short`.
"""

import os
import shutil
import sys

from _common import apply_remove, fix_instructions, in_copy, run_todo, status


def main(repo: str, scratch: str) -> int:
    fix_instructions(repo)
    apply_remove(repo)
    todo_file = os.path.join(scratch, "todos.json")
    shutil.copyfile(os.path.join(repo, "todos.json"), todo_file)
    sys.stdout.write(run_todo(repo, todo_file, "remove", "3"))
    for line in status(repo):
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(in_copy(main))
