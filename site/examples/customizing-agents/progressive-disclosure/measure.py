"""Estimate what a skill costs at each loading stage.

For the lesson "Loading only what the skill needs".

Run it on a skill directory:   python3 measure.py grown/release

Next to it are two versions of the release skill: `grown/release` has the
rollback steps in SKILL.md, and `split/release` has them in rollback.md.
For each directory it prints three stages, then two totals:

- always loaded: the `name` and `description` lines of the front matter,
  which the agent sees on every turn, whether the skill runs or not
- when the skill runs: the whole SKILL.md file
- when a step reads it: each other Markdown file in the skill directory
- the total when the skill runs, and the total when every file is read

The token counts are estimates, with the same rule as the counter in the
lesson "What the model can see": about four characters per token. A word
of up to six characters is one token, a longer word is one token per four
characters (rounded up), and every punctuation mark is a token of its own.
Every vendor has its own tokenizer, and only that tokenizer gives the exact
count for its models. The rule is the same for both versions of the skill,
so the difference between them is what the lesson reads.
"""

import math
import re
import sys
from pathlib import Path

CHARS_PER_TOKEN = 4
ONE_TOKEN_WORD = 6

# A piece is a run of letters and digits, or a single mark of punctuation.
PIECE = re.compile(r"\w+|[^\w\s]")


def estimate_tokens(text: str) -> int:
    """Return the estimated number of tokens in `text`."""
    total = 0
    for piece in PIECE.findall(text):
        if not piece[0].isalnum() or len(piece) <= ONE_TOKEN_WORD:
            total += 1
        else:
            total += math.ceil(len(piece) / CHARS_PER_TOKEN)
    return total


def metadata(skill_md: str) -> str:
    """Return the `name` and `description` lines of the front matter.

    A line indented under one of the two fields (a folded description) is
    part of it. Any other field is left out.
    """
    lines = skill_md.splitlines()
    if not lines or lines[0] != "---":
        raise ValueError("SKILL.md does not start with a front matter line '---'")
    kept: list[str] = []
    keeping = False
    for line in lines[1:]:
        if line == "---":
            return "\n".join(kept)
        if line.startswith((" ", "\t")):
            if keeping:
                kept.append(line)
            continue
        keeping = line.startswith(("name:", "description:"))
        if keeping:
            kept.append(line)
    raise ValueError("SKILL.md has no closing front matter line '---'")


def report(skill_dir: Path) -> "list[str]":
    """Return the lines that describe one skill directory."""
    skill_md = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
    always = estimate_tokens(metadata(skill_md))
    body = estimate_tokens(skill_md)
    lines = [
        f"  always loaded, name and description: {always}",
        f"  when the skill runs, SKILL.md: {body}",
    ]
    others = sorted(p for p in skill_dir.rglob("*.md") if p.name != "SKILL.md")
    if not others:
        lines.append("  when a step reads it: no other files")
    read_all = always + body
    for path in others:
        name = path.relative_to(skill_dir).as_posix()
        tokens = estimate_tokens(path.read_text(encoding="utf-8"))
        read_all += tokens
        lines.append(f"  when a step reads it, {name}: {tokens}")
    lines.append(f"  total, SKILL.md read: {always + body}")
    lines.append(f"  total, every file read: {read_all}")
    return lines


def main(argv: "list[str]") -> None:
    if len(argv) != 2:
        print("usage: python3 measure.py <skill directory>")
        sys.exit(2)
    print(argv[1])
    print("\n".join(report(Path(argv[1]))))


if __name__ == "__main__":
    main(sys.argv)
