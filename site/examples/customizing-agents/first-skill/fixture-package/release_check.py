"""Checks that the package is ready to tag: the version and the changelog agree and the tests pass.

The release skill in `.claude/skills/release/SKILL.md` ends by running this
file. It prints one line, `release <version>: ok`, or one line per problem
it finds, and exits non-zero when there is one.
"""

import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def version_of(source: str) -> str:
    """The value of `__version__` in the source of notes.py."""
    match = re.search(r'^__version__ = "([^"]+)"$', source, re.MULTILINE)
    if match is None:
        raise ValueError("notes.py has no __version__ line")
    return match.group(1)


def problems(version: str, changelog: str, tests_passed: bool) -> list[str]:
    """Everything that stops this version from being released."""
    found: list[str] = []
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        found.append(f"version {version!r} is not three numbers")
    if f"## {version}\n" not in changelog:
        found.append(f"CHANGELOG.md has no '## {version}' heading")
    if not tests_passed:
        found.append("the tests fail")
    return found


def run_tests(package: Path) -> bool:
    result = subprocess.run(
        [sys.executable, "-m", "unittest", "-q"],
        cwd=package,
        capture_output=True,
        text=True,
        check=False,
    )
    return result.returncode == 0


def report(package: Path) -> tuple[int, str]:
    """The exit code and the lines the check prints for the package directory."""
    version = version_of((package / "notes.py").read_text(encoding="utf-8"))
    changelog = (package / "CHANGELOG.md").read_text(encoding="utf-8")
    found = problems(version, changelog, run_tests(package))
    if not found:
        return 0, f"release {version}: ok"
    return 1, "\n".join(f"release {version}: FAIL: {problem}" for problem in found)


if __name__ == "__main__":
    code, text = report(HERE)
    print(text)
    sys.exit(code)
