"""A tiny stand-in for a file-system MCP server, for the lesson "Connecting your first tool server".

It speaks the stdio transport as the MCP specification defines it: one
JSON-RPC message per line on standard input, one per line on standard
output, nothing else on standard output. It offers three of the reference
file-system server's tools, scoped to the directories named on the command
line, and refuses a path outside them. The real server has more tools,
including ones that write. This one can't change a file.

Run it by hand:  python3 stand_in.py handbook
Then type a request such as {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
"""

import glob
import json
import os
import sys

TOOLS = [
    {
        "name": "list_allowed_directories",
        "description": "List the directories this server may read.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_directory",
        "description": "List the entries of a directory, each prefixed with [FILE] or [DIR].",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
    {
        "name": "read_text_file",
        "description": "Return the complete text of one file.",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
]


def allowed(path, roots):
    """True when `path` is one of the allowed directories or inside one."""
    real = os.path.realpath(path)
    return any(real == root or real.startswith(root + os.sep) for root in roots)


def list_directory(path):
    entries = []
    for entry in sorted(glob.glob(os.path.join(glob.escape(path), "*"))):
        prefix = "[DIR]" if os.path.isdir(entry) else "[FILE]"
        entries.append(f"{prefix} {os.path.basename(entry)}")
    return "\n".join(entries)


def read_text_file(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def call_tool(name, arguments, roots):
    """Run one tool. A refusal is a result with isError, as the specification says."""
    if name == "list_allowed_directories":
        return {"content": [{"type": "text", "text": "\n".join(roots)}], "isError": False}
    path = arguments.get("path", "")
    if not allowed(path, roots):
        text = f"Access denied - path outside allowed directories: {path}"
        return {"content": [{"type": "text", "text": text}], "isError": True}
    if name == "list_directory":
        text = list_directory(path)
    elif name == "read_text_file":
        text = read_text_file(path)
    else:
        return {"content": [{"type": "text", "text": f"Unknown tool: {name}"}], "isError": True}
    return {"content": [{"type": "text", "text": text}], "isError": False}


def handle(request, roots):
    """Answer one JSON-RPC request."""
    method = request.get("method")
    if method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = request.get("params", {})
        result = call_tool(params.get("name"), params.get("arguments", {}), roots)
    else:
        error = {"code": -32601, "message": f"Method not found: {method}"}
        return {"jsonrpc": "2.0", "id": request.get("id"), "error": error}
    return {"jsonrpc": "2.0", "id": request.get("id"), "result": result}


def serve(roots):
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        response = handle(json.loads(line), roots)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("usage: python3 stand_in.py <allowed directory> [more directories]\n")
        sys.exit(2)
    serve([os.path.realpath(arg) for arg in sys.argv[1:]])
