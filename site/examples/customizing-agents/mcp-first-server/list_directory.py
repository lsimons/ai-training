"""Fixture for "Predict the listing": tools/call list_directory on the handbook directory."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import client

if __name__ == "__main__":
    server = client.start(client.HANDBOOK)
    text, is_error = client.call(server, "list_directory", {"path": client.HANDBOOK})
    print(text)
    print(f"isError: {is_error}")
    client.stop(server)
