"""The lesson's replacement for a password manager's command-line tool.

A real one (`op read`, `bw get`, `pass show`) asks you to unlock the vault
and prints one secret. This one prints the same fake key every time, so the
lesson works without a password manager installed. It assembles the key
from parts so that `scan.py` doesn't report this file: a real vault keeps
the secret encrypted, and the report should stay about the files you can
do something about.
"""

PARTS = ["sk-fake-lesson-key", "0000", "0000", "0000", "c0de"]

if __name__ == "__main__":
    print("-".join(PARTS))
