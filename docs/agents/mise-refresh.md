# Refreshing the mise pin

How to move the pinned mise version and checksum in CI. `AGENTS.md` "Supply
chain" states the rule, and `supply-chain.md` holds the other procedures.

CI pins the mise binary itself: `version` and `sha256` on every
`mise-action` step in the workflows. `min_version` in `.mise.toml` is a
floor and requires at least that version locally. Dependabot sees none
of them.

To refresh, pick a release at least seven days old and run
`mise run mise-refresh <version>`. The task runs
`scripts/mise_refresh.py`, which does the download, verify and hash
steps and edits no file. In a temporary directory that it removes on
exit, it:

1. downloads the release's `SHASUMS256.txt` and `SHASUMS256.txt.minisig`
   and verifies the signature with the `minisign` pinned in `.mise.toml`,
   as
   `minisign -Vm SHASUMS256.txt -P RWTC3g8W3z4RZK3V3qv7fa1QY4JEWyBtqIHW+85QlJpZc5yG+uNYNBSZ`
   (the key in `minisign.pub` in the mise repository). The script reads
   the key from that command in this file, so a new key goes here and
   nowhere else.
2. downloads `mise-v<version>-linux-x64.tar.gz` and checks it against
   its line in `SHASUMS256.txt`.
3. reads `mise/bin/mise` out of the archive and prints its `sha256`
   (what `shasum -a 256` prints for the extracted file), with the release
   date from the GitHub releases API and its age in days.

A bad signature or a hash mismatch stops the task with exit code 1 and
a line that names the step. The task doesn't apply the seven-day rule
itself: check the printed date, then update the workflows and
`.mise.toml` in one commit.

The pinned `minisign` installs on Linux x64, macOS on Apple silicon and
Windows, the platforms that the aqua registry entry for 0.12 lists.
Upstream publishes an arm64 Linux binary that the entry doesn't map, and
no Intel macOS binary. The `os` list on the pin makes `mise install` skip
`minisign` on the other platforms, and `mise.lock` holds no checksum for
them. There, the task and the signature tests in
`tests/test_mise_refresh.py` fail with a message that says to install
`minisign` 0.12 from its GitHub release by hand.

With `sha256` set the action checks only that binary and skips its own
check of the download against the signed `SHASUMS256.txt`, so the
signature and checksum steps of the task replace it. The action fetches
the `.tar.zst` archive on runners that have `zstd`, and the binary is
the same in both archives. The first pin, 2026.9.12 chosen in #262 on
2026-09-24, was the release on the maintainer's machine and four days
old, a one-time exception. Later refreshes follow the seven-day rule.
