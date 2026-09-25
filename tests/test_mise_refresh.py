"""Tests for scripts/mise_refresh.py, on a local fake release signed with a test key.

The signature tests run the pinned `minisign` from .mise.toml: they make a
key pair without a password, sign a SHASUMS256.txt, and then change a byte
of the file or the archive to see the refresh fail. Without minisign on
PATH they fail, and do not skip, with a message that says how to install it.
"""

import datetime
import hashlib
import io
import json
import pathlib
import shutil
import subprocess
import tarfile
import tempfile
import urllib.error
import urllib.request
from email.message import Message

import pytest

import mise_refresh

VERSION = "2026.9.12"
ARCHIVE = f"mise-v{VERSION}-linux-x64.tar.gz"
BASE = f"{mise_refresh.RELEASE_BASE}/v{VERSION}"
BINARY = b"#!/bin/sh\necho fake mise\n"
PUBLISHED = "2026-09-20T12:00:00Z"

# Looked up once. Signer fails with mise_refresh.MINISIGN_HINT when it is None.
MINISIGN = shutil.which("minisign")


def make_archive(members: dict[str, bytes | None]) -> bytes:
    """A .tar.gz with each name as a file, or as a directory when the value is None."""
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for name, data in members.items():
            info = tarfile.TarInfo(name)
            if data is None:
                info.type = tarfile.DIRTYPE
                tar.addfile(info)
            else:
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


def shasums_for(archive: bytes) -> str:
    digest = hashlib.sha256(archive).hexdigest()
    return f"{'0' * 64}  ./mise-v{VERSION}-linux-x64-musl.tar.gz\n{digest}  ./{ARCHIVE}\n"


class Signer:
    """A minisign key pair without a password, in a pytest tmp dir."""

    def __init__(self, directory: pathlib.Path) -> None:
        if MINISIGN is None:
            pytest.fail(f"minisign is not on PATH. {mise_refresh.MINISIGN_HINT}", pytrace=False)
        self.minisign = MINISIGN
        self.public = directory / "test.pub"
        self.secret = directory / "test.key"
        subprocess.run(
            [self.minisign, "-G", "-W", "-p", str(self.public), "-s", str(self.secret)],
            check=True,
            capture_output=True,
        )
        self.key = self.public.read_text().splitlines()[1]

    def sign(self, data: bytes, directory: pathlib.Path) -> bytes:
        message = directory / "to-sign.txt"
        message.write_bytes(data)
        subprocess.run(
            [self.minisign, "-S", "-s", str(self.secret), "-m", str(message)],
            check=True,
            capture_output=True,
        )
        return (directory / "to-sign.txt.minisig").read_bytes()


@pytest.fixture
def signer(tmp_path: pathlib.Path) -> Signer:
    keys = tmp_path / "keys"
    keys.mkdir()
    return Signer(keys)


def release(
    signer: Signer, tmp_path: pathlib.Path, archive: bytes | None = None
) -> dict[str, bytes]:
    """The URLs of a good fake release and what each returns."""
    archive = make_archive({"mise/": None, "mise/bin/mise": BINARY}) if archive is None else archive
    shasums = shasums_for(archive).encode()
    return {
        f"{BASE}/SHASUMS256.txt": shasums,
        f"{BASE}/SHASUMS256.txt.minisig": signer.sign(shasums, tmp_path),
        f"{BASE}/{ARCHIVE}": archive,
        f"{mise_refresh.RELEASE_API}/v{VERSION}": json.dumps({"published_at": PUBLISHED}).encode(),
    }


def run_refresh(files: dict[str, bytes], tmp_path: pathlib.Path, key: str) -> mise_refresh.Refresh:
    workdir = tmp_path / "work"
    workdir.mkdir()
    return mise_refresh.refresh(VERSION, workdir, files.__getitem__, key)


def test_read_public_key_finds_the_key_in_the_procedure_doc() -> None:
    # The mise key starts with its id bytes. The full key is not repeated
    # here: gitleaks takes a 56-character base64 literal for a secret.
    text = mise_refresh.PROCEDURE_DOC.read_text()
    key = mise_refresh.read_public_key(text)
    assert key.startswith("RWTC3g8W")
    assert len(key) == 56
    assert f"-P {key}" in text


def test_read_public_key_reads_a_command_wrapped_over_two_lines() -> None:
    key = "RW" + "A" * 54
    assert mise_refresh.read_public_key(f"`minisign -Vm SHASUMS256.txt\n-P {key}`") == key


