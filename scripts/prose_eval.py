#!/usr/bin/env python3
"""Collect the data for evaluating a Vale style package.

Writes every hit as JSON plus word counts per area, so rules compare as hits
per thousand words. This script makes no judgment. The per-rule reports and
the decisions are in docs/prose/.

Usage: scripts/prose_eval.py <package> [out-dir]
       scripts/prose_eval.py --check-packages <ini> [<ini> ...]
The first form writes <out-dir>/<package>.json and <out-dir>/wordcount.tsv
(default out-dir: docs/prose/reports/<package>).
Every package pinned in .vale-eval.ini must already be synced into
.vale/styles (`mise run prose-eval-sync`), or the script stops.
The second form only runs that check, for the named configs, and is what
the `prose-check-packages` task in .mise.toml runs before `prose` and
`prose-extended`, so one parser reads every Vale config here.
"""

import collections
import json
import pathlib
import re
import subprocess
import sys
from collections.abc import Callable, Sequence
from typing import Any

import vale_configs

# One Vale alert as it appears in `vale --output=JSON`: a dict keyed by
# "Check", "Message", "Line" and so on. Vale's output is {path: [alert, ...]}.
Alert = dict[str, Any]
Hits = dict[str, list[Alert]]

# The eval config and the directory its packages unpack into. `mise run
# prose-sync` reads .vale.ini only, so the eval packages have their own
# sync task, `prose-eval-sync` (`vale sync --config .vale-eval.ini`).
EVAL_INI = pathlib.Path(".vale-eval.ini")
STYLES = pathlib.Path(".vale/styles")
EVAL_SYNC = "mise run prose-eval-sync"
MAIN_SYNC = "mise run prose-sync"
CHECK_FLAG = "--check-packages"

# A package URL on a `Packages` line ends in `<name>.zip`, and Vale unpacks
# it to `<StylesPath>/<name>/`: "A package's name is the archive's file name
# without `.zip`" (https://docs.vale.sh/keys/packages, "Naming a package").
# A bare package name (`Packages = Google`, which that page says Vale looks
# up in its package library) has no `.zip` and is not supported here: the
# check would not know the directory to look for.
PACKAGE_ZIP = re.compile(r"([^/\s,]+)\.zip$")


class UnsupportedPackageError(ValueError):
    """A `Packages` entry that is not a `.zip` URL, with the entry as `str(exc)`."""


def package_entries(ini: pathlib.Path) -> list[str]:
    """Every comma-separated entry of the top-level `Packages` key.

    The file is read by `vale_configs.parse_ini`, which owns the ini rules
    (comments, continuation lines, a repeated key) and raises `ValueError`
    on a line it does not cover. Only the top-level `Packages` counts:
    `Packages` is a core setting, and Vale reports a core key under a
    section as an error (https://docs.vale.sh/topics/.vale.ini, "The file").
    """
    config = vale_configs.parse_ini(ini.read_text(encoding="utf-8"))
    value = config[""].get("Packages", "")
    return [part.strip() for part in value.split(",") if part.strip()]


# Same file set as `mise run prose`, minus the reports themselves, which
# quote the flagged sentences and would otherwise flag again, and minus
# CLAUDE.md, a symlink to AGENTS.md that would count twice, and minus the
# Code of Conduct, which nobody here wrote.
FILE_PATHSPECS = [
    "*.md",
    "*.mdx",
    "site/src/data/**/*.yaml",
    "site/src/data/*.yaml",
    ":!site/examples/**",
    ":!docs/prose/reports/**",
    ":!CLAUDE.md",
    # The Contributor Covenant, verbatim third-party text.
    ":!CODE_OF_CONDUCT.md",
]


def area(path: str) -> str:
    """Where a sentence lives says who reads it and how much it matters."""
    if path.startswith("site/src/content/docs/"):
        return "lessons"
    if path.startswith("docs/spec/"):
        return "spec"
    if path.startswith(("docs/agents/", "docs/prose/", ".claude/")):
        return "agent-docs"
    if path.startswith("site/src/data/"):
        return "data"
    return "repo-docs"


def pinned_packages(ini: pathlib.Path) -> list[str]:
    """The package names on the `Packages` lines of a Vale config.

    Raises `UnsupportedPackageError` for an entry that is not a `.zip` URL, so a
    mixed list (`Packages = Google, https://.../write-good.zip`) never
    passes with the bare name silently dropped. The `prose-check-packages`
    task in .mise.toml reads .vale.ini and .vale-extended.ini through this
    same function.
    """
    names: list[str] = []
    for entry in package_entries(ini):
        match = PACKAGE_ZIP.search(entry)
        if match is None:
            raise UnsupportedPackageError(entry)
        names.append(match.group(1))
    return names


