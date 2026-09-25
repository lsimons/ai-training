"""Rewrites the test that passed through the break, and runs the tests again.

`test_small_order_pays_shipping` compared the shipping cost with the
`SHIPPING` constant from pricing.py, so it passed whatever the constant
held. The rewrite states the price the shop charges, 4.95, in the test.
With the same break in pricing.py, the rewritten test fails too, and both
failures print the wrong value.
"""

import os
import sys
import tempfile

from _common import MIRROR_TEST, PINNED_TEST, PRICE, WRONG_PRICE, make_copy, print_tests, replace


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        replace(os.path.join(copy, "pricing.py"), PRICE, WRONG_PRICE)
        replace(os.path.join(copy, "test_pricing.py"), MIRROR_TEST, PINNED_TEST)
        print_tests(copy)
    return 0


if __name__ == "__main__":
    sys.exit(main())
