"""Lists the files a Claude Code session loads through `@path` imports.

The rules come from code.claude.com/docs/en/memory: an instruction file
imports another file with `@path/to/file`, a relative path is resolved from
the directory of the file that holds the import, an imported file can import
further files, and an `@path` inside a code span or a fenced code block is
left as text. This script applies those rules to the small project in
`imports/`, next to this file, starting from its `AGENTS.md`. It follows
imports to any depth and loads each file once, which is enough for the
example.
"""

import re
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent / "imports"
IMPORT = re.compile(r"(?<![\w`])@([\w./-]*[\w/-])")
CODE_SPAN = re.compile(r"`[^`]*`")


def imports_in(path: Path) -> list:
    """The paths that `path` imports, resolved from its own directory."""
    found = []
    in_fence = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        for name in IMPORT.findall(CODE_SPAN.sub("", line)):
            found.append((path.parent / name).resolve())
    return found


def load(start: Path) -> list:
    """Each loaded file with the file that imported it, in load order."""
    order: list[tuple[Path, Optional[Path]]] = [(start.resolve(), None)]
    seen = {start.resolve()}
    position = 0
    while position < len(order):
        current = order[position][0]
        for target in imports_in(current):
            if target.is_file() and target not in seen:
                seen.add(target)
                order.append((target, current))
        position += 1
    return order


if __name__ == "__main__":
    for path, parent in load(ROOT / "AGENTS.md"):
        name = path.relative_to(ROOT).as_posix()
        if parent is None:
            print(name)
        else:
            print(f"{name}, imported by {parent.relative_to(ROOT).as_posix()}")
