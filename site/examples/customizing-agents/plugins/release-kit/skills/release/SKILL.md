---
name: release
description: Cut a release of this package. Use when asked to release, bump the version or tag.
---

# Release the package

1. Run the tests. Stop and report if any test fails.
2. Read `CHANGELOG.md` and move the entries under "Unreleased" into a
   section for the new version, with today's date.
3. Bump the version in the package metadata to the new version.
4. Commit the two files with the message `Release <version>`.
5. Tag the commit `v<version>`. Don't push the tag.

## Done when

The tag exists on the release commit, and `CHANGELOG.md` has a section
for the new version with no entries left under "Unreleased".
