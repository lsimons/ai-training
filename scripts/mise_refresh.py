#!/usr/bin/env python3
"""Verify a mise release and print the values CI pins (`mise run mise-refresh`).

docs/agents/mise-refresh.md is the procedure, and this script does its
download, verify and hash steps (issue #331). For one release version it:

1. downloads `SHASUMS256.txt`, `SHASUMS256.txt.minisig` and
   `mise-v<version>-linux-x64.tar.gz` from the GitHub release into a
   temporary directory, which is removed on exit,
2. verifies the signature on `SHASUMS256.txt` with `minisign` and the
   public key in the `minisign -Vm` command of the procedure doc, so the
   key is written down in one place,
3. checks the archive against its line in `SHASUMS256.txt`,
4. reads `mise/bin/mise` out of the archive and prints its `sha256`, and
5. prints the release date from the GitHub releases API, with its age in
   days.

It edits no file. A bad signature, a missing or doubled line in
`SHASUMS256.txt`, a hash mismatch or an archive without `mise/bin/mise`
stops it with exit code 1 and a message naming the step. The maintainer
still checks the seven-day rule and updates the workflows and
`.mise.toml` in one commit.
"""

import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tarfile
import tempfile
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from typing import cast

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
PROCEDURE_DOC = REPO_ROOT / "docs" / "agents" / "mise-refresh.md"

RELEASE_BASE = "https://github.com/jdx/mise/releases/download"
RELEASE_API = "https://api.github.com/repos/jdx/mise/releases/tags"
BINARY_MEMBER = "mise/bin/mise"

# A minisign public key is "RW" plus 54 more base64 characters (42 bytes:
# the algorithm, the key id and the Ed25519 key). The doc may wrap the
# command over two lines, so any run of whitespace separates the words.
KEY_PATTERN = re.compile(r"minisign\s+-Vm\s+SHASUMS256\.txt\s+-P\s+(RW[A-Za-z0-9+/]{54})")
VERSION_PATTERN = re.compile(r"\d{4}\.\d{1,2}\.\d+")

MINISIGN_HINT = (
    "Run `mise install` (minisign is pinned in .mise.toml). On a platform that the `os` list"
    " of minisign in .mise.toml leaves out, install minisign 0.12 from"
    " https://github.com/jedisct1/minisign/releases yourself."
)

# Fetches a URL and returns its body.
Fetch = Callable[[str], bytes]


class RefreshError(Exception):
    """A step failed. The message names the step and what was wrong."""


@dataclass(frozen=True)
class Refresh:
    """What the maintainer copies into the workflows and `.mise.toml`."""

    version: str
    archive: str
    archive_sha256: str
    binary_sha256: str
    published_at: datetime.datetime


def read_public_key(doc_text: str) -> str:
    """The key in the `minisign -Vm SHASUMS256.txt -P <key>` command of the doc."""
    keys = set(KEY_PATTERN.findall(doc_text))
    if len(keys) != 1:
        msg = f"expected one minisign key in {PROCEDURE_DOC.name}, found {len(keys)}"
        raise RefreshError(msg)
    return keys.pop()


def check_version(version: str) -> str:
    """The version as the release tags write it, without a leading `v`."""
    if not VERSION_PATTERN.fullmatch(version):
        msg = f"version {version!r} is not of the form YYYY.M.N, for example 2026.9.12"
        raise RefreshError(msg)
    return version


def archive_name(version: str) -> str:
    return f"mise-v{version}-linux-x64.tar.gz"


