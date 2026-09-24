"""The test the agent writes for the third increment, kept out of fixture-repo.

The scripts copy this file into a copy of fixture-repo along with the
increment's code changes. It covers criterion 4 of SPEC.md at the function
level. The exit status and the unchanged file are checked by running the
command.
"""

import unittest

import todo  # pyright: ignore[reportMissingImports]  # todo.py is in fixture-repo, where this file is copied before it runs


class BadDateTests(unittest.TestCase):
    def test_iso_date_is_valid(self):
        self.assertTrue(todo.valid_date("2026-10-01"))

    def test_words_and_wrong_order_are_refused(self):
        self.assertFalse(todo.valid_date("tomorrow"))
        self.assertFalse(todo.valid_date("01-10-2026"))


if __name__ == "__main__":
    unittest.main()
