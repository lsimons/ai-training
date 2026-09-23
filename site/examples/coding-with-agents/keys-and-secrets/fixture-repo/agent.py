"""A small program in place of a coding agent, which needs an API key at start.

It never calls a model. It does the one thing this lesson is about: it
finds a key and says where the key came from. The order is the one most
coding agents use: an environment variable that is already set, then a key
helper command from the settings file, then a key written into the settings
file itself. The key is printed masked, so a transcript of this program
never holds the whole key.
"""

import json
import os
import shlex
import subprocess
import sys
from typing import Any, Optional

SETTINGS = os.path.join(".agent", "settings.json")
ENV_VAR = "AGENT_API_KEY"


def load_settings(path: str) -> dict[str, Any]:
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def run_helper(command: str) -> Optional[str]:
    """Return the helper's output, or None when the command fails or prints nothing."""
    try:
        result = subprocess.run(shlex.split(command), capture_output=True, text=True, check=True)
    except (subprocess.CalledProcessError, OSError):
        return None
    return result.stdout.strip() or None


def find_key(settings: dict[str, Any], environ: dict[str, str]) -> tuple[Optional[str], str]:
    """Return the key and a short description of where it came from."""
    if environ.get(ENV_VAR):
        return environ[ENV_VAR], "environment variable " + ENV_VAR
    helper = settings.get("keyHelper")
    if helper:
        key = run_helper(helper)
        if key is None:
            return None, "keyHelper command failed: " + helper
        return key, "keyHelper command: " + helper
    stored = settings.get("env", {}).get(ENV_VAR)
    if stored:
        return stored, SETTINGS + " (env." + ENV_VAR + ")"
    return None, "nowhere"


def mask(key: str) -> str:
    if len(key) < 13:
        return "***"
    return key[:8] + "..." + key[-4:]


def main() -> int:
    settings = load_settings(SETTINGS)
    key, source = find_key(settings, dict(os.environ))
    if key is None:
        if source.startswith("keyHelper command failed"):
            print("no key: " + source)
        else:
            print("no key found: set " + ENV_VAR + " or a keyHelper in " + SETTINGS)
        return 1
    print("key " + mask(key) + " from " + source)
    denied = settings.get("permissions", {}).get("deny", [])
    print("deny rules: " + (", ".join(denied) if denied else "none"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
