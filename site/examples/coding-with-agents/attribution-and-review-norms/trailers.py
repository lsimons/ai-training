"""Shows which lines of a commit message git reads as trailers.

Usage:
    python3 trailers.py                  # the agent's commit-message.txt
    python3 trailers.py my-message.txt   # your rewrite

The script runs `git interpret-trailers --parse` on the file, which prints the
trailer lines git finds and nothing else. A line that looks like a trailer but
sits in the middle of the body is not one: git reads trailers only from the
last paragraph of the message, after a blank line.

git runs in an empty temporary directory, with only the variables below and no
user or system config, so no `trailer.*` setting of yours or of a repository
changes what it reports.
"""

import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT = os.path.join(HERE, "commit-message.txt")


def git_env(home: str) -> "dict[str, str]":
    return {
        "PATH": os.environ.get("PATH", ""),
        "HOME": home,
        "LANG": "C",
        "LC_ALL": "C",
        "GIT_CONFIG_GLOBAL": os.devnull,
        "GIT_CONFIG_SYSTEM": os.devnull,
        "GIT_CONFIG_NOSYSTEM": "1",
    }


def trailers(path: str) -> "list[str]":
    with tempfile.TemporaryDirectory() as tmpdir:
        result = subprocess.run(
            ["git", "interpret-trailers", "--parse", os.path.abspath(path)],
            cwd=tmpdir,
            env=git_env(tmpdir),
            capture_output=True,
            text=True,
        )
    if result.returncode != 0:
        raise SystemExit(f"git interpret-trailers failed:\n{result.stderr}")
    return result.stdout.splitlines()


def main(argv: "list[str]") -> int:
    path = argv[1] if len(argv) > 1 else DEFAULT
    found = trailers(path)
    if not found:
        print("no trailers")
    for line in found:
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
