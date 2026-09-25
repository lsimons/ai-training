"""Integrates the two sessions' branches in a fixed order.

Both sessions commit their work, and the docs session runs the check
before its commit. The API branch merges into `main`
first. The docs session then rebases its branch on the new `main` and runs
the check, fixes what the check reports, and its branch merges second.
The script prints each command and a short result in place of git's own
messages, which differ between git versions.
"""

import tempfile

from _common import (
    API_BRANCH,
    API_SUBJECT,
    DOCS_BRANCH,
    DOCS_FIX,
    DOCS_FIX_SUBJECT,
    DOCS_SUBJECT,
    add_worktrees,
    commit_all,
    edit_api,
    edit_docs,
    git,
    git_ok,
    make_shop,
    prompt,
    replace,
    run_check,
)


def main() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        shop = make_shop(tmpdir)
        api, docs = add_worktrees(shop)
        edit_api(api)
        commit_all(api, API_SUBJECT)
        edit_docs(docs)
        prompt(docs, "python3 check.py")
        run_check(docs)
        commit_all(docs, DOCS_SUBJECT)

        prompt(shop, f"git merge --ff-only {API_BRANCH}")
        git_ok(shop, "merge", "-q", "--ff-only", API_BRANCH)
        prompt(docs, "git rebase main")
        rebased = git(docs, "rebase", "main").returncode == 0
        print("rebased with no conflict" if rebased else "rebase stopped on a conflict")
        prompt(docs, "python3 check.py")
        run_check(docs)

        replace(docs, "README.md", DOCS_FIX)
        commit_all(docs, DOCS_FIX_SUBJECT)
        print(f"(the docs session fixes the example and commits: {DOCS_FIX_SUBJECT})")
        prompt(docs, "python3 check.py")
        run_check(docs)

        prompt(shop, f"git merge --ff-only {DOCS_BRANCH}")
        git_ok(shop, "merge", "-q", "--ff-only", DOCS_BRANCH)
        prompt(shop, "git log --format=%s")
        print(git_ok(shop, "log", "--format=%s").rstrip("\n"))


if __name__ == "__main__":
    main()
