"""Counts the titles the agent's search_notes returns for Alice's hostile term."""

from _common import notes_db
from notes_search import search_notes

print(len(search_notes(notes_db(), "alice", "%' OR owner != '")))
