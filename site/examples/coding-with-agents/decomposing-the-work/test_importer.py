"""The acceptance test for the parser, kept out of fixture-repo.

The lesson has the learner write this test before `importer.py` exists, so
the fixture's own suite passes as it ships. The scripts copy this file into a
copy of fixture-repo when the lesson reaches that step. Run from inside
fixture-repo without `importer.py` it errors, and next to a stub parser it
fails.
"""

import unittest

import importer  # pyright: ignore[reportMissingImports]  # importer.py is what the agent builds in fixture-repo, where this file is copied before it runs


class ImporterTests(unittest.TestCase):
    def test_parse_lines_keeps_text_and_done_mark_and_skips_blank_lines(self):
        lines = ["Buy milk", "", "x Call the plumber", "  Water the plants  "]
        self.assertEqual(
            importer.parse_lines(lines),
            [
                {"text": "Buy milk", "done": False},
                {"text": "Call the plumber", "done": True},
                {"text": "Water the plants", "done": False},
            ],
        )


if __name__ == "__main__":
    unittest.main()
