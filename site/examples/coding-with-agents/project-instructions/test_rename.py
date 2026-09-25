"""The test session 1 added, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo together with the
`rename` command, and run the suite there.
"""

import unittest

import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


class RenameTests(unittest.TestCase):
    def test_rename_replaces_the_text(self):
        items = [{"text": "Buy milk", "done": False}]
        self.assertEqual(todo.rename(items, 1, "Buy oat milk"), "renamed #1: Buy oat milk")
        self.assertEqual(items, [{"text": "Buy oat milk", "done": False}])

    def test_rename_out_of_range_changes_nothing(self):
        items = [{"text": "Buy milk", "done": False}]
        self.assertEqual(todo.rename(items, 2, "Buy bread"), "no item #2")
        self.assertEqual(items, [{"text": "Buy milk", "done": False}])
