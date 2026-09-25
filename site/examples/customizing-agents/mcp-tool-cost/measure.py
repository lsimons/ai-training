"""Shared helpers for the lesson "Measuring what a tool server costs".

`start`, `request` and `call` are the client side of the stand-in server.
`tokens` estimates a token count with the rule of thumb from the concepts
course, about four characters per token. A client that counts with the
model's own tokenizer gives a different, exact number.
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.join(HERE, "tracker_server.py")
CLI = os.path.join(HERE, "tracker_cli.py")
SERVER_NAME = "tracker"


def tokens(text):
    """Estimate the tokens in `text` at four characters per token."""
    return round(len(text) / 4)


def start():
    """Launch the stand-in server as a child process on the stdio transport."""
    return subprocess.Popen(
        [sys.executable, SERVER],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
    )


def request(server, method, params=None, request_id=1):
    """Write one JSON-RPC line, read one back."""
    message = {"jsonrpc": "2.0", "id": request_id, "method": method}
    if params is not None:
        message["params"] = params
    assert server.stdin is not None and server.stdout is not None
    server.stdin.write(json.dumps(message) + "\n")
    server.stdin.flush()
    return json.loads(server.stdout.readline())


def stop(server):
    """Close the server's stdin, which ends the stdio session, and wait for it to exit."""
    assert server.stdin is not None
    server.stdin.close()
    server.wait()


def list_tools():
    """Return the tool definitions the server sends for tools/list."""
    server = start()
    tools = request(server, "tools/list")["result"]["tools"]
    stop(server)
    return tools


def definitions_text(tools):
    """The definitions as a client passes them to the model: name, description, schema."""
    return json.dumps(tools)


def names_text(tools):
    """The tool names alone, in the mcp__<server>__<tool> form the client shows the model."""
    return "\n".join(f"mcp__{SERVER_NAME}__{tool['name']}" for tool in tools)


def server_query(arguments):
    """Run one search through the server. Return the text of the call and the text of the result."""
    server = start()
    params = {"name": "search_issues", "arguments": arguments}
    response = request(server, "tools/call", params, request_id=2)
    stop(server)
    call_text = json.dumps({"name": f"mcp__{SERVER_NAME}__search_issues", "input": arguments})
    return call_text, response["result"]["content"][0]["text"]


def cli_query(args):
    """Run the same search through the CLI. Return the command line and what it printed."""
    command = ["python3", "tracker_cli.py", *args]
    completed = subprocess.run(
        [sys.executable, CLI, *args],
        stdout=subprocess.PIPE,
        text=True,
        check=True,
    )
    return " ".join(command), completed.stdout
