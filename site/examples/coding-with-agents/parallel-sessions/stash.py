"""Two sessions and one stash.

Both sessions have work that isn't committed yet. The docs session stashes
its half-done README. Then the API session, in its own worktree, lists the
stash and pops it.
"""

import tempfile

from _common import add_worktrees, edit_api, edit_docs, git_ok, make_shop, prompt


def show(tree: str, *args: str) -> None:
    prompt(tree, "git " + " ".join(args))
    out = git_ok(tree, *args)
    print(out.rstrip("\n") if out.strip() else "(nothing)")


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        shop = make_shop(tmpdir)
        api, docs = add_worktrees(shop)
        edit_api(api)
        edit_docs(docs)
        prompt(docs, 'git stash push -m "usage section, half done"')
        git_ok(docs, "stash", "push", "-q", "-m", "usage section, half done")
        show(api, "stash", "list")
        prompt(api, "git stash pop")
        git_ok(api, "stash", "pop", "-q")
        show(api, "status", "--short")
        show(docs, "stash", "list")
        show(docs, "status", "--short")


if __name__ == "__main__":
    main()
