"""The project check: the unit tests, then every `>>>` example in README.md, run by doctest.

Prints one line per part and `check passed` or `check failed` last, and
exits with status 1 when anything fails.
"""

import doctest
import os
import sys
import traceback
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


class ReadmeRunner(doctest.DocTestRunner):
    """A doctest runner that keeps one short line per failed example."""

    def __init__(self) -> None:
        super().__init__(verbose=False)
        self.problems: list[str] = []

    def report_start(self, out, test, example) -> None:
        pass

    def report_success(self, out, test, example, got) -> None:
        pass

    def report_failure(self, out, test, example, got) -> None:
        shown = got.strip() or "no output"
        if example.exc_msg is not None:
            shown = shown.splitlines()[-1]
        self.problems.append(
            f"  {example.source.strip()}: expected {expected(example)}, got {shown}"
        )

    def report_unexpected_exception(self, out, test, example, exc_info) -> None:
        error = traceback.format_exception_only(exc_info[0], exc_info[1])[-1].strip()
        self.problems.append(
            f"  {example.source.strip()}: expected {expected(example)}, got {error}"
        )


def expected(example: doctest.Example) -> str:
    """What the example expects, as one line: the value, the exception line, or no output."""
    if example.exc_msg is not None:
        return example.exc_msg.strip()
    return example.want.strip() or "no output"


def run_readme() -> bool:
    with open(os.path.join(HERE, "README.md"), encoding="utf-8") as handle:
        text = handle.read()
    test = doctest.DocTestParser().get_doctest(
        text, {"quote": shipping.quote}, "README.md", "README.md", 0
    )
    runner = ReadmeRunner()
    results = runner.run(test, out=lambda _text: None, clear_globs=True)
    passed = results.attempted - results.failed
    print(f"README examples: {passed} passed, {results.failed} failed")
    for line in runner.problems:
        print(line)
    return results.failed == 0


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
