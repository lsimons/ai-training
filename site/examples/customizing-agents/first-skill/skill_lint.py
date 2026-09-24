"""Checks a SKILL.md frontmatter against the Agent Skills specification.

The rules are the ones the specification states (agentskills.io/specification,
checked 2026-09-24): `name` is required, at most 64 characters, lowercase
letters, digits and single hyphens, not at the start or the end, and equal to
the directory name; `description` is required and at most 1024 characters.
The two skills it checks are next to this file: the release skill inside
`fixture-package/.claude/skills/release/` and `bad-skill/`, which breaks
three rules.
"""

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAME_MAX = 64
DESCRIPTION_MAX = 1024


def frontmatter(text: str) -> dict[str, str]:
    """The `key: value` pairs between the first two `---` lines."""
    fields: dict[str, str] = {}
    if not text.startswith("---\n"):
        return fields
    rest = text.split("\n", 1)[1]
    if "\n---\n" not in rest:
        raise ValueError("the front matter has no closing --- line")
    for line in rest.split("\n---\n", 1)[0].splitlines():
        key, sep, value = line.partition(":")
        if sep:
            fields[key.strip()] = value.strip()
    return fields


def problems(fields: dict[str, str], directory: str) -> list[str]:
    """Every rule of the specification the frontmatter breaks."""
    found: list[str] = []
    name = fields.get("name", "")
    if not name:
        found.append("name is missing")
    else:
        if len(name) > NAME_MAX:
            found.append(f"name is longer than {NAME_MAX} characters")
        if name != name.lower():
            found.append("name has uppercase letters")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name.lower()):
            found.append("name has a character other than a-z, 0-9 and single hyphens")
        if name != directory:
            found.append(f"name does not match the directory {directory!r}")
    description = fields.get("description", "")
    if not description:
        found.append("description is missing or empty")
    elif len(description) > DESCRIPTION_MAX:
        found.append(f"description is longer than {DESCRIPTION_MAX} characters")
    return found


def report(skill_dir: Path) -> str:
    fields = frontmatter((skill_dir / "SKILL.md").read_text(encoding="utf-8"))
    found = problems(fields, skill_dir.name)
    if not found:
        return f"{skill_dir.name}: ok, description is {len(fields['description'])} characters"
    return "\n".join(f"{skill_dir.name}: {problem}" for problem in found)


if __name__ == "__main__":
    print(report(HERE / "fixture-package" / ".claude" / "skills" / "release"))
    print(report(HERE / "bad-skill"))
