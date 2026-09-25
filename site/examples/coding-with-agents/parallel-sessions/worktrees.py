"""Opens a worktree for each of the two sessions, then lists the worktrees.

The list is `git worktree list --porcelain`, shortened to the folder name
and the branch of each worktree, because the full paths and the commit
hashes differ on every machine.
"""

import os
import tempfile

from _common import API_BRANCH, DOCS_BRANCH, git, git_ok, make_shop, prompt


def short_list(shop: str) -> "list[str]":
    lines = []
    path = ""
    for line in git_ok(shop, "worktree", "list", "--porcelain").splitlines():
        if line.startswith("worktree "):
            path = os.path.basename(line[len("worktree ") :])
        elif line.startswith("branch refs/heads/"):
            lines.append(f"{path:<10} {line[len('branch refs/heads/') :]}")
    return lines


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        shop = make_shop(tmpdir)
        for branch, folder in [(API_BRANCH, "../shop-api"), (DOCS_BRANCH, "../shop-docs")]:
            prompt(shop, f"git worktree add -b {branch} {folder}")
            git_ok(shop, "worktree", "add", "-q", "-b", branch, folder)
        prompt(shop, "git worktree list")
        for line in short_list(shop):
            print(line)
        prompt(shop, "git worktree add ../shop-extra main")
        refused = git(shop, "worktree", "add", "-q", "../shop-extra", "main").returncode != 0
        print("git refuses: main is checked out in shop" if refused else "git made the worktree")


if __name__ == "__main__":
    main()
