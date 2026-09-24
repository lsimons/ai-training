---
name: release
description: Cut a release of the notes package. Use when asked to release, to bump the version, or to tag a new version.
---

# Release the notes package

Use this when the user asks for a release of this package. A release is a
version bump, a changelog entry, passing tests, and a tag. Ask for the new
version if the user did not give one. Bump the last number for a fix, the
middle one for a feature.

## Steps

1. Run `python3 -m unittest -q`. The last line must be `OK`. If it is
   not, stop and report the failure. Never release with a failing test.
2. In `notes.py`, change the `__version__` line to the new version.
3. In `CHANGELOG.md`, add a `## <version>` heading under the title, above
   the previous release, with one bullet per user-visible change since
   that release. Read `git log` for the list. Don't invent changes.
4. Run `python3 release_check.py`. It must print `release <version>: ok`.
   If it prints a `FAIL` line, fix what the line names and run it again.
   Don't edit `release_check.py`.
5. Commit with the message `release: <version>` and tag it
   `v<version>` with `git tag v<version>`.

## Done when

`python3 release_check.py` prints `release <version>: ok`, the commit is
on the branch and `git tag --list 'v*'` shows the new tag. Don't push.
Report the version, the tag and the changelog entry you wrote.
