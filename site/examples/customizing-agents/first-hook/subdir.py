"""The hook with the agent working in a subdirectory of the repository.

For the lesson "Writing a hook that blocks a mistake". A second package,
`app/`, sits inside the fixture repository, the way a monorepo holds several.
Claude Code sends the agent's working directory as `cwd`, and here it is
`app/`. The hook asks git from the root of the repository, so the paths it
compares are the same whatever `cwd` is.

1. `app/package.json` changed, and `app/package-lock.json` is new and
   untracked: the pair changed together, and the commit passes.
2. After both are committed, `app/package-lock.json` changes alone: the hook
   blocks, and its first line names the right path.
"""

import tempfile
from pathlib import Path

from harness import fresh_repo, run_hook

MANIFEST = '{\n  "name": "app",\n  "version": "1.0.0"\n}\n'
LOCKFILE = '{\n  "name": "app",\n  "version": "1.0.0",\n  "lockfileVersion": 3\n}\n'


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = fresh_repo(Path(tmp))
        repo.write("app/package.json", MANIFEST)
        repo.git("add", "app/package.json")
        repo.git("commit", "-q", "-m", "Add app")

        repo.set_version("app/package.json", "1.0.0", "1.1.0")
        repo.write("app/package-lock.json", LOCKFILE.replace("1.0.0", "1.1.0"))
        code, _ = run_hook(repo, 'git add -A && git commit -m "Lock app"', subdir="app")
        print(f"manifest changed, new untracked lockfile: exit {code}")

        repo.git("add", "-A")
        repo.git("commit", "-q", "-m", "Lock app")
        repo.set_version("app/package-lock.json", "1.1.0", "1.2.0")
        code, stderr = run_hook(repo, 'git commit -am "Bump app"', subdir="app")
        print(f"lockfile changed alone: exit {code}")
        print(stderr.splitlines()[0])


if __name__ == "__main__":
    main()
