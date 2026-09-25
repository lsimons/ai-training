"""Breaks the shipping price on purpose and runs the agent's tests.

The lesson has the learner change `SHIPPING = 4.95` to `SHIPPING = 5.95` in
pricing.py, a bug a customer would notice on every small order. The tests
that still pass are the ones that take their expected value from the code
they test.
"""

import os
import sys
import tempfile

from _common import PRICE, WRONG_PRICE, make_copy, print_tests, replace


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        replace(os.path.join(copy, "pricing.py"), PRICE, WRONG_PRICE)
        print_tests(copy)
    return 0


if __name__ == "__main__":
    sys.exit(main())
