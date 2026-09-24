"""The test file the agent added to the branch, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo along with the agent's
code changes. It tests what the agent built and not what the spec asks: there
is no test for `nothing overdue` and none for the exit status of a bad date.
"""

import os
import unittest
from unittest import mock

import render  # pyright: ignore[reportMissingImports]  # render.py is in fixture-repo, where this file is copied before it runs
import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


def sample():
    return [
        {"text": "Buy milk", "done": False, "due": "2026-10-01"},
        {"text": "Call the plumber", "done": True, "due": "2026-09-01"},
        {"text": "Water the plants", "done": False},
    ]


class DueDatesTests(unittest.TestCase):
    def test_due_sets_the_date_and_reports(self):
        items = [{"text": "Buy milk", "done": False}]
        self.assertEqual(todo.due(items, 1, "2026-10-01"), "due #1: Buy milk by 2026-10-01")
        self.assertEqual(items[0]["due"], "2026-10-01")

    def test_list_shows_the_date(self):
        expected = "\n".join(
            [
                "1. [ ] Buy milk (due 2026-10-01)",
                "2. [x] Call the plumber (due 2026-09-01)",
                "3. [ ] Water the plants",
                "2 open, 1 done",
            ]
        )
        self.assertEqual(render.list_items(sample()), expected)

    def test_open_item_with_a_past_date_is_overdue(self):
        with mock.patch.dict(os.environ, {"TODO_TODAY": "2026-10-02"}):
            self.assertEqual(todo.overdue(sample()), "1. [ ] Buy milk (due 2026-10-01)")

    def test_words_are_not_a_date(self):
        self.assertFalse(todo.valid_date("tomorrow"))
        self.assertTrue(todo.valid_date("2026-10-01"))


if __name__ == "__main__":
    unittest.main()
