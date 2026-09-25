"""The agent's change to the free-shipping threshold, and what it left stale.

The brief asks the agent to raise the threshold from 50.00 EUR to 60.00 EUR,
and the shop's AGENTS.md lists the three places its documentation is in.
The copy is committed and tagged `before-change` first. The change edits the
constant and the module docstring in pricing.py, and adds a test with the
new threshold in it. It leaves README.md and docs/pricing.md alone.

The fixture then prints what the reviewer sees: the list of changed files,
with a fixed width so the output doesn't depend on the terminal, the tests,
and a search for the old threshold in the three places AGENTS.md names.
grep gets the file names in a fixed order, so its output is the same on
every system.
"""

import os
import sys
import tempfile

from _common import git, make_copy, print_tests, replace, run_command

NEW_TEST = """

def test_free_shipping_starts_at_sixty():
    assert shipping(60.00) == 0.0, shipping(60.00)
    assert shipping(59.99) == 4.95, shipping(59.99)
"""

DOCS = ("README.md", "docs/pricing.md", "pricing.py")


def apply_change(copy: str) -> None:
    pricing = os.path.join(copy, "pricing.py")
    replace(pricing, "FREE_SHIPPING_FROM = 50.00\n", "FREE_SHIPPING_FROM = 60.00\n")
    replace(pricing, "Orders from 50.00 EUR ship free", "Orders from 60.00 EUR ship free")
    tests = os.path.join(copy, "test_pricing.py")
    replace(
        tests,
        "    assert total(ORDER) == 49.95, total(ORDER)\n",
        "    assert total(ORDER) == 49.95, total(ORDER)\n" + NEW_TEST,
    )
    replace(
        tests,
        "    test_total_of_a_known_order,\n]",
        "    test_total_of_a_known_order,\n    test_free_shipping_starts_at_sixty,\n]",
    )


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        copy = make_copy(tmpdir)
        git(copy, "init", "--quiet", "--initial-branch=main")
        git(copy, "add", ".")
        git(copy, "commit", "--quiet", "-m", "Before the agent's change")
        git(copy, "tag", "before-change")
        apply_change(copy)
        print("$ git add -A")
        git(copy, "add", "-A")
        print("$ git diff --cached --stat before-change")
        print(git(copy, "diff", "--cached", "--stat=80", "before-change"), end="")
        print_tests(copy)
        print(f'$ grep -n "50.00" {" ".join(DOCS)}')
        # grep exits with status 1 when nothing matches, which is not an error here.
        print(run_command(copy, "grep", "-n", "50.00", *DOCS, allowed=(0, 1)), end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
