"""A small secret scanner for the lesson.

It walks the current directory, including dotfiles, and reports every line
that looks like a key or a password. The patterns are the fixture's own
fake formats plus the two shapes real scanners start from: a `password` or
`token` assignment, and a long random-looking string after a key-like
prefix. Real scanners (gitleaks, for one) know hundreds of vendor formats
and check git history as well; this one shows what such a report reads
like.
"""

import os
import re
import sys
from collections.abc import Iterator

PATTERNS = [
    ("fake key", re.compile(r"sk-fake-[A-Za-z0-9-]{20,}")),
    ("fake token", re.compile(r"tok-fake-[A-Za-z0-9-]{20,}")),
    ("password assignment", re.compile(r"(password|passwd|pwd)[^\s@]*[=:][^\s@]+", re.IGNORECASE)),
]
SKIP_DIRS = {".git", "__pycache__"}
SKIP_FILES = {"scan.py", "env.sample"}


def files_under(root: str) -> Iterator[str]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            if name in SKIP_FILES:
                continue
            yield os.path.join(dirpath, name)


def scan_file(path: str) -> list[tuple[str, int, str]]:
    findings: list[tuple[str, int, str]] = []
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except (UnicodeDecodeError, OSError):
        return findings
    for number, line in enumerate(lines, start=1):
        for label, pattern in PATTERNS:
            if pattern.search(line):
                findings.append((path, number, label))
                break
    return findings


def main(root: str = ".") -> int:
    findings: list[tuple[str, int, str]] = []
    for path in files_under(root):
        findings.extend(scan_file(path))
    for path, number, label in findings:
        shown = os.path.relpath(path, root)
        print(shown + ":" + str(number) + "  " + label)
    print(str(len(findings)) + " finding(s)")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
