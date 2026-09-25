"""Four Bash commands held against the lockfile hook.

For the lesson "Writing a hook that blocks a mistake". The first three run
after a hand edit of the version in `package-lock.json` alone. The fourth
runs after the same edit in `package.json` as well. Each line is the command
and the exit code the hook returns for it.
"""

import tempfile
from pathlib import Path

from harness import fresh_repo, run_hook

LOCKFILE_ONLY = [
    "git status",
    'git commit -am "Bump version"',
    'git commit --no-verify -am "Bump version"',
]
BOTH_FILES = ['git commit -am "Bump version"']


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = fresh_repo(Path(tmp))
        repo.set_version("package-lock.json", "1.0.0", "1.1.0")
        for command in LOCKFILE_ONLY:
            code, _ = run_hook(repo, command)
            print(f"lockfile only, {command}: exit {code}")
        repo.set_version("package.json", "1.0.0", "1.1.0")
        for command in BOTH_FILES:
            code, _ = run_hook(repo, command)
            print(f"both files, {command}: exit {code}")


if __name__ == "__main__":
    main()
