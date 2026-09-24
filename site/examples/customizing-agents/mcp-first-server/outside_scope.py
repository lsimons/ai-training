"""Fixture for "Predict the refusal": list_directory on the parent of the allowed directory."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import client

if __name__ == "__main__":
    server = client.start(client.HANDBOOK)
    parent = os.path.dirname(client.HANDBOOK)
    text, is_error = client.call(server, "list_directory", {"path": parent})
    print(text.split(":")[0])
    print(f"isError: {is_error}")
    client.stop(server)
