"""A minimal MCP client for the lesson's fixtures: start the notes server, shake hands, call tools.

A coding agent's client does the same over the stdio transport. The
environment the server gets is an allow-list: PATH, the token and the log
file, and nothing else from your shell.
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.join(HERE, "notes_server.py")
NOTES = os.path.join(HERE, "notes")


class Session:
    def __init__(self, token, folder=NOTES, log=None):
        env = {"PATH": os.environ.get("PATH", ""), "NOTES_TOKEN": token}
        if log is not None:
            env["NOTES_LOG"] = log
        self.process = subprocess.Popen(
            [sys.executable, SERVER, folder],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            env=env,
        )
        self.next_id = 1
        self.request(
            "initialize",
            {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "lesson-client", "version": "1.0.0"},
            },
        )
        self.send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def send(self, message):
        assert self.process.stdin is not None
        self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()

    def request(self, method, params=None):
        message = {"jsonrpc": "2.0", "id": self.next_id, "method": method}
        self.next_id += 1
        if params is not None:
            message["params"] = params
        self.send(message)
        assert self.process.stdout is not None
        response = json.loads(self.process.stdout.readline())
        if "error" in response:
            raise RuntimeError(response["error"]["message"])
        return response["result"]

    def call(self, name, arguments=None):
        """Send tools/call and return the result's text and its isError flag."""
        result = self.request("tools/call", {"name": name, "arguments": arguments or {}})
        return result["content"][0]["text"], result["isError"]

    def close(self):
        assert self.process.stdin is not None
        self.process.stdin.close()
        self.process.wait()
