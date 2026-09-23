"""Starts the agent with the key in an environment variable read from the vault.

The settings file no longer holds the key, which is the state after the
lesson's first edit.
"""

import subprocess
import sys

from _common import KEY_VAR, clean_env, in_copy, run, write_settings


def main(repo: str) -> int:
    write_settings(repo, key_helper=None, deny=[])
    env = clean_env()
    vault = subprocess.run(
        [sys.executable, "vault.py"], cwd=repo, capture_output=True, text=True, check=True
    )
    env[KEY_VAR] = vault.stdout.strip()
    return run(repo, "agent.py", env)


if __name__ == "__main__":
    sys.exit(in_copy(main))