@pytest.mark.parametrize(
    "text",
    [
        "no command here",
        f"minisign -Vm SHASUMS256.txt -P RW{'A' * 54}\nminisign -Vm SHASUMS256.txt -P RW{'B' * 54}",
    ],
)
def test_read_public_key_rejects_zero_or_two_keys(text: str) -> None:
    with pytest.raises(mise_refresh.RefreshError, match="expected one minisign key"):
        mise_refresh.read_public_key(text)


@pytest.mark.parametrize("version", ["v2026.9.12", "2026.9", "latest", "2026.9.12; rm -rf /"])
def test_check_version_rejects_anything_but_a_release_number(version: str) -> None:
    with pytest.raises(mise_refresh.RefreshError, match="not of the form"):
        mise_refresh.check_version(version)


def test_expected_sha256_takes_the_line_for_the_file() -> None:
    text = f"{'a' * 64}  ./other.tar.gz\n\n{'B' * 64} *./{ARCHIVE}\n"
    assert mise_refresh.expected_sha256(text, ARCHIVE) == "b" * 64


@pytest.mark.parametrize("count", [0, 2])
def test_expected_sha256_rejects_a_missing_or_doubled_line(count: int) -> None:
    text = f"{'a' * 64}  ./{ARCHIVE}\n" * count
    with pytest.raises(mise_refresh.RefreshError, match=f"found {count}"):
        mise_refresh.expected_sha256(text, ARCHIVE)


def test_refresh_prints_the_hash_of_the_binary(signer: Signer, tmp_path: pathlib.Path) -> None:
    files = release(signer, tmp_path)
    result = run_refresh(files, tmp_path, signer.key)
    assert result.binary_sha256 == hashlib.sha256(BINARY).hexdigest()
    assert result.archive_sha256 == hashlib.sha256(files[f"{BASE}/{ARCHIVE}"]).hexdigest()
    text = mise_refresh.report(result, datetime.date(2026, 9, 25))
    assert f"sha256:    {result.binary_sha256}  (mise/bin/mise)" in text
    assert "released:  2026-09-20 (5 days ago" in text


def test_refresh_fails_on_a_tampered_shasums_file(signer: Signer, tmp_path: pathlib.Path) -> None:
    files = release(signer, tmp_path)
    shasums = files[f"{BASE}/SHASUMS256.txt"]
    files[f"{BASE}/SHASUMS256.txt"] = shasums.replace(b"0000", b"1111", 1)
    with pytest.raises(
        mise_refresh.RefreshError, match=r"signature on SHASUMS256\.txt does not verify"
    ):
        run_refresh(files, tmp_path, signer.key)


def test_refresh_fails_on_a_signature_by_another_key(
    signer: Signer, tmp_path: pathlib.Path
) -> None:
    files = release(signer, tmp_path)
    other = tmp_path / "other"
    other.mkdir()
    with pytest.raises(mise_refresh.RefreshError, match="does not verify"):
        run_refresh(files, tmp_path, Signer(other).key)


def test_refresh_fails_on_a_tampered_archive(signer: Signer, tmp_path: pathlib.Path) -> None:
    files = release(signer, tmp_path)
    archive = files[f"{BASE}/{ARCHIVE}"]
    files[f"{BASE}/{ARCHIVE}"] = archive[:-1] + bytes([archive[-1] ^ 1])
    with pytest.raises(mise_refresh.RefreshError, match=r"but the signed SHASUMS256\.txt says"):
        run_refresh(files, tmp_path, signer.key)


@pytest.mark.parametrize(
    ("archive", "message"),
    [
        (make_archive({"mise/bin/other": BINARY}), "has no mise/bin/mise"),
        (make_archive({"mise/bin/mise": None}), "is not a regular file"),
        (b"not a tar file", r"is not a readable \.tar\.gz"),
    ],
    ids=["no-binary", "binary-is-a-directory", "not-a-tar"],
)
def test_refresh_fails_on_an_archive_without_the_binary(
    signer: Signer, tmp_path: pathlib.Path, archive: bytes, message: str
) -> None:
    files = release(signer, tmp_path, archive)
    with pytest.raises(mise_refresh.RefreshError, match=message):
        run_refresh(files, tmp_path, signer.key)


