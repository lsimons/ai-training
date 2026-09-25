"""Fixture for "Measure the definitions": what the tracker server's tool list costs per turn."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import measure

if __name__ == "__main__":
    tools = measure.list_tools()
    definitions = measure.definitions_text(tools)
    names = measure.names_text(tools)
    print(f"tools: {len(tools)}")
    size = f"{len(definitions):,} characters, about {measure.tokens(definitions):,} tokens"
    print(f"definitions: {size}")
    print(f"names only: {len(names):,} characters, about {measure.tokens(names):,} tokens")
