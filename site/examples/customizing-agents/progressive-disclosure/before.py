"""Runs `python3 measure.py grown/release` from this directory, for the lesson check.

The lesson shows that command. This wrapper runs it from any working
directory, so `mise run examples` can assert its output.
"""

from pathlib import Path

from measure import report

HERE = Path(__file__).resolve().parent

if __name__ == "__main__":
    print("grown/release")
    print("\n".join(report(HERE / "grown" / "release")))
