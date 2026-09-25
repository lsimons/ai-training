#!/usr/bin/env python3
"""Make the synced Vale rules match across a line break (issue #371).

Vale keeps the soft line breaks of a Markdown paragraph in the text it
matches, so a rule pattern with a literal space (`, and for`) misses the
same words when the paragraph's wrap puts a line break there. A page then
passes or fails depending on where its lines wrap. This script rewrites
every literal space in the patterns of the synced style packages to `\\s`,
which matches one space or one line break, so the rules read the words and
not the wrap.

Usage: scripts/vale_linebreaks.py <ini> [<ini> ...]

For each `.zip` package pinned on the `Packages` line of the named configs
that is synced under .vale/styles/, the script rewrites the rule files in
place and prints how many files it changed. Running it again changes
nothing. A package that is not synced is skipped (`prose-check-packages`
reports it). `mise run prose-sync` and `prose-eval-sync` run the script
after `vale sync`, and `prose`, `prose-extended`, `prose-eval` and
`prose-metrics` run it first (`prose-widen`, `prose-widen-eval`), so a
package synced before this script existed is widened too.

The House style (.vale/styles/House/) is committed and written with `\\s`
from the start, and tests/test_vale_linebreaks.py checks that it stays so.
House.VerbTricolon is the exception until issue #441 is decided.

What is rewritten, per rule file:

- `existence` rules: the `tokens`, `exceptions` and `raw` lists.
- `substitution` rules: the `swap` keys (the patterns, not the
  replacements) and the `exceptions` list.

The other rule types are left alone: `sequence` matches NLP tokens one
word at a time, and `repetition`, `occurrence`, `metric`, `capitalization`,
`consistency` and `conditional` rules in the pinned packages either use
`\\s` already or match one word. None of those runs at `error` here.

The rule files are YAML, and this repository's Python is standard library
only, so the script edits them line by line. It reads the formats the
pinned packages use: a list item on one line (`- "..."`, `- '...'` or a
plain scalar) and a `key: value` mapping line under `swap`. A line it does
not recognize inside one of those blocks stops the script with the file
and line number, so a new package format fails loudly instead of being
skipped. A space inside a character class (`[- ]`) becomes `\\s` too,
which also admits a line break there, as intended.
"""

import pathlib
import re
import sys
from collections.abc import Sequence

import prose_eval

STYLES = prose_eval.STYLES

# Which blocks hold patterns, per `extends` value. A key in `swap` is a
# pattern; its value is the replacement text and stays as written.
LIST_BLOCKS = {
    "existence": {"tokens", "exceptions", "raw"},
    "substitution": {"exceptions"},
}
MAP_BLOCKS = {"substitution": {"swap"}}

TOP_KEY = re.compile(r"^([A-Za-z_]+):(.*)$")
LIST_ITEM = re.compile(r"^(\s+- )(.*)$")
MAP_ITEM = re.compile(r"^(\s+)(.+?)(:(?: .*)?)$")
# A YAML comment starts at a `#` after whitespace, in a plain scalar.
PLAIN_COMMENT = re.compile(r"\s+#.*$")
# The only escapes the pinned packages use in double-quoted scalars.
DQ_ESCAPES = {"\\": "\\", '"': '"'}


class RuleFormatError(ValueError):
    """A line in a pattern block that this script does not know how to read."""


def widen_pattern(pattern: str) -> str:
    """Replace each space in a regular expression with `\\s`.

    An escaped space (`\\ `) is a literal space too, so it becomes `\\s`.
    Every other escape pair is copied as it is.
    """
    out: list[str] = []
    i = 0
    while i < len(pattern):
        char = pattern[i]
        if char == "\\" and i + 1 < len(pattern):
            pair = pattern[i : i + 2]
            out.append("\\s" if pair == "\\ " else pair)
            i += 2
            continue
        out.append("\\s" if char == " " else char)
        i += 1
    return "".join(out)


