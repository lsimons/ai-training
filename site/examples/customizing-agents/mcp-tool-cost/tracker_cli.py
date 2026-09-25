"""A stand-in CLI for the same tracker, for the lesson "Measuring what a tool server costs".

It reads the same issues as tracker_server.py and prints one line per
issue, the way a tracker's own CLI prints a list by default.

Usage:  python3 tracker_cli.py list --label bug --label login
"""

import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ISSUES = os.path.join(HERE, "issues.json")


def list_issues(state, labels):
    with open(ISSUES, encoding="utf-8") as handle:
        issues = json.load(handle)
    found = [
        issue
        for issue in issues
        if (state == "all" or issue["state"] == state)
        and all(label in issue["labels"] for label in labels)
    ]
    found.sort(key=lambda issue: issue["updated"], reverse=True)
    lines = []
    for issue in found:
        assignee = issue["assignee"] or "-"
        lines.append(f"#{issue['id']}  {issue['title']}  ({assignee})")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(prog="tracker")
    commands = parser.add_subparsers(dest="command", required=True)
    listing = commands.add_parser("list", help="list issues")
    listing.add_argument("--state", default="open", choices=["open", "closed", "all"])
    listing.add_argument("--label", action="append", default=[])
    arguments = parser.parse_args()
    if arguments.command == "list":
        print(list_issues(arguments.state, arguments.label))


if __name__ == "__main__":
    main()
