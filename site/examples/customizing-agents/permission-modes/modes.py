"""Counts the permission prompts one small task raises in three Claude Code modes.

The table is the vendor's, reduced to the three kinds of action the lesson's
task uses: reading a file, editing a file inside the working directory, and
running a shell command that is not on the built-in read-only list
(code.claude.com/docs/en/permission-modes, checked 2026-09-21). The real
tool has more modes and more fine print. This is the part a learner needs
to predict the two runs in the lesson.
"""

# The kinds of action each mode lets through without a prompt.
NO_PROMPT = {
    "default": {"read"},
    "acceptEdits": {"read", "edit"},
    "bypassPermissions": {"read", "edit", "run"},
}

# The lesson's task, as the agent is likely to carry it out.
TASK = [
    ("read", "todo.py"),
    ("read", "test_todo.py"),
    ("edit", "todo.py"),
    ("edit", "test_todo.py"),
    ("run", "python3 -m unittest -q"),
]


def prompts(mode, actions):
    """The actions of `actions` that stop for a prompt in `mode`."""
    return [f"{kind} {target}" for kind, target in actions if kind not in NO_PROMPT[mode]]


def report(mode, actions):
    count = len(prompts(mode, actions))
    noun = "prompt" if count == 1 else "prompts"
    return f"{mode}: {count} {noun}"


if __name__ == "__main__":
    for mode in ("default", "acceptEdits", "bypassPermissions"):
        print(report(mode, TASK))
