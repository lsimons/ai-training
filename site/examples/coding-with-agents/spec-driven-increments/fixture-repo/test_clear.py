import unittest

import store


class ClearTests(unittest.TestCase):
    def test_remove_done_removes_every_done_item(self):
        items = [
            {"text": "Buy milk", "done": False},
            {"text": "Call the plumber", "done": True},
            {"text": "Renew the passport", "done": True},
            {"text": "Water the plants", "done": False},
        ]
        removed = store.remove_done(items)
        self.assertEqual(removed, 2)
        self.assertEqual([item["text"] for item in items], ["Buy milk", "Water the plants"])


if __name__ == "__main__":
    unittest.main()