def test_refresh_fails_on_a_release_without_a_date(signer: Signer, tmp_path: pathlib.Path) -> None:
    files = release(signer, tmp_path)
    files[f"{mise_refresh.RELEASE_API}/v{VERSION}"] = b"{}"
    with pytest.raises(mise_refresh.RefreshError, match="no published_at"):
        run_refresh(files, tmp_path, signer.key)


def test_verify_signature_names_a_missing_minisign(tmp_path: pathlib.Path) -> None:
    with pytest.raises(mise_refresh.RefreshError, match="not on PATH"):
        mise_refresh.verify_signature(
            tmp_path / "a", tmp_path / "b", "RW" + "A" * 54, minisign="no-such-minisign"
        )


def fake_urlopen(code: int) -> object:
    def urlopen(request: urllib.request.Request, timeout: float) -> object:
        raise urllib.error.HTTPError(request.full_url, code, "Forbidden", Message(), None)

    return urlopen


@pytest.mark.parametrize("code", [403, 429])
def test_http_fetch_hints_at_a_rate_limit(monkeypatch: pytest.MonkeyPatch, code: int) -> None:
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen(code))
    with pytest.raises(mise_refresh.RefreshError, match="rate limiting this address, so try again"):
        mise_refresh.http_fetch(f"{mise_refresh.RELEASE_API}/v{VERSION}")


def test_http_fetch_gives_no_rate_limit_hint_on_a_404(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen(404))
    with pytest.raises(mise_refresh.RefreshError, match="HTTP Error 404") as caught:
        mise_refresh.http_fetch(f"{BASE}/SHASUMS256.txt")
    assert "rate limit" not in str(caught.value)


def test_parse_published_at_rejects_a_body_that_is_not_json() -> None:
    with pytest.raises(mise_refresh.RefreshError, match="did not return JSON"):
        mise_refresh.parse_published_at(b"<html>rate limited</html>")


@pytest.fixture
def main_env(
    signer: Signer, tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch
) -> tuple[dict[str, bytes], pathlib.Path]:
    """main() with the fake release, a doc naming the test key, and a watched temp root."""
    files = release(signer, tmp_path)
    doc = tmp_path / "mise-refresh.md"
    doc.write_text(f"`minisign -Vm SHASUMS256.txt -P {signer.key}`\n")
    temp_root = tmp_path / "temp-root"
    temp_root.mkdir()
    monkeypatch.setattr(mise_refresh, "PROCEDURE_DOC", doc)
    monkeypatch.setattr(mise_refresh, "http_fetch", files.__getitem__)
    monkeypatch.setattr(tempfile, "tempdir", str(temp_root))
    return files, temp_root


def test_main_prints_usage_and_exits_2_without_a_version(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert mise_refresh.main([]) == 2
    assert "usage: mise run mise-refresh <version>" in capsys.readouterr().err


def test_main_prints_the_report_and_removes_its_temp_dir(
    main_env: tuple[dict[str, bytes], pathlib.Path], capsys: pytest.CaptureFixture[str]
) -> None:
    _, temp_root = main_env
    assert mise_refresh.main([VERSION]) == 0
    out = capsys.readouterr().out
    assert f"sha256:    {hashlib.sha256(BINARY).hexdigest()}  (mise/bin/mise)" in out
    assert list(temp_root.iterdir()) == []


def test_main_prints_failed_and_exits_1_and_removes_its_temp_dir(
    main_env: tuple[dict[str, bytes], pathlib.Path], capsys: pytest.CaptureFixture[str]
) -> None:
    files, temp_root = main_env
    archive = files[f"{BASE}/{ARCHIVE}"]
    files[f"{BASE}/{ARCHIVE}"] = archive[:-1] + bytes([archive[-1] ^ 1])
    assert mise_refresh.main([VERSION]) == 1
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err.startswith("mise-refresh: FAILED: ")
    assert "but the signed SHASUMS256.txt says" in captured.err
    assert list(temp_root.iterdir()) == []


def test_http_fetch_returns_the_body(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: list[str] = []

    def urlopen(request: urllib.request.Request, timeout: float) -> io.BytesIO:
        seen.append(request.full_url)
        return io.BytesIO(b"body")

    monkeypatch.setattr(urllib.request, "urlopen", urlopen)
    assert mise_refresh.http_fetch(f"{BASE}/SHASUMS256.txt") == b"body"
    assert seen == [f"{BASE}/SHASUMS256.txt"]
