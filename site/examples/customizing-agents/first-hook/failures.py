"""Three ways the hook can fail to do its job, and the exit code of each.

For the lesson "Writing a hook that blocks a mistake". The repository has a
hand edit of the version in `package-lock.json` alone, the change the hook
exists to block.

1. The hook gets input that isn't JSON. It fails closed with code 2.
2. The settings entry is in exec form (`"command": "python3"` with `args`)
   and the script path has a typo. `python3` can't open the file and exits
   with code 2, so Claude Code blocks every matching command, with Python's
   error as the reason.
3. The settings entry is in shell form and runs the script by a mistyped
   path, with no interpreter in front. The shell can't find it and exits
   with code 127, a non-blocking error, so the commit runs. The code comes
   from who reports the missing file: `python3` exits with 2 whichever form
   starts it.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from harness import fresh_repo, run_hook_raw


def exit_code(argv: "list[str]", cwd: Path, env: "dict[str, str]") -> int:
    return subprocess.run(argv, cwd=cwd, env=env, capture_output=True, check=False).returncode


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = fresh_repo(Path(tmp))
        repo.set_version("package-lock.json", "1.0.0", "1.1.0")
        typo = str(repo.path / ".claude" / "hooks" / "lockfile_gaurd.py")

        code, _ = run_hook_raw(repo, "not json")
        print(f"input that isn't JSON: exit {code}")
        code = exit_code([sys.executable, typo], repo.path, repo.env)
        print(f"mistyped path, exec form: exit {code}")
        code = exit_code(["sh", "-c", typo], repo.path, repo.env)
        print(f"mistyped path, shell form: exit {code}")


if __name__ == "__main__":
    main()
