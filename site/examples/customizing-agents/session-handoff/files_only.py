"""Runs `python3 check_handoff.py samples/files-only.md` from this directory, for the lesson check.

The lesson shows that command. This wrapper runs it from any working
directory, so `mise run examples` can assert its output.
"""

from pathlib import Path

from check_handoff import report

HERE = Path(__file__).resolve().parent

if __name__ == "__main__":
    text = (HERE / "samples" / "files-only.md").read_text(encoding="utf-8")
    print("\n".join(report("samples/files-only.md", text)))
