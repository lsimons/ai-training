"""Starts the agent with a key helper and deny rules in its settings, and no key anywhere else."""

import sys

from _common import DENY, HELPER, clean_env, in_copy, run, write_settings


def main(repo: str) -> int:
    write_settings(repo, key_helper=HELPER, deny=DENY)
    return run(repo, "agent.py", clean_env())


if __name__ == "__main__":
    sys.exit(in_copy(main))
