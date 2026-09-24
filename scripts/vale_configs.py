#!/usr/bin/env python3
"""Check that .vale.ini and .vale-extended.ini share their common settings.

The extended config is a superset of the base one: the same top-level
settings and, per section, the same `BasedOnStyles`, `Vale.Spelling`,
`TokenIgnores` and rule levels, plus the advisory rules too noisy for every
run. Vale never reads both, so a `TokenIgnores` line that moves in one file
only shows up as a run of odd findings in `mise run prose-extended` (issue
#277). This script fails on the drift instead, naming the file, section and
key.

Rules, per section (the top-level settings count as the section ""):

- Every key in .vale.ini must be in .vale-extended.ini with the same value.
- Every key only in .vale-extended.ini must be in EXTENDED_ONLY, which
  lists the rules the extended run adds on purpose, with the reason.

The parser is the small subset of Vale's ini this repository uses: `#` and
`;` comment lines, `[section]` headers taken verbatim (Vale's globs such
as `[*.{md,mdx}]` are just names here), `key = value` pairs, and a value
continued over lines that end in a backslash. A key repeated in one section
keeps its last value, as Vale does. Values are compared after trimming
the whitespace around each line of a continuation.

Usage: scripts/vale_configs.py [base-ini] [extended-ini]
"""

import pathlib
import sys

BASE_INI = pathlib.Path(".vale.ini")
EXTENDED_INI = pathlib.Path(".vale-extended.ini")

# The whole file as {section: {key: value}}. The settings before the first
# header are under the section "".
Config = dict[str, dict[str, str]]

# Keys that are in .vale-extended.ini on purpose and not in .vale.ini, per
# section, each with the reason it runs only in the advisory pass. The
# comments in .vale-extended.ini next to each rule say the same in more
# words. Adding a rule to the extended file means adding it here too, so
# the difference stays a decision rather than drift.
EXTENDED_ONLY: dict[str, dict[str, str]] = {
    "[*.{md,mdx}]": {
        "write-good.Passive": "passive voice is a judgement call; most hits are idiom",
        "write-good.So": "sentence-initial So is a device the lessons use on purpose",
        "proselint.But": "paragraph-initial But is a device the lessons use, like So",
        "proselint.Needless": "352 swap pairs with zero hits so far; untested here",
        "Google.ExcessiveClaims": "fires on a word that is usually fine (best)",
        "Google.FirstPerson": "the lesson opener and the tutor commands use I on purpose",
        "Google.Ordinal": "fires on a word that is usually fine (2nd)",
        "Google.Ranges": "fires on a phrase that is usually fine (from 1-5)",
        "Google.Units": "fires on a word that is usually fine (2h)",
        "Google.We": "the lesson opener and the tutor commands use we on purpose",
    },
    "[site/src/content/docs/**/*.{md,mdx}]": {
        "Google.Semicolons": "every semicolon in a lesson, for the sweep over long sentences",
    },
}


def parse_ini(text: str) -> Config:
    """Parse Vale's ini subset described in the module docstring."""
    config: Config = {"": {}}
    section = ""
    key: str | None = None
    for raw in text.splitlines():
        line = raw.strip()
        if key is not None:
            # A continued value: append this line, and keep going while
            # the line still ends in a backslash.
            continued = line.endswith("\\")
            part = line[:-1].strip() if continued else line
            config[section][key] = f"{config[section][key]} {part}".strip()
            if not continued:
                key = None
            continue
        if not line or line[0] in "#;":
            continue
        if line.startswith("[") and line.endswith("]"):
            section = line
            config.setdefault(section, {})
            continue
        name, sep, value = line.partition("=")
        if not sep:
            msg = f"line is not a comment, a section header or a key = value pair: {raw!r}"
            raise ValueError(msg)
        name = name.strip()
        value = value.strip()
        if value.endswith("\\"):
            key = name
            value = value[:-1].strip()
        config[section][name] = value
    return config


def _where(file: str, section: str) -> str:
    return f"{file}: {section or 'the top-level settings'}"


def compare(
    base: Config,
    extended: Config,
    base_name: str,
    extended_name: str,
    extended_only: dict[str, dict[str, str]] = EXTENDED_ONLY,
) -> list[str]:
    """Return one message per drift between the two parsed configs, or [] when they agree."""
    problems: list[str] = []
    for section, base_keys in base.items():
        extended_keys = extended.get(section)
        if extended_keys is None:
            problems.append(
                f"{extended_name}: section {section} is in {base_name} but missing here"
            )
            continue
        for key, value in base_keys.items():
            if key not in extended_keys:
                problems.append(
                    f"{_where(extended_name, section)}: key {key} is in {base_name} "
                    f"but missing here"
                )
            elif extended_keys[key] != value:
                problems.append(
                    f"{_where(extended_name, section)}: key {key} is {extended_keys[key]!r} here "
                    f"and {value!r} in {base_name}"
                )
    for section, extended_keys in extended.items():
        base_keys = base.get(section)
        if base_keys is None:
            problems.append(
                f"{base_name}: section {section} is in {extended_name} but missing here"
            )
            continue
        allowed = extended_only.get(section, {})
        for key in extended_keys:
            if key in base_keys:
                continue
            if key not in allowed:
                problems.append(
                    f"{_where(base_name, section)}: key {key} is in {extended_name} "
                    f"but missing here, "
                    f"and EXTENDED_ONLY in scripts/vale_configs.py does not list it"
                )
        for key in allowed:
            if key not in extended_keys:
                problems.append(
                    f"{_where(extended_name, section)}: EXTENDED_ONLY lists {key} "
                    f"as extended-only but the file does not set it"
                )
            elif key in base_keys:
                problems.append(
                    f"{_where(base_name, section)}: EXTENDED_ONLY lists {key} "
                    f"as extended-only but the file sets it too"
                )
    return problems


def check(base_path: pathlib.Path, extended_path: pathlib.Path) -> list[str]:
    """Read both files and return the drift messages."""
    base = parse_ini(base_path.read_text(encoding="utf-8"))
    extended = parse_ini(extended_path.read_text(encoding="utf-8"))
    return compare(base, extended, str(base_path), str(extended_path))


def main(argv: list[str]) -> int:
    base_path = pathlib.Path(argv[1]) if len(argv) > 1 else BASE_INI
    extended_path = pathlib.Path(argv[2]) if len(argv) > 2 else EXTENDED_INI
    problems = check(base_path, extended_path)
    for problem in problems:
        print(f"prose: {problem}", file=sys.stderr)
    if problems:
        print(
            f"prose: {base_path} and {extended_path} have drifted apart "
            f"({len(problems)} finding(s))",
            file=sys.stderr,
        )
        return 1
    print(f"prose: {base_path} and {extended_path} share their common settings")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
