# Undo a release of the notes package

The release skill sends you here. Use these steps only when the user
asks you to undo a release, or when a check after the tag shows that the
release is wrong. Undo nothing else.

1. Run `git describe --tags`, `git log --format='%h %s' -n 3` and
   `git status --porcelain`. The newest commit must be
   `release: <version>`, `git describe --tags` must print exactly
   `v<version>`, and `git status --porcelain` must print nothing, or only
   `?? __pycache__/`. If any of them is different, stop and report what
   the three commands printed.
2. Ask the user whether the tag or the release commit has been pushed.
   Don't decide this from the remote yourself, because a colleague may
   have fetched the tag already.
3. If nothing was pushed:
   1. Delete the tag with `git tag -d v<version>`.
   2. Remove the release commit with `git reset --hard HEAD~1`. This also
      removes the version change and the changelog entry, and it drops
      uncommitted changes. Run it only after step 1 above showed that the
      release commit is the newest commit and the working tree is clean.
   3. Run `python3 release_check.py`. It must print
      `release <previous version>: ok`. If it prints a `FAIL` line, stop
      and report it. Don't edit `release_check.py`.
4. If the tag or the release commit was pushed:
   1. Don't delete the tag on the remote, don't reset, and never force a
      push. Other people may already have the tag.
   2. Fix the problem in a new commit, and release again with the
      skill's Steps section, with the last number of the version one
      higher.
   3. In the changelog entry of the new release, add the bullet
      `Replaces <version>, which <what was wrong>.`
5. Report what you undid, each command you ran, and what
   `git describe --tags` and `git status --porcelain` print now.
