"""The test the agent writes for the second increment, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo along with the
increment's code changes. The two dates are the ones criterion 3 of SPEC.md
names.
"""

import os
import unittest

import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


def sample():
    return [
        {"text": "Buy milk", "done": False, "due": "2026-10-01"},
        {"text": "Call the plumber", "done": True, "due": "2026-09-01"},
        {"text": "Water the plants", "done": False},
    ]


class OverdueTests(unittest.TestCase):
    def test_open_item_with_a_past_date_is_overdue(self):
        os.environ["TODO_TODAY"] = "2026-10-02"
        self.assertEqual(todo.overdue(sample()), "1. [ ] Buy milk (due 2026-10-01)")

    def test_nothing_overdue_before_the_date(self):
        os.environ["TODO_TODAY"] = "2026-09-30"
        self.assertEqual(todo.overdue(sample()), "nothing overdue")


if __name__ == "__main__":
    unittest.main()
