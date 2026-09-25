"""Shows which auto-memory text a new Claude Code session starts with.

Claude Code loads the first 200 lines or the first 25KB of `MEMORY.md`,
whichever comes first, at the start of every session. The topic files the
index points to are not loaded then, and the agent reads them later when it
needs them (code.claude.com/docs/en/memory). This script applies that rule
to the planted notes in `notes/`, next to this file, or to the directory
given as the first argument.
"""

import sys
from pathlib import Path

MAX_LINES = 200
# The vendor says 25KB. This script assumes 1KB is 1024 bytes.
MAX_BYTES = 25 * 1024


def note_type(path: Path) -> str:
    """The `type` field from a note's frontmatter, or `?` when it has none."""
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("type:"):
            return line.split(":", 1)[1].strip()
    return "?"


def loaded_index(index: Path) -> list:
    """The lines of `MEMORY.md` that fit inside both limits."""
    kept = []
    size = 0
    for line in index.read_text(encoding="utf-8").splitlines(keepends=True):
        size += len(line.encode("utf-8"))
        if len(kept) == MAX_LINES or size > MAX_BYTES:
            break
        kept.append(line)
    return kept


if __name__ == "__main__":
    here = Path(__file__).resolve().parent
    notes = Path(sys.argv[1]) if len(sys.argv) > 1 else here / "notes"
    index = notes / "MEMORY.md"
    if not index.is_file():
        print(f"no MEMORY.md in {notes}, so a session loads no auto memory from it")
        sys.exit(0)
    total = len(index.read_text(encoding="utf-8").splitlines())
    print(f"loaded at start: MEMORY.md, {len(loaded_index(index))} of {total} lines")
    for topic in sorted(notes.glob("*.md")):
        if topic.name != "MEMORY.md":
            print(f"read when needed: {topic.name} ({note_type(topic)})")