def missing_packages(names: Sequence[str], styles: pathlib.Path) -> list[str]:
    """The pinned packages with no directory under the styles path.

    The synced styles are gitignored, so in a fresh clone or worktree Vale
    would otherwise run a smaller rule set and report fewer hits (#276).
    """
    return [name for name in names if not (styles / name).is_dir()]


def sync_command(ini: pathlib.Path) -> str:
    """The mise task that fetches the packages of a config.

    `prose-sync` runs plain `vale sync`, which reads .vale.ini, and the
    extended config pins the same packages. The eval config has its own.
    """
    return EVAL_SYNC if ini.name == EVAL_INI.name else MAIN_SYNC


def check_packages_synced(ini: pathlib.Path, styles: pathlib.Path) -> None:
    """Exit with a message naming the sync command when a package is missing."""
    try:
        names = pinned_packages(ini)
    except UnsupportedPackageError as exc:
        sys.exit(
            f"prose: Packages entry '{exc}' in {ini} is not a .zip URL. "
            "Pin each package by its release .zip URL: a bare package name is not supported."
        )
    except ValueError as exc:
        sys.exit(f"prose: {ini}: {exc}")
    if not names:
        sys.exit(
            f"prose: no .zip packages found on the Packages lines of {ini}. "
            "Pin each package by its release .zip URL: a bare package name is not supported."
        )
    missing = missing_packages(names, styles)
    if missing:
        sys.exit(
            f"prose: Vale packages from {ini} not synced under {styles}/: "
            f"{', '.join(missing)}. Run '{sync_command(ini)}' first."
        )


def check_configs(inis: Sequence[str]) -> None:
    """The `--check-packages` entry: every named config, in order, first failure stops."""
    if not inis:
        sys.exit(__doc__)
    for ini in inis:
        check_packages_synced(pathlib.Path(ini), STYLES)


def tracked_files() -> list[str]:
    out = subprocess.run(
        ["git", "ls-files", "--", *FILE_PATHSPECS],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return out.split()


def parse_hits(vale_json: str) -> Hits:
    """Vale prints nothing at all, rather than `{}`, when there are no hits."""
    return json.loads(vale_json) if vale_json.strip() else {}


def run_vale(files: Sequence[str]) -> Hits:
    out = subprocess.run(
        ["vale", "--no-exit", "--config", str(EVAL_INI), "--output=JSON", *files],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return parse_hits(out)


def word_count(path: str) -> int:
    return len(pathlib.Path(path).read_text().split())


def words_per_area(
    files: Sequence[str], count: Callable[[str], int] = word_count
) -> tuple[collections.Counter[str], list[tuple[str, str, int]]]:
    """Total words per area, plus one (area, path, words) row per file."""
    totals: collections.Counter[str] = collections.Counter()
    rows: list[tuple[str, str, int]] = []
    for path in files:
        words = count(path)
        totals[area(path)] += words
        rows.append((area(path), path, words))
    return totals, rows


def hits_per_rule(hits: Hits) -> collections.Counter[str]:
    counts: collections.Counter[str] = collections.Counter()
    for alerts in hits.values():
        for alert in alerts:
            counts[alert["Check"]] += 1
    return counts


def write_wordcount(out_dir: pathlib.Path, rows: Sequence[tuple[str, str, int]]) -> None:
    with (out_dir / "wordcount.tsv").open("w") as tsv:
        tsv.write("area\tfile\twords\n")
        for row_area, path, words in rows:
            tsv.write(f"{row_area}\t{path}\t{words}\n")


def summary(hits: Hits, totals: collections.Counter[str]) -> str:
    per_rule = hits_per_rule(hits)
    lines = [f"{sum(per_rule.values())} hits in {len(hits)} files; {sum(totals.values())} words"]
    lines.extend(f"  {count:5d}  {rule}" for rule, count in per_rule.most_common())
    lines.append(f"words per area: {dict(totals)}")
    return "\n".join(lines)


def main(argv: Sequence[str]) -> None:
    if len(argv) < 2:
        sys.exit(__doc__)
    if argv[1] == CHECK_FLAG:
        check_configs(argv[2:])
        return
    package = argv[1]
    out_dir = pathlib.Path(argv[2] if len(argv) > 2 else f"docs/prose/reports/{package}")
    check_packages_synced(EVAL_INI, STYLES)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = tracked_files()
    hits = run_vale(files)
    (out_dir / f"{package}.json").write_text(json.dumps(hits, indent=1) + "\n")

    totals, rows = words_per_area(files)
    write_wordcount(out_dir, rows)
    print(summary(hits, totals))


if __name__ == "__main__":
    main(sys.argv)
