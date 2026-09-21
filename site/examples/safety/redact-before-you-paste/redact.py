"""Print a document with the values in a redaction map replaced.

No arguments:   python3 redact.py
    Redacts the lesson's built-in email with its built-in map.

Two arguments:  python3 redact.py document.txt map.txt
    Redacts your own document with your own map, one `value => placeholder`
    per line. The map stays on your disk. Only the printed text goes into
    the tool.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import redaction  # noqa: E402  (imported after sys.path knows this directory)


def main(argv: "list[str]") -> None:
    if len(argv) == 3:
        with open(argv[1], encoding="utf-8") as handle:
            text = handle.read()
        replacements = redaction.read_map(argv[2])
    elif len(argv) == 1:
        text = redaction.EMAIL
        replacements = redaction.MAP
    else:
        raise SystemExit("usage: python3 redact.py [document.txt map.txt]")
    print(redaction.redact(text, replacements), end="")


if __name__ == "__main__":
    main(sys.argv)
