"""Runs the agent's search_notes as Alice, with three search terms.

The first term is what the brief had in mind. The second is what a hostile
user types into the search box. The third is an ordinary title with an
apostrophe in it.
"""

from _common import notes_db
from notes_search import search_notes

TERMS = ["plan", "%' OR owner != '", "O'Brien"]

conn = notes_db()
for term in TERMS:
    print(f"{term!r}: {search_notes(conn, 'alice', term)}")
