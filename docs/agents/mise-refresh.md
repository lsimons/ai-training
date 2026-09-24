# Refreshing the mise pin

How to move the pinned mise version and checksum in CI. `AGENTS.md` "Supply
chain" states the rule and links here.

CI pins the mise binary itself: `version` and `sha256` on every
`mise-action` step in the workflows. `min_version` in `.mise.toml` is a
floor and requires at least that version locally. Dependabot sees none
of them. To refresh: pick a release at least seven days old, download
its `SHASUMS256.txt` and `SHASUMS256.txt.minisig` and verify the
signature with
`minisign -Vm SHASUMS256.txt -P RWTC3g8W3z4RZK3V3qv7fa1QY4JEWyBtqIHW+85QlJpZc5yG+uNYNBSZ`
(the key in `minisign.pub` in the mise repository), download
`mise-v<version>-linux-x64.tar.gz` and check it against that file,
extract it and hash `mise/bin/mise` with `shasum -a 256`, then update
the workflows and `.mise.toml` in one commit. With `sha256` set the
action checks only that binary and skips its own check of the download
against the signed `SHASUMS256.txt`, so the signature and checksum
steps here replace it. The action fetches the `.tar.zst` archive on
runners that have `zstd`, and the binary is the same in both archives. The
first pin, 2026.9.12 chosen in #262 on 2026-09-24, was the release on
the maintainer's machine and four days old, a one-time exception. Later
refreshes follow the seven-day rule.
