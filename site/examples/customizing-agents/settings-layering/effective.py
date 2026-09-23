"""Models how Claude Code combines permission settings from four layers.

This is a model of the documented rules, checked on 2026-09-23 against
code.claude.com/docs/en/settings and code.claude.com/docs/en/permissions,
and not Claude Code itself. Two rules from those pages are what it models.
A single-value key such as `permissions.defaultMode` takes the value from
the highest layer that sets it, in the order command line, project local,
shared project, user (managed settings sit above all of these and are left
out here). A list key such as `permissions.allow` merges: every layer adds
its entries and none removes another layer's. A tool call is then checked
against the merged `deny` list, then `ask`, then `allow`, and the first
match decides. Session flags are one more layer: `--disallowedTools` adds
deny rules and `--allowedTools` adds allow rules for that session.

The Bash matching is the same small model as the allowlists lesson: a rule
with no `*` matches one exact command, and a rule whose only `*` is at the
end after a space matches the bare command and any longer command that
starts with it. An `Edit` rule here matches one exact path. The real tool
also strips wrappers, splits compound commands, matches paths as globs, and
holds a project's allow rules until you trust the folder.
"""

# The four layers, highest precedence first. Each holds the `permissions`
# object of one settings file, or the rules the session flags add.
LAYERS = [
    (
        "flag",
        {"deny": ["Bash(rm *)"]},
    ),
    (
        "local",
        {"allow": ["Bash(python3 *)", "Bash(git push *)"]},
    ),
    (
        "project",
        {
            "defaultMode": "default",
            "allow": ["Bash(python3 -m unittest *)", "Edit(todo.py)"],
            "deny": ["Edit(todos.json)", "Bash(git push *)"],
        },
    ),
    (
        "user",
        {
            "defaultMode": "acceptEdits",
            "allow": ["Bash(git status *)", "Bash(git diff *)"],
        },
    ),
]

ACTIONS = [
    "Bash(git push origin main)",
    "Bash(python3 todo.py add milk)",
    "Bash(rm -rf build)",
    "Edit(todos.json)",
    "Bash(git commit -m fix)",
]


def split_rule(rule):
    """`Bash(git log *)` becomes `("Bash", "git log *")`."""
    tool, _, rest = rule.partition("(")
    return tool, rest[:-1] if rest else ""


def matches(rule, action):
    """Whether one permission rule covers one tool call, both written as `Tool(specifier)`."""
    rule_tool, pattern = split_rule(rule)
    action_tool, target = split_rule(action)
    if rule_tool != action_tool:
        return False
    if rule_tool == "Bash" and pattern.endswith(" *") and pattern.count("*") == 1:
        prefix = pattern[:-2]
        return target == prefix or target.startswith(prefix + " ")
    return target == pattern


def single_value(layers, key):
    """A single-value key and the layer it came from: the highest layer that sets it."""
    for name, permissions in layers:
        if key in permissions:
            return permissions[key], name
    return None, None


def decide(layers, action):
    """The verdict for one tool call and the layer whose rule decided it."""
    for verdict in ("deny", "ask", "allow"):
        for name, permissions in layers:
            for rule in permissions.get(verdict, []):
                if matches(rule, action):
                    return f"{verdict} ({name} {verdict} {rule})"
    mode, name = single_value(layers, "defaultMode")
    return f"prompt (no rule; mode {mode} from {name})"


def effective(layers, actions):
    """One line per action: the action, its verdict and the layer that decided it."""
    return [f"{action}: {decide(layers, action)}" for action in actions]


if __name__ == "__main__":
    for line in effective(LAYERS, ACTIONS):
        print(line)
