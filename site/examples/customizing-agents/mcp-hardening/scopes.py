"""Fixture for "Predict the three tokens": one share_note call under each of three tokens."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import client
import notes_token

TOKENS = [
    ("read+share, 720 hours", notes_token.issue("read+share", 720, "you")),
    ("read, 1 hour", notes_token.issue("read", 1, "you")),
    ("read, 0 hours", notes_token.issue("read", 0, "you")),
]

if __name__ == "__main__":
    for label, token in TOKENS:
        session = client.Session(token)
        text, is_error = session.call(
            "share_note", {"name": "retro.md", "to": "archive@example.com"}
        )
        session.close()
        print(f"{label}: {text}")
