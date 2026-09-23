"""The failing test the lesson has the agent write, kept out of fixture-repo.

The fixture's own suite passes as it ships, because the lesson's point is
that the agent writes this test and runs it before it touches store.py. The
scripts copy this file into a copy of fixture-repo when the lesson reaches
that step. Run from inside fixture-repo it fails as it should.
"""

import unittest

import store  # pyright: ignore[reportMissingImports]  # store.py is in fixture-repo, where this file is copied before it runs


class ClearTests(unittest.TestCase):
    def test_remove_done_removes_every_done_item(self):
        items = [
            {"text": "Buy milk", "done": False},
            {"text": "Call the plumber", "done": True},
            {"text": "Renew the passport", "done": True},
            {"text": "Water the plants", "done": False},
        ]
        removed = store.remove_done(items)
        self.assertEqual(removed, 2)
        self.assertEqual([item["text"] for item in items], ["Buy milk", "Water the plants"])


if __name__ == "__main__":
    unittest.main()
