"""The test the agent writes for the first increment, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo along with the
increment's code changes. Run from inside fixture-repo after the increment it
passes, and before it the `due` command doesn't exist.
"""

import unittest

import render  # pyright: ignore[reportMissingImports]  # render.py is in fixture-repo, where this file is copied before it runs
import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


class DueTests(unittest.TestCase):
    def test_due_sets_the_date_and_reports(self):
        items = [{"text": "Buy milk", "done": False}]
        self.assertEqual(todo.due(items, 1, "2026-10-01"), "due #1: Buy milk by 2026-10-01")
        self.assertEqual(items[0]["due"], "2026-10-01")

    def test_list_shows_the_date_and_leaves_other_items_alone(self):
        items = [
            {"text": "Buy milk", "done": False, "due": "2026-10-01"},
            {"text": "Water the plants", "done": False},
        ]
        expected = "\n".join(
            [
                "1. [ ] Buy milk (due 2026-10-01)",
                "2. [ ] Water the plants",
                "2 open, 0 done",
            ]
        )
        self.assertEqual(render.list_items(items), expected)


if __name__ == "__main__":
    unittest.main()
