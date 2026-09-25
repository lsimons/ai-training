"""The test the brief asks for. It fails on the agent's version.

Run it from a directory whose notes_search.py is the version under test.
"""

import unittest

from _common import notes_db
from notes_search import search_notes


class SearchNotesTest(unittest.TestCase):
    def test_hostile_term_sees_only_own_notes(self) -> None:
        conn = notes_db()
        self.assertEqual(search_notes(conn, "alice", "%' OR owner != '"), [])

    def test_apostrophe_in_term_finds_the_note(self) -> None:
        conn = notes_db()
        self.assertEqual(search_notes(conn, "alice", "O'Brien"), ["Call O'Brien about the lease"])


if __name__ == "__main__":
    unittest.main()
