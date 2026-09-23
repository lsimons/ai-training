"""The complete program behind the lesson "Connecting an agent to your systems with MCP".

Run any step with:  python3 ops.py <step>   where step is one of the names
in STEPS below. The lesson's Predict checkpoints run these in CI.

The server inventory is fictional. `teamdocs` is an invented hosted MCP
server for a wiki and an issue tracker, so the counts below describe no
vendor's product.
"""

import sys

# name, kind, description as the client shows it to the model
TOOLS = [
    ("docs_search", "read", "Full-text search over wiki pages. Returns page ids and titles."),
    ("docs_get_page", "read", "Fetch one page by id, as Markdown."),
    ("docs_list_children", "read", "List the pages under a parent page id."),
    ("docs_get_attachments", "read", "List the files attached to a page id."),
    (
        "docs_create_page",
        "write",
        "Create a page under a parent id. Call docs_search first to find the parent.",
    ),
    ("docs_update_page", "write", "Replace the body of a page by id."),
    ("docs_add_comment", "write", "Add a comment to a page by id."),
    ("tasks_search", "read", "Search issues by text or filter. Returns issue keys."),
    ("tasks_get", "read", "Fetch one issue by key and return its fields and comments."),
    ("tasks_list_transitions", "read", "List the status transitions allowed for an issue key."),
    (
        "tasks_create",
        "write",
        "Create an issue in a project. Requires a project key and a summary.",
    ),
    ("tasks_update", "write", "Change fields on an issue by key."),
    ("tasks_add_comment", "write", "Add a comment to an issue by key."),
    (
        "tasks_transition",
        "write",
        "Move an issue to another status. Call tasks_list_transitions first.",
    ),
    ("users_lookup", "read", "Find a user id by name or email."),
]

CANNOT = ["delete", "change permissions", "bulk edit", "export", "administer"]


def inventory():
    reads = [t for t in TOOLS if t[1] == "read"]
    writes = [t for t in TOOLS if t[1] == "write"]
    print(f"{len(reads)} read, {len(writes)} write, {len(CANNOT)} cannot")


class WriteCap:
    """A proxy rule: at most `limit` write calls per user per minute."""

    def __init__(self, limit):
        self.limit = limit
        self.calls = {}  # (user, minute) -> count

    def allow(self, user, tool, minute):
        kind = {name: kind for name, kind, _ in TOOLS}[tool]
        if kind != "write":
            return "ok"
        key = (user, minute)
        self.calls[key] = self.calls.get(key, 0) + 1
        if self.calls[key] > self.limit:
            count = self.calls[key]
            return f"refused: {tool} is write call {count} of {self.limit} allowed this minute"
        return "ok"


def write_cap():
    cap = WriteCap(limit=2)
    plan = [
        ("docs_search", 0),
        ("docs_update_page", 0),
        ("docs_update_page", 0),
        ("docs_update_page", 0),
        ("docs_update_page", 1),
    ]
    for tool, minute in plan:
        print(cap.allow("ada", tool, minute))


STEPS = {
    "inventory": inventory,
    "write_cap": write_cap,
}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in STEPS:
        sys.exit(f"usage: python3 ops.py <step>   step is one of: {', '.join(sorted(STEPS))}")
    STEPS[sys.argv[1]]()
