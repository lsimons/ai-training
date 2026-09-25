"""The hook, fed by hand after a lockfile-only edit.

For the lesson "Writing a hook that blocks a mistake". This is what the
learner sees when they pipe a PreToolUse call for `git commit` into
`.claude/hooks/lockfile_guard.py` in their copy, after changing the version
in `package-lock.json` and nothing else: the message on stderr, then the exit
code that `echo "exit code $?"` prints.
"""

import tempfile
from pathlib import Path

from harness import fresh_repo, run_hook


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = fresh_repo(Path(tmp))
        repo.set_version("package-lock.json", "1.0.0", "1.1.0")
        code, stderr = run_hook(repo, "git commit -am bump")
        print(stderr, end="")
        print(f"exit code {code}")


if __name__ == "__main__":
    main()
