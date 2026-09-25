"""Tests for shipping.quote."""

import unittest

from shipping import quote


class QuoteTest(unittest.TestCase):
    def test_one_kilo(self) -> None:
        self.assertEqual(quote(1), "EUR 5.50")

    def test_started_kilo(self) -> None:
        self.assertEqual(quote(2.3), "EUR 8.50")


if __name__ == "__main__":
    unittest.main()
