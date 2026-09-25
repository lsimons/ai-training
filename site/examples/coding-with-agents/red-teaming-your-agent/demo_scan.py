"""Shows the hidden-text gate on the scratch copy, and on a file with invisible characters.

It runs what `python3 scan_hidden.py ~/red-team/project` does on a fresh
scratch folder, where it finds the planted note. Then it adds a line with a
zero-width space, a character that shows as nothing, and runs the scan again.
"""

import os
import sys
import tempfile

from _common import make_scratch, scan_hidden


def show_scan(project: str) -> None:
    print("$ python3 scan_hidden.py ~/red-team/project")
    hits = scan_hidden(project)
    for hit in hits:
        print(hit)
    print(f"{len(hits)} hidden-text finding(s)")
    print(f"exit status {1 if hits else 0}")


def main() -> int:
    with tempfile.TemporaryDirectory() as tmpdir:
        dest = os.path.join(tmpdir, "red-team")
        make_scratch(dest)
        project = os.path.join(dest, "project")
        show_scan(project)
        with open(os.path.join(project, "docs", "changelog.md"), "w", encoding="utf-8") as handle:
            handle.write("# Changes\n\n- Totals now round to the cent.\u200b\n")
        print("# add docs/changelog.md, with a zero-width space at the end of line 3")
        show_scan(project)
    return 0


if __name__ == "__main__":
    sys.exit(main())
