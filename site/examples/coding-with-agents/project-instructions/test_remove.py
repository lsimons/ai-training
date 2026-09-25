"""The test session 2 added, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo together with the
`remove` command, and run the suite there.
"""

import unittest

import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


class RemoveTests(unittest.TestCase):
    def test_remove_drops_the_numbered_item(self):
        items = [{"text": "Buy milk", "done": False}, {"text": "Call the plumber", "done": True}]
        self.assertEqual(todo.remove(items, 2), "removed #2: Call the plumber")
        self.assertEqual(items, [{"text": "Buy milk", "done": False}])

    def test_remove_out_of_range_changes_nothing(self):
        items = [{"text": "Buy milk", "done": False}]
        self.assertEqual(todo.remove(items, 3), "no item #3")
        self.assertEqual(len(items), 1)
