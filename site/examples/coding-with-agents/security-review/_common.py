"""Shared set-up for the security-review fixtures.

Every script builds the same small notes database in memory, so nothing on
disk changes. Two users each own two notes, and one of Alice's notes has an
apostrophe in its title.
"""

import sqlite3

NOTES = [
    ("alice", "Call O'Brien about the lease"),
    ("alice", "Plan the team offsite"),
    ("bob", "Plan salary review"),
    ("bob", "Bank login reminder"),
]


def notes_db() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE notes (owner TEXT NOT NULL, title TEXT NOT NULL)")
    conn.executemany("INSERT INTO notes (owner, title) VALUES (?, ?)", NOTES)
    return conn
