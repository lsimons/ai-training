"""A stand-in issue-tracker MCP server, for the lesson "Measuring what a tool server costs".

It speaks the stdio transport the way the MCP specification defines it:
one JSON-RPC message per line on standard input and one per line on
standard output. It offers twenty tools with descriptions and parameter
schemas of the length a real tracker server ships, because the lesson
measures what those definitions cost. Only `search_issues` and `get_issue`
answer. The rest return an error, so the stand-in can't change anything.

Run it by hand:  python3 tracker_server.py
Then type a request such as {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ISSUES = os.path.join(HERE, "issues.json")


def string(description):
    return {"type": "string", "description": description}


def integer(description):
    return {"type": "integer", "description": description}


def tool(name, description, properties, required=()):
    return {
        "name": name,
        "description": description,
        "inputSchema": {
            "type": "object",
            "properties": properties,
            "required": list(required),
        },
    }


PROJECT = string(
    "The project key, for example 'web'. Defaults to the project set in the server configuration."
)
ISSUE_ID = integer("The numeric id of the issue, as shown in its URL.")
STATE = {
    "type": "string",
    "enum": ["open", "closed", "all"],
    "description": "Filter by state. Defaults to 'open'.",
}
LABELS = {
    "type": "array",
    "items": {"type": "string"},
    "description": "Only issues that carry every one of these labels.",
}
LIMIT = integer("The maximum number of results to return, from 1 to 100. Defaults to 30.")
PAGE = integer(
    "The page of results to return, starting at 1. Use with limit to page through long lists."
)

TOOLS = [
    tool(
        "search_issues",
        "Search the issues of a project. Filters combine with AND. Returns the full record of each "
        "matching issue, including its body, labels, assignee, milestone and timestamps, sorted "
        "by the "
        "time of the last update, newest first. Use get_issue when you already know the id.",
        {
            "project": PROJECT,
            "query": string(
                "Free text matched against the title and body. Leave empty to match every issue."
            ),
            "state": STATE,
            "labels": LABELS,
            "assignee": string(
                "Only issues assigned to this user name. Use 'none' for unassigned issues."
            ),
            "limit": LIMIT,
            "page": PAGE,
        },
    ),
    tool(
        "get_issue",
        "Return the full record of one issue by its id, including the body, labels, assignee, "
        "milestone, "
        "timestamps and the number of comments. Fails with an error when no issue has that id.",
        {"project": PROJECT, "issue_id": ISSUE_ID},
        ["issue_id"],
    ),
    tool(
        "create_issue",
        "Create a new issue in a project and return its id and URL. The reporter is the user the "
        "server "
        "is authenticated as. Labels that don't exist yet are rejected, so call list_labels first.",
        {
            "project": PROJECT,
            "title": string("A one-line summary of the issue."),
            "body": string("The description in Markdown. Include steps to reproduce for a bug."),
            "labels": LABELS,
            "assignee": string(
                "The user name to assign the issue to. Leave empty to leave it unassigned."
            ),
            "milestone": string("The title of an existing milestone."),
        },
        ["title"],
    ),
    tool(
        "update_issue",
        "Change the title, body, state or milestone of an existing issue. Only the fields you "
        "pass change. "
        "Closing an issue sends a notification to its reporter and to everyone who follows it.",
        {
            "project": PROJECT,
            "issue_id": ISSUE_ID,
            "title": string("The new one-line summary."),
            "body": string("The new description in Markdown. Replaces the old one completely."),
            "state": {
                "type": "string",
                "enum": ["open", "closed"],
                "description": "The new state.",
            },
            "milestone": string(
                "The title of an existing milestone, or an empty string to clear it."
            ),
        },
        ["issue_id"],
    ),
    tool(
        "add_comment",
        "Add a comment to an issue. The comment is posted as the user the server is "
        "authenticated as, and "
        "everyone who follows the issue is notified. Markdown is rendered.",
        {"project": PROJECT, "issue_id": ISSUE_ID, "body": string("The comment text in Markdown.")},
        ["issue_id", "body"],
    ),
    tool(
        "list_comments",
        "List the comments on an issue, oldest first, with the author, the time and the full "
        "text of each "
        "comment. Long threads are paged.",
        {"project": PROJECT, "issue_id": ISSUE_ID, "limit": LIMIT, "page": PAGE},
        ["issue_id"],
    ),
    tool(
        "edit_comment",
        "Replace the text of a comment you wrote. Comments by other users can't be edited, and "
        "the call "
        "fails with a permission error.",
        {
            "project": PROJECT,
            "comment_id": integer("The numeric id of the comment."),
            "body": string("The new comment text in Markdown."),
        },
        ["comment_id", "body"],
    ),
    tool(
        "delete_comment",
        "Delete a comment you wrote. Deletion can't be undone. Project administrators can delete "
        "any "
        "comment.",
        {"project": PROJECT, "comment_id": integer("The numeric id of the comment.")},
        ["comment_id"],
    ),
    tool(
        "assign_issue",
        "Assign an issue to a user, replacing the current assignee. The new assignee is "
        "notified. Pass an "
        "empty user name to remove the assignee.",
        {
            "project": PROJECT,
            "issue_id": ISSUE_ID,
            "assignee": string("The user name, or an empty string."),
        },
        ["issue_id", "assignee"],
    ),
    tool(
        "add_labels",
        "Add one or more existing labels to an issue. Labels the issue already has are ignored. "
        "Fails when "
        "a label doesn't exist in the project.",
        {"project": PROJECT, "issue_id": ISSUE_ID, "labels": LABELS},
        ["issue_id", "labels"],
    ),
    tool(
        "remove_labels",
        "Remove one or more labels from an issue. Labels the issue doesn't have are ignored.",
        {"project": PROJECT, "issue_id": ISSUE_ID, "labels": LABELS},
        ["issue_id", "labels"],
    ),
    tool(
        "list_labels",
        "List the labels defined in a project, with the name, color and description of each and "
        "the number "
        "of open issues that carry it.",
        {"project": PROJECT, "limit": LIMIT, "page": PAGE},
    ),
    tool(
        "create_label",
        "Define a new label in a project. The name must be unique in the project. The color is a "
        "six-digit "
        "hexadecimal value without the leading hash.",
        {
            "project": PROJECT,
            "name": string("The label name."),
            "color": string("The color, for example 'd73a4a'."),
            "description": string("A short description shown next to the label."),
        },
        ["name"],
    ),
    tool(
        "list_milestones",
        "List the milestones of a project with their title, due date, state and the number of "
        "open and "
        "closed issues in each.",
        {"project": PROJECT, "state": STATE, "limit": LIMIT, "page": PAGE},
    ),
    tool(
        "create_milestone",
        "Create a milestone in a project. The title must be unique. The due date is optional and "
        "uses the "
        "format YYYY-MM-DD.",
        {
            "project": PROJECT,
            "title": string("The milestone title, for example '2026.12'."),
            "due_on": string("The due date as YYYY-MM-DD."),
            "description": string("What the milestone delivers."),
        },
        ["title"],
    ),
    tool(
        "link_issues",
        "Record a relation between two issues, such as one blocking the other or one duplicating "
        "the other. "
        "The relation shows on both issues.",
        {
            "project": PROJECT,
            "issue_id": ISSUE_ID,
            "other_issue_id": integer("The numeric id of the other issue."),
            "relation": {
                "type": "string",
                "enum": ["blocks", "blocked_by", "duplicates", "relates_to"],
                "description": "How the first issue relates to the other one.",
            },
        },
        ["issue_id", "other_issue_id", "relation"],
    ),
    tool(
        "list_projects",
        "List the projects the authenticated user can see, with the key, name, description and "
        "visibility "
        "of each.",
        {"limit": LIMIT, "page": PAGE},
    ),
    tool(
        "list_users",
        "List the members of a project with their user name, display name and role. Use this to "
        "find the "
        "user name to pass to assign_issue.",
        {
            "project": PROJECT,
            "query": string("Part of a user name or display name."),
            "limit": LIMIT,
        },
    ),
    tool(
        "get_issue_history",
        "Return the change history of an issue: every change of state, title, assignee, label or "
        "milestone, "
        "with who made it and when, oldest first.",
        {"project": PROJECT, "issue_id": ISSUE_ID, "limit": LIMIT, "page": PAGE},
        ["issue_id"],
    ),
    tool(
        "subscribe_to_issue",
        "Follow or stop following an issue as the authenticated user. Followers are notified of "
        "every "
        "comment and every change of state.",
        {
            "project": PROJECT,
            "issue_id": ISSUE_ID,
            "subscribed": {
                "type": "boolean",
                "description": "True to follow, false to stop following.",
            },
        },
        ["issue_id", "subscribed"],
    ),
]


def load_issues():
    with open(ISSUES, encoding="utf-8") as handle:
        return json.load(handle)


def search_issues(arguments):
    state = arguments.get("state", "open")
    labels = arguments.get("labels", [])
    found = []
    for issue in load_issues():
        if state != "all" and issue["state"] != state:
            continue
        if not all(label in issue["labels"] for label in labels):
            continue
        found.append(issue)
    found.sort(key=lambda issue: issue["updated"], reverse=True)
    return json.dumps(found[: arguments.get("limit", 30)], indent=2)


def get_issue(arguments):
    for issue in load_issues():
        if issue["id"] == arguments.get("issue_id"):
            return json.dumps(issue, indent=2)
    raise LookupError(f"no issue with id {arguments.get('issue_id')}")


HANDLERS = {"search_issues": search_issues, "get_issue": get_issue}


def result(text, is_error):
    return {"content": [{"type": "text", "text": text}], "isError": is_error}


def handle(message):
    method = message.get("method")
    if method == "tools/list":
        return {"tools": TOOLS}
    if method == "tools/call":
        name = message["params"]["name"]
        handler = HANDLERS.get(name)
        if handler is None:
            return result(f"{name} is disabled in this stand-in", True)
        try:
            return result(handler(message["params"].get("arguments", {})), False)
        except LookupError as error:
            return result(str(error), True)
    raise ValueError(f"unknown method {method}")


def main():
    for line in sys.stdin:
        message = json.loads(line)
        try:
            reply = {"jsonrpc": "2.0", "id": message["id"], "result": handle(message)}
        except ValueError as error:
            reply = {
                "jsonrpc": "2.0",
                "id": message["id"],
                "error": {"code": -32601, "message": str(error)},
            }
        sys.stdout.write(json.dumps(reply) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
