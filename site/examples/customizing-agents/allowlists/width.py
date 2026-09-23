"""Models how Claude Code matches a Bash allow rule against a command.

The matching follows the vendor's wildcard rules for the shapes this lesson
uses (code.claude.com/docs/en/permissions, checked 2026-09-23): a rule with no
`*` matches one exact command, a `*` stands in for any text including spaces,
and a rule whose only `*` is at the end after a space also matches the bare
command. The real tool also splits compound commands, strips a few wrappers
and matches Read and Edit rules on paths. It also knows `*` only: `?` and `[`
are literal in Claude Code, and `fnmatchcase` below treats them as wildcards,
so don't extend this model to rules that contain them. This is the part a
learner needs to predict the two runs in the lesson.
"""

import fnmatch


def matches(rule, command):
    """Whether the allow rule `rule`, written as `Bash(pattern)`, covers `command`."""
    pattern = rule[len("Bash(") : -1]
    if pattern.endswith(" *") and pattern.count("*") == 1:
        prefix = pattern[:-2]
        return command == prefix or command.startswith(prefix + " ")
    return fnmatch.fnmatchcase(command, pattern)


# Three rules of growing width, and three commands to hold them against.
RULES = ["Bash(git log)", "Bash(git log *)", "Bash(git *)"]
COMMANDS = ["git log", "git log --oneline main", "git push origin main"]


def width_report(rules, commands):
    """One line per command: how many of `rules` cover it."""
    return [f"{command}: {len([r for r in rules if matches(r, command)])}" for command in commands]


if __name__ == "__main__":
    for line in width_report(RULES, COMMANDS):
        print(line)
