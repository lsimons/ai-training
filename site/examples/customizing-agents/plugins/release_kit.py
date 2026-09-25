"""Runs `python3 inventory.py release-kit` from this directory, for the lesson check.

The lesson shows that command. This wrapper runs it from any working
directory, so `mise run examples` can assert its output.
"""

from pathlib import Path

from inventory import report

HERE = Path(__file__).resolve().parent

if __name__ == "__main__":
    print("\n".join(report(HERE / "release-kit")))
