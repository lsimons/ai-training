"""Starts the fixture agent as the fixture ships: the key is in its settings file."""

import sys

from _common import clean_env, in_copy, run

if __name__ == "__main__":
    sys.exit(in_copy(lambda repo: run(repo, "agent.py", clean_env())))
