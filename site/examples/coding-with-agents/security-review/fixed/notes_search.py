"""Search for the notes app, after the review.

The query has placeholders, and sqlite3 passes owner and term to the
database as values, so no search text becomes part of the SQL. A database
error is raised to the caller instead of turning into an empty result. The
admin password comes from the environment, and is_admin raises an error
when it isn't set.
"""

import hmac
import os
import sqlite3


def is_admin(password: str) -> bool:
    """Lets the admin page in when the password matches."""
    expected = os.environ["NOTES_ADMIN_PASSWORD"]
    return hmac.compare_digest(password.encode(), expected.encode())


def search_notes(conn: sqlite3.Connection, owner: str, term: str) -> "list[str]":
    """Returns the titles of the owner's notes whose title contains term."""
    rows = conn.execute(
        "SELECT title FROM notes WHERE owner = ? AND title LIKE '%' || ? || '%' ORDER BY title",
        (owner, term),
    ).fetchall()
    return [row[0] for row in rows]
