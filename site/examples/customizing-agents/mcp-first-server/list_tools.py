"""Fixture for "Predict the tool list": what tools/list returns from the stand-in."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import client

if __name__ == "__main__":
    server = client.start(client.HANDBOOK)
    response = client.request(server, "tools/list")
    for tool in response["result"]["tools"]:
        print(tool["name"])
    client.stop(server)
