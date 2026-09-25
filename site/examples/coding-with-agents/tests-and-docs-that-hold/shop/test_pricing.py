"""Tests for pricing.py, written by a coding agent.

Run them from this directory:

    python3 test_pricing.py

Each test prints one line, pass or FAIL. The last line counts them, and the
exit status is 1 when a test fails, so an agent can run the file and read
the result.
"""

import sys

from pricing import FREE_SHIPPING_FROM, SHIPPING, shipping, subtotal, total

ORDER = [(2, 12.50), (1, 20.00)]


def test_subtotal_adds_the_lines():
    assert subtotal(ORDER) == 45.00, subtotal(ORDER)


def test_small_order_pays_shipping():
    assert shipping(10.00) == SHIPPING, shipping(10.00)


def test_large_order_ships_free():
    assert shipping(FREE_SHIPPING_FROM + 10) == 0.0, shipping(FREE_SHIPPING_FROM + 10)


def test_total_adds_shipping():
    expected = subtotal(ORDER) + shipping(subtotal(ORDER))
    assert total(ORDER) == expected, total(ORDER)


def test_total_of_a_known_order():
    assert total(ORDER) == 49.95, total(ORDER)


TESTS = [
    test_subtotal_adds_the_lines,
    test_small_order_pays_shipping,
    test_large_order_ships_free,
    test_total_adds_shipping,
    test_total_of_a_known_order,
]


def main():
    failed = 0
    for test in TESTS:
        try:
            test()
        except AssertionError as error:
            failed += 1
            print(f"{test.__name__}: FAIL: got {error}")
        else:
            print(f"{test.__name__}: pass")
    print(f"{len(TESTS) - failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
