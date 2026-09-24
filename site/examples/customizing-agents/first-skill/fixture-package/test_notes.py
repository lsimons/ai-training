"""Tests for notes.py. Run with `python3 -m unittest -q`."""

import unittest

import notes


class NotesTest(unittest.TestCase):
    def test_add_appends(self) -> None:
        self.assertEqual(notes.add(["a"], "b"), ["a", "b"])

    def test_add_keeps_the_input(self) -> None:
        before = ["a"]
        notes.add(before, "b")
        self.assertEqual(before, ["a"])

    def test_render_numbers_from_one(self) -> None:
        self.assertEqual(notes.render(["a", "b"]), "1. a\n2. b")

    def test_version_is_three_numbers(self) -> None:
        self.assertEqual(len(notes.__version__.split(".")), 3)


if __name__ == "__main__":
    unittest.main()
