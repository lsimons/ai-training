"""A tiny stand-in for a file-system MCP server, for the lesson "Connecting your first tool server".

It speaks the stdio transport as the MCP specification defines it: one
JSON-RPC message per line on standard input, one per line on standard
output, nothing else on standard output. It offers three of the reference
file-system server's tools, scoped to the directories named on the command
line, and refuses a path outside them. The real server has more tools,
including ones that write, and it replaces that list with the roots a
client sends. This one takes no roots and can't change a file.

Run it by hand:  python3 stand_in.py handbook
Then type a request such as {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
"""

import errno
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
    # The reference server lists a path with Node's fs.readdir, which fails on
    # a file, and the MCP TypeScript SDK turns a failing tool into a result
    # with isError set. Its source:
    # https://github.com/modelcontextprotocol/servers/blob/18ce19763999dcf7697b00c86c3a427f01eb2919/src/filesystem/index.ts#L454-L464
    # https://github.com/modelcontextprotocol/typescript-sdk/blob/60321700871029401a2e3bed8fdf4f02c9ec3331/packages/server/src/server/mcp.ts#L282-L308
    if not os.path.isdir(path):
        raise NotADirectoryError(errno.ENOTDIR, "Not a directory", path)
    entries = []
    for entry in sorted(glob.glob(os.path.join(glob.escape(path), "*"))):
        prefix = "[DIR]" if os.path.isdir(entry) else "[FILE]"
        entries.append(f"{prefix} {os.path.basename(entry)}")
    return "\n".join(entries)


def read_text_file(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def call_tool(name, arguments, roots):
    """Run one tool. A refusal or a failed read is a result with isError set."""
    if name == "list_allowed_directories":
        return {"content": [{"type": "text", "text": "\n".join(roots)}], "isError": False}
    path = arguments.get("path", "")
    if not allowed(path, roots):
        text = f"Access denied - path outside allowed directories: {path}"
        return {"content": [{"type": "text", "text": text}], "isError": True}
    run = list_directory if name == "list_directory" else read_text_file
    try:
        text = run(path)
    except OSError as error:
        return {"content": [{"type": "text", "text": str(error)}], "isError": True}
    return {"content": [{"type": "text", "text": text}], "isError": False}


def error_response(request_id, code, message):
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def handle(request, roots):
    """Answer one JSON-RPC request. An unknown method or tool is a protocol error."""
    method = request.get("method")
    request_id = request.get("id")
    if method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = request.get("params", {})
        name = params.get("name")
        if name not in {tool["name"] for tool in TOOLS}:
            return error_response(request_id, -32602, f"Unknown tool: {name}")
        result = call_tool(name, params.get("arguments", {}), roots)
    else:
        return error_response(request_id, -32601, f"Method not found: {method}")
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


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
