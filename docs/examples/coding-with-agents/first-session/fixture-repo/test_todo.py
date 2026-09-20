import unittest

import todo


def sample():
    return [
        {"text": "Buy milk", "done": False},
        {"text": "Call the plumber", "done": False},
        {"text": "Water the plants", "done": False},
    ]


class TodoTests(unittest.TestCase):
    def test_add_appends_and_reports_number(self):
        items = []
        self.assertEqual(todo.add(items, "Buy milk"), "added #1: Buy milk")
        self.assertEqual(items, [{"text": "Buy milk", "done": False}])

    def test_list_numbers_from_one(self):
        items = sample()
        items[1]["done"] = True
        expected = "1. [ ] Buy milk\n2. [x] Call the plumber\n3. [ ] Water the plants"
        self.assertEqual(todo.list_items(items), expected)

    def test_list_empty(self):
        self.assertEqual(todo.list_items([]), "nothing to do")

    def test_done_marks_the_numbered_item(self):
        items = sample()
        self.assertEqual(todo.done(items, 1), "done #1: Buy milk")
        self.assertTrue(items[0]["done"])
        self.assertFalse(items[1]["done"])


if __name__ == "__main__":
    unittest.main()
