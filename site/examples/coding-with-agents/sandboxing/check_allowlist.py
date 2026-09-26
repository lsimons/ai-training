"""Predicts what Claude Code's sandbox does with each command's network call.

It reads the `sandbox.network` part of sandbox-settings.json and the
commands in commands.txt, finds the host each command connects to, and
prints whether the sandbox's network allowlist lets that host through. It
makes no network call and runs no command.

The matching rules are the ones Claude Code's documentation states
(https://code.claude.com/docs/en/settings-reference, `sandbox.network`):

- An entry such as `*.example.com` matches subdomains. The documentation
  doesn't say whether it also matches `example.com` itself, so this script
  matches subdomains only, and no command in commands.txt depends on it.
- An entry with a `:port` suffix matches that port only. An entry without
  one matches every port.
- A host in `deniedDomains` is blocked even when `allowedDomains` matches it.
- A host outside the allowlist is blocked without a prompt when
  `strictAllowlist` is true. When it is false, Claude Code asks you in
  Manual mode.

Run it from anywhere: it finds its files next to itself.
"""

import json
import os
import re
import sys
from typing import Optional
from urllib.parse import urlsplit

HERE = os.path.dirname(os.path.abspath(__file__))
URL = re.compile(r"https?://[^\s\"']+", re.IGNORECASE)
DEFAULT_PORTS = {"http": 80, "https": 443}


def split_entry(entry: str) -> tuple[str, Optional[int]]:
    """Split a domain entry into its host pattern and optional port."""
    host, sep, port = entry.rpartition(":")
    if sep and port.isdigit():
        return host.lower(), int(port)
    return entry.lower(), None


def matches(entry: str, host: str, port: int) -> bool:
    """True when one allowedDomains or deniedDomains entry covers host:port."""
    pattern, entry_port = split_entry(entry)
    if entry_port is not None and entry_port != port:
        return False
    if pattern.startswith("*."):
        return host.endswith(pattern[1:])
    return host == pattern


def first_match(entries: list[str], host: str, port: int) -> Optional[str]:
    for entry in entries:
        if matches(entry, host, port):
            return entry
    return None


def decide(network: dict, host: str, port: int) -> str:
    denied = first_match(network.get("deniedDomains", []), host, port)
    if denied is not None:
        return f"blocked (deniedDomains has {denied})"
    allowed = first_match(network.get("allowedDomains", []), host, port)
    if allowed is not None:
        return f"allowed (matches {allowed})"
    if network.get("strictAllowlist", False):
        return "blocked, no prompt (not on the list)"
    return "asks you (not on the list)"


def target(command: str) -> tuple[str, int]:
    """The host and port of the first URL in a command.

    A host written with a trailing dot, such as `pypi.org.`, is the same host
    as `pypi.org`, so one trailing dot is removed.
    """
    found = URL.search(command)
    if found is None:
        raise ValueError(f"no URL in command: {command}")
    parts = urlsplit(found.group(0))
    host = (parts.hostname or "").lower()
    if host.endswith("."):
        host = host[:-1]
    port = parts.port or DEFAULT_PORTS[parts.scheme]
    return host, port


def main() -> int:
    with open(os.path.join(HERE, "sandbox-settings.json"), encoding="utf-8") as f:
        network = json.load(f)["sandbox"].get("network", {})
    with open(os.path.join(HERE, "commands.txt"), encoding="utf-8") as f:
        commands = [line.strip() for line in f if line.strip()]

    allowed = ", ".join(network.get("allowedDomains", [])) or "(none)"
    denied = ", ".join(network.get("deniedDomains", [])) or "(none)"
    strict = "true" if network.get("strictAllowlist", False) else "false"
    print(f"allowedDomains: {allowed}")
    print(f"deniedDomains: {denied}")
    print(f"strictAllowlist: {strict}")
    for number, command in enumerate(commands, start=1):
        host, port = target(command)
        print(f"{number}. {host}:{port}  {decide(network, host, port)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