def _decode_double(body: str, where: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(body):
        char = body[i]
        if char == "\\":
            nxt = body[i + 1] if i + 1 < len(body) else ""
            if nxt not in DQ_ESCAPES:
                raise RuleFormatError(
                    f"{where}: unsupported escape '\\{nxt}' in a double-quoted pattern"
                )
            out.append(DQ_ESCAPES[nxt])
            i += 2
            continue
        out.append(char)
        i += 1
    return "".join(out)


def _encode_double(pattern: str) -> str:
    return pattern.replace("\\", "\\\\").replace('"', '\\"')


def _split_double(text: str, where: str) -> tuple[str, str]:
    """`"body" # comment` into the body and whatever follows the closing quote."""
    i = 1
    while i < len(text):
        if text[i] == "\\":
            i += 2
            continue
        if text[i] == '"':
            return text[1:i], text[i + 1 :]
        i += 1
    raise RuleFormatError(f"{where}: unterminated double-quoted pattern")


def _split_single(text: str, where: str) -> tuple[str, str]:
    """`'body': value` into the body (`''` escapes kept) and what follows the closing quote."""
    i = 1
    while i < len(text):
        if text[i] == "'":
            if text[i + 1 : i + 2] == "'":
                i += 2
                continue
            return text[1:i], text[i + 1 :]
        i += 1
    raise RuleFormatError(f"{where}: unterminated single-quoted pattern")


def widen_scalar(text: str, where: str) -> str:
    """Widen one YAML scalar as written in the file, keeping its quoting and comment."""
    if text.startswith('"'):
        body, rest = _split_double(text, where)
        return '"' + _encode_double(widen_pattern(_decode_double(body, where))) + '"' + rest
    if text.startswith("'"):
        body, rest = _split_single(text, where)
        return "'" + widen_pattern(body.replace("''", "'")).replace("'", "''") + "'" + rest
    if text[:1] in "|>[{&*!%@`":
        raise RuleFormatError(f"{where}: unsupported YAML scalar '{text}'")
    comment = PLAIN_COMMENT.search(text)
    cut = comment.start() if comment else len(text)
    return widen_pattern(text[:cut]) + text[cut:]


def widen_rule(text: str, name: str = "<rule>") -> str:
    """The rule file `text` with every pattern widened, or `text` when no pattern has a space."""
    lines = text.splitlines(keepends=True)
    extends = next(
        (
            m.group(2).strip()
            for line in lines
            if (m := TOP_KEY.match(line)) and m.group(1) == "extends"
        ),
        "",
    )
    list_blocks = LIST_BLOCKS.get(extends, set())
    map_blocks = MAP_BLOCKS.get(extends, set())
    block = ""
    out: list[str] = []
    for number, line in enumerate(lines, start=1):
        where = f"{name}:{number}"
        body = line.rstrip("\r\n")
        ending = line[len(body) :]
        top = TOP_KEY.match(body)
        if top:
            block = top.group(1)
            if (
                block in list_blocks | map_blocks
                and top.group(2).strip()
                and not top.group(2).strip().startswith("#")
            ):
                raise RuleFormatError(f"{where}: '{block}' written inline is not supported")
            out.append(line)
            continue
        stripped = body.strip()
        if (
            body.startswith("---")
            or not stripped
            or stripped.startswith("#")
            or block not in list_blocks | map_blocks
        ):
            out.append(line)
            continue
        if block in list_blocks:
            item = LIST_ITEM.match(body)
            if not item:
                raise RuleFormatError(f"{where}: expected a '- pattern' list item in '{block}'")
            out.append(item.group(1) + widen_scalar(item.group(2), where) + ending)
            continue
        indent = body[: len(body) - len(body.lstrip())]
        if stripped.startswith(("'", '"')):
            # A quoted key. Everything after its closing quote (`: value`)
            # is kept as written, so the replacement is never touched.
            out.append(indent + widen_scalar(stripped, where) + ending)
            continue
        entry = MAP_ITEM.match(body)
        if not entry:
            raise RuleFormatError(f"{where}: expected a 'pattern: replacement' line in '{block}'")
        out.append(entry.group(1) + widen_scalar(entry.group(2), where) + entry.group(3) + ending)
    return "".join(out)


def package_dirs(inis: Sequence[pathlib.Path], styles: pathlib.Path) -> list[pathlib.Path]:
    """The synced directory of each package pinned in `inis`, in order, without repeats."""
    names: list[str] = []
    for ini in inis:
        names.extend(name for name in prose_eval.pinned_packages(ini) if name not in names)
    return [styles / name for name in names if (styles / name).is_dir()]


def run(inis: Sequence[pathlib.Path], styles: pathlib.Path) -> list[pathlib.Path]:
    """Widen the rule files that have a literal space in a pattern, and return them."""
    changed: list[pathlib.Path] = []
    for directory in package_dirs(inis, styles):
        for rule in sorted(directory.glob("*.yml")):
            text = rule.read_text(encoding="utf-8")
            widened = widen_rule(text, str(rule))
            if widened == text:
                continue
            changed.append(rule)
            rule.write_text(widened, encoding="utf-8")
    return changed


def main(argv: Sequence[str]) -> int:
    if not argv:
        sys.exit(__doc__)
    try:
        changed = run([pathlib.Path(arg) for arg in argv], STYLES)
    except RuleFormatError as exc:
        sys.exit(f"vale_linebreaks: {exc}")
    if changed:
        print(f"vale_linebreaks: widened {len(changed)} rule files to match across line breaks")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
