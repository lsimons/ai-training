---
name: release
description: Cut a release of the notes package. Use when asked to release, to bump the version, or to tag a new version.
---

# Release the notes package

Use this when the user asks for a release of this package. A release is a
version bump, a changelog entry, passing tests, and a tag. Ask for the new
version if the user did not give one. Bump the last number for a fix, the
middle one for a feature.

## Before you start

Run these checks in order. If one fails, stop, and report the command, what
it printed and what the user has to do. Don't fix the repository yourself.

1. `git --version` and `python3 --version` each print a version. If one
   prints an error, that tool is missing. Name it and stop.
2. `git status --porcelain` prints nothing, or only `?? __pycache__/`.
   An error means this directory is not a git repository. Any other line
   is an uncommitted change. Say which, and stop.
3. `git describe --tags --abbrev=0` prints the tag of the previous
   release, `v` and the `__version__` in `notes.py`. If it fails, there is
   no release tag. Ask the user to tag the commit of the previous release,
   and stop. Don't work that commit out from the changelog.
4. `git log --format=%s <tag>..HEAD` prints at least one line. If it
   prints nothing, there is nothing to release. Say so and stop.

## Steps

1. Run `python3 -m unittest -q`. The last line must be `OK`. If it is
   not, stop and report the failure. Never release with a failing test.
2. In `notes.py`, change the `__version__` line to the new version.
3. In `CHANGELOG.md`, add a `## <version>` heading under the title, above
   the previous release, with one bullet per user-visible change in the
   log from check 4. Leave out a commit a user would not notice. Never
   write a bullet that no commit in that log supports.
4. Run `python3 release_check.py`. It must print `release <version>: ok`.
   If it prints a `FAIL` line, fix what the line names and run it again.
   Don't edit `release_check.py`.
5. Stage `notes.py` and `CHANGELOG.md` only, and commit with the message
   `release: <version>`. Step 1 leaves a `__pycache__` directory behind.
   Don't commit it. Then tag the commit with `git tag v<version>`.

## When a release goes wrong

If the user asks you to undo a release, or a check after the tag shows
that the release is wrong, read `rollback.md` in this skill's directory
and follow it. Don't undo anything before you have read it.

## Done when

`python3 release_check.py` prints `release <version>: ok`,
`git describe --tags` prints exactly `v<version>`, and
`git status --porcelain` prints nothing, or only `?? __pycache__/`.
Don't push.
Report the version, the tag and the changelog entry, with the commit
each bullet came from.
