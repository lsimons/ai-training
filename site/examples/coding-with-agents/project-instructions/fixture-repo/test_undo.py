"""The test the scoped brief asks the agent to add, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo together with the
`undo` command, and run the suite there.
"""

import unittest

import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


class UndoTests(unittest.TestCase):
    def test_undo_marks_the_numbered_item_open(self):
        items = [{"text": "Buy milk", "done": True}, {"text": "Call the plumber", "done": True}]
        self.assertEqual(todo.undo(items, 2), "open #2: Call the plumber")
        self.assertFalse(items[1]["done"])
        self.assertTrue(items[0]["done"])

    def test_undo_out_of_range_changes_nothing(self):
        items = [{"text": "Buy milk", "done": True}]
        self.assertEqual(todo.undo(items, 3), "no item #3")
        self.assertTrue(items[0]["done"])
