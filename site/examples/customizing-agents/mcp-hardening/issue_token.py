"""Print a token for the lesson's notes server.

    python3 issue_token.py --scope read --hours 1 --owner yourname

The scope is `read` or `read+share`, and the token stops working `hours`
from now. Put your own name in `--owner`, so the log names you.
"""

import argparse

import notes_token

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Print a token for the notes server.")
    parser.add_argument("--scope", choices=notes_token.SCOPES, required=True)
    parser.add_argument("--hours", type=float, required=True)
    parser.add_argument("--owner", required=True)
    options = parser.parse_args()
    try:
        print(notes_token.issue(options.scope, options.hours, options.owner))
    except ValueError as error:
        parser.error(str(error))
