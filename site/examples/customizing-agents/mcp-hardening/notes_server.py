"""A small MCP server over stdio for the lesson "Hardening a tool connection".

It serves the Markdown notes in one folder, the folder named on its
command line, and it never asks the client for roots. It offers three
tools: `list_notes` and `read_note` need a token with the `read` scope,
and `share_note` needs `read+share`. `share_note` stands in for any tool
that sends data out of your machine. The stand-in sends nothing, and it
only answers as if it had.

Configuration comes from the environment, the way a client passes it:

- `NOTES_TOKEN`: the token, from `issue_token.py`. Every call is checked
  against its scope and its expiry.
- `NOTES_LOG`: a file to append one JSON line per tool call to. Unset
  means no log.

Run it by hand:  NOTES_TOKEN=... python3 notes_server.py notes
Standard output carries only protocol messages, one JSON-RPC message per line.
"""

import datetime
import json
import os
import sys

import notes_token

PROTOCOL_VERSIONS = ("2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25", "2026-07-28")
NAME_SCHEMA = {"type": "string", "description": "A note's file name, such as standup.md"}

TOOLS = [
    {
        "name": "list_notes",
        "description": "List the file names of the notes in the notes folder.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "read_note",
        "description": "Return the full text of one note.",
        "inputSchema": {
            "type": "object",
            "properties": {"name": NAME_SCHEMA},
            "required": ["name"],
        },
    },
    {
        "name": "share_note",
        "description": "Send one note to an email address outside the team.",
        "inputSchema": {
            "type": "object",
            "properties": {"name": NAME_SCHEMA, "to": {"type": "string"}},
            "required": ["name", "to"],
        },
        "_meta": {"anthropic/requiresUserInteraction": True},
    },
]
NEEDS = {"list_notes": "read", "read_note": "read", "share_note": "share"}


def note_path(folder, name):
    """Return the path of note `name`, or None when the name leaves the folder."""
    if not isinstance(name, str) or name != os.path.basename(name) or name in ("", ".", ".."):
        return None
    return os.path.join(folder, name)


def run_tool(folder, name, arguments):
    """Return (text, is_error) for one tool call, after the token is checked."""
    if name == "list_notes":
        notes = sorted(n for n in os.listdir(folder) if n.endswith(".md"))
        return "\n".join(notes), False
    path = note_path(folder, arguments.get("name"))
    if path is None:
        return "Refused: name outside the notes folder", True
    if not os.path.isfile(path):
        return f"No note called {arguments.get('name')}", True
    if name == "read_note":
        with open(path, encoding="utf-8") as handle:
            return handle.read(), False
    return f"Sent {arguments['name']} to {arguments.get('to')}", False


def call(folder, name, arguments):
    """Check the token, run the tool, and return (text, is_error, owner)."""
    scope, owner, problem = notes_token.check(os.environ.get("NOTES_TOKEN"))
    if problem is not None:
        return f"Refused: {problem}", True, owner
    if name not in NEEDS:
        return f"Unknown tool {name}", True, owner
    if NEEDS[name] not in (scope or "").split("+"):
        return f"Refused: token scope is {scope}, and {name} needs {NEEDS[name]}", True, owner
    text, is_error = run_tool(folder, name, arguments)
    return text, is_error, owner


def log(name, arguments, owner, text, is_error):
    """Append one line to the NOTES_LOG file, when it is set."""
    path = os.environ.get("NOTES_LOG")
    if not path:
        return
    outcome = "allowed"
    if is_error and text.startswith("Refused: "):
        outcome = "refused: " + text[len("Refused: ") :]
    elif is_error:
        outcome = "error: " + text
    entry = {
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "owner": owner or "unknown",
        "tool": name,
        "arguments": arguments,
        "outcome": outcome,
    }
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry) + "\n")


def answer(folder, message):
    """Return the response to one request, or None for a notification."""
    if "id" not in message:
        return None
    method = message.get("method")
    params = message.get("params") or {}
    if method == "initialize":
        asked = params.get("protocolVersion")
        result = {
            "protocolVersion": asked if asked in PROTOCOL_VERSIONS else "2025-06-18",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "notes", "version": "1.0.0"},
        }
    elif method == "ping":
        result = {}
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments") or {}
        text, is_error, owner = call(folder, name, arguments)
        log(name, arguments, owner, text, is_error)
        result = {"content": [{"type": "text", "text": text}], "isError": is_error}
    else:
        error = {"code": -32601, "message": f"Method not found: {method}"}
        return {"jsonrpc": "2.0", "id": message["id"], "error": error}
    return {"jsonrpc": "2.0", "id": message["id"], "result": result}


def main():
    if len(sys.argv) != 2 or not os.path.isdir(sys.argv[1]):
        print("usage: notes_server.py <notes-folder>", file=sys.stderr)
        sys.exit(2)
    folder = os.path.realpath(sys.argv[1])
    for line in sys.stdin:
        if not line.strip():
            continue
        response = answer(folder, json.loads(line))
        if response is not None:
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
