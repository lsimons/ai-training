#!/usr/bin/env python3
"""Collect the data for evaluating a Vale style package.

Writes every hit as JSON plus word counts per area, so rules compare as hits
per thousand words. Judgement-free; the per-rule reports and the decisions
live in docs/prose/.

Usage: scripts/prose_eval.py <package> [out-dir]
Writes <out-dir>/<package>.json and <out-dir>/wordcount.tsv
(default out-dir: docs/prose/reports/<package>).
"""

import collections
import json
import pathlib
import subprocess
import sys
from collections.abc import Callable, Sequence
from typing import Any

# One Vale alert as it appears in `vale --output=JSON`: a dict keyed by
# "Check", "Message", "Line" and so on. Vale's output is {path: [alert, ...]}.
Alert = dict[str, Any]
Hits = dict[str, list[Alert]]

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
    if path.startswith("docs/plan/"):
        return "plan"
    if path.startswith("docs/spec/"):
        return "spec"
    if path.startswith(("docs/agents/", "docs/prose/", ".claude/")):
        return "agent-docs"
    if path.startswith("site/src/data/"):
        return "data"
    return "repo-docs"


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
        ["vale", "--no-exit", "--config", ".vale-eval.ini", "--output=JSON", *files],
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
    package = argv[1]
    out_dir = pathlib.Path(argv[2] if len(argv) > 2 else f"docs/prose/reports/{package}")
    out_dir.mkdir(parents=True, exist_ok=True)

    files = tracked_files()
    hits = run_vale(files)
    (out_dir / f"{package}.json").write_text(json.dumps(hits, indent=1) + "\n")

    totals, rows = words_per_area(files)
    write_wordcount(out_dir, rows)
    print(summary(hits, totals))


if __name__ == "__main__":
    main(sys.argv)
