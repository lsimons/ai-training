"""The project check: the unit tests, then every `>>>` example in README.md.

Prints one line per part and `check passed` or `check failed` last, and
exits with status 1 when anything fails.
"""

import doctest
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import shipping  # noqa: E402


def run_tests() -> bool:
    suite = unittest.defaultTestLoader.discover(HERE, pattern="test_*.py")
    result = unittest.TestResult()
    suite.run(result)
    failed = len(result.failures) + len(result.errors)
    print(f"tests: {result.testsRun - failed} passed, {failed} failed")
    return failed == 0


def run_readme() -> bool:
    with open(os.path.join(HERE, "README.md"), encoding="utf-8") as handle:
        text = handle.read()
    passed = 0
    problems = []
    for example in doctest.DocTestParser().get_examples(text):
        source = example.source.strip()
        expected = example.want.strip()
        got = repr(eval(source, {"quote": shipping.quote}))
        if got == expected:
            passed += 1
        else:
            problems.append(f"  {source}: expected {expected}, got {got}")
    print(f"README examples: {passed} passed, {len(problems)} failed")
    for line in problems:
        print(line)
    return not problems


def main() -> int:
    tests_ok = run_tests()
    readme_ok = run_readme()
    if tests_ok and readme_ok:
        print("check passed")
        return 0
    print("check failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
