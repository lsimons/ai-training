"""Fixture for "A session, not a query": what each setup reads over a ten-turn session.

The query runs on the first turn, and its call and result stay in the
conversation, so the model reads them again on every later turn. Tool
definitions are read on every turn. With tool search, the names are read
on every turn, and the one definition that search loads for the query
stays in the conversation from then on. The CLI runs through the agent's
shell tool, which is there in every setup, so it adds no definition.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import measure

TURNS = 10
USED = ["search_issues", "get_issue", "add_comment"]

if __name__ == "__main__":
    tools = measure.list_tools()
    kept = [tool for tool in tools if tool["name"] in USED]
    searched = [tool for tool in tools if tool["name"] == "search_issues"]
    call, result = measure.server_query({"state": "open", "labels": ["bug", "login"]})
    command, output = measure.cli_query(["list", "--label", "bug", "--label", "login"])
    server_query = measure.tokens(call) + measure.tokens(result)
    cli_query = measure.tokens(command) + measure.tokens(output)
    setups = [
        (
            "server, all 20 tools loaded",
            measure.tokens(measure.definitions_text(tools)),
            server_query,
        ),
        (
            "server, tool search",
            measure.tokens(measure.names_text(tools))
            + measure.tokens(measure.definitions_text(searched)),
            server_query,
        ),
        ("server, 3 tools loaded", measure.tokens(measure.definitions_text(kept)), server_query),
        ("cli", 0, cli_query),
    ]
    print(f"tokens read over {TURNS} turns")
    for label, per_turn, query in setups:
        print(f"{label:<28} {TURNS * (per_turn + query):>7,}")
