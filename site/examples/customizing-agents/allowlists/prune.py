"""Prunes an allowlist down to the rules that answered a prompt in run one.

`matches` comes from width.py, next to this file. A rule that covers none of
the commands that stopped for a prompt is doing nothing: either the agent
never ran the command, or the command was on the built-in read-only list and
never prompted in the first place.
"""

from width import matches

# The Bash rules the lesson writes before run two, and the commands that
# stopped for a prompt in run one.
ALLOW = ["Bash(python3 -m unittest *)", "Bash(git status *)", "Bash(git diff *)"]
TALLY = ["python3 -m unittest -q", "python3 -m unittest -q"]


def unused(rules, prompted):
    """The rules that answer none of the commands in `prompted`."""
    return [rule for rule in rules if not any(matches(rule, command) for command in prompted)]


if __name__ == "__main__":
    for rule in unused(ALLOW, TALLY):
        print(rule)