def expected_sha256(shasums_text: str, filename: str) -> str:
    """The hash on the one `SHASUMS256.txt` line for `filename`.

    Lines are `<hex>  ./<name>` (the `sha256sum` format, with a `./` in the
    mise releases). A missing line and a doubled one are both errors.
    """
    hashes: list[str] = []
    for line in shasums_text.splitlines():
        parts = line.split()
        if len(parts) != 2:
            continue
        digest, name = parts
        if name.removeprefix("*").removeprefix("./") == filename:
            hashes.append(digest.lower())
    if len(hashes) != 1:
        msg = f"expected one line for {filename} in SHASUMS256.txt, found {len(hashes)}"
        raise RefreshError(msg)
    return hashes[0]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_signature(
    shasums: pathlib.Path, signature: pathlib.Path, key: str, minisign: str = "minisign"
) -> None:
    """Run `minisign -V` and raise with its output when it rejects the file."""
    try:
        result = subprocess.run(
            [minisign, "-V", "-m", str(shasums), "-x", str(signature), "-P", key],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as error:
        msg = f"{minisign} is not on PATH. {MINISIGN_HINT}"
        raise RefreshError(msg) from error
    if result.returncode != 0:
        output = (result.stderr or result.stdout).strip()
        msg = f"the signature on SHASUMS256.txt does not verify: {output}"
        raise RefreshError(msg)


def binary_sha256(archive: pathlib.Path) -> str:
    """The hash of `mise/bin/mise` in the archive, read without writing it out."""
    try:
        with tarfile.open(archive, "r:gz") as tar:
            member = tar.getmember(BINARY_MEMBER)
            if not member.isfile():
                msg = f"{BINARY_MEMBER} in {archive.name} is not a regular file"
                raise RefreshError(msg)
            stream = tar.extractfile(member)
            if stream is None:  # pragma: no cover -- isfile() above rules this out
                msg = f"cannot read {BINARY_MEMBER} from {archive.name}"
                raise RefreshError(msg)
            return sha256_bytes(stream.read())
    except KeyError as error:
        msg = f"{archive.name} has no {BINARY_MEMBER}"
        raise RefreshError(msg) from error
    except tarfile.TarError as error:
        msg = f"{archive.name} is not a readable .tar.gz: {error}"
        raise RefreshError(msg) from error


def parse_published_at(release_json: bytes) -> datetime.datetime:
    try:
        data: object = json.loads(release_json)
    except ValueError as error:
        msg = f"the GitHub releases API did not return JSON: {error}"
        raise RefreshError(msg) from error
    published: object = None
    if isinstance(data, dict):
        published = cast("dict[str, object]", data).get("published_at")
    if not isinstance(published, str):
        msg = "the GitHub release has no published_at date"
        raise RefreshError(msg)
    return datetime.datetime.fromisoformat(published)


def refresh(
    version: str, workdir: pathlib.Path, fetch: Fetch, key: str, minisign: str = "minisign"
) -> Refresh:
    """Download, verify and hash one release into `workdir`."""
    version = check_version(version)
    archive = archive_name(version)
    base = f"{RELEASE_BASE}/v{version}"
    paths: dict[str, pathlib.Path] = {}
    for name in ("SHASUMS256.txt", "SHASUMS256.txt.minisig", archive):
        path = workdir / name
        path.write_bytes(fetch(f"{base}/{name}"))
        paths[name] = path

    verify_signature(paths["SHASUMS256.txt"], paths["SHASUMS256.txt.minisig"], key, minisign)

    expected = expected_sha256(paths["SHASUMS256.txt"].read_text(), archive)
    actual = sha256_bytes(paths[archive].read_bytes())
    if actual != expected:
        msg = f"{archive} has sha256 {actual}, but the signed SHASUMS256.txt says {expected}"
        raise RefreshError(msg)

    return Refresh(
        version=version,
        archive=archive,
        archive_sha256=actual,
        binary_sha256=binary_sha256(paths[archive]),
        published_at=parse_published_at(fetch(f"{RELEASE_API}/v{version}")),
    )


def report(result: Refresh, today: datetime.date) -> str:
    age = (today - result.published_at.date()).days
    return "\n".join(
        [
            f"mise-refresh: v{result.version} verified",
            "  signature: SHASUMS256.txt verifies with the key in docs/agents/mise-refresh.md",
            f"  archive:   {result.archive} sha256 {result.archive_sha256} matches SHASUMS256.txt",
            f"  released:  {result.published_at.date().isoformat()} ({age} days ago, and the"
            " procedure needs at least 7)",
            f"  version:   {result.version}",
            f"  sha256:    {result.binary_sha256}  ({BINARY_MEMBER})",
        ]
    )


def http_fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "ai-training mise-refresh"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body: bytes = response.read()
            return body
    except urllib.error.URLError as error:
        msg = f"download of {url} failed: {error}"
        # Unauthenticated calls to the GitHub REST API are limited per hour,
        # and past the limit it answers 403 or 429 ("Rate limits for the
        # REST API", https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
        if isinstance(error, urllib.error.HTTPError) and error.code in {403, 429}:
            msg += ". The GitHub API may be rate limiting this address, so try again later."
        raise RefreshError(msg) from error


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print("usage: mise run mise-refresh <version>", file=sys.stderr)
        return 2
    try:
        key = read_public_key(PROCEDURE_DOC.read_text())
        with tempfile.TemporaryDirectory(prefix="mise-refresh-") as workdir:
            result = refresh(argv[0], pathlib.Path(workdir), http_fetch, key)
    except RefreshError as error:
        print(f"mise-refresh: FAILED: {error}", file=sys.stderr)
        return 1
    print(report(result, datetime.datetime.now(datetime.UTC).date()))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
