#!/usr/bin/env python3
"""Collect the data for evaluating a Vale style package.

Writes every hit as JSON plus word counts per area, so rules compare as hits
per thousand words. Judgement-free; the per-rule reports and the decisions
live in docs/prose/.

Usage: scripts/prose-eval.py <package> [out-dir]
Writes <out-dir>/<package>.json and <out-dir>/wordcount.tsv
(default out-dir: docs/prose/reports/<package>).
"""

import collections
import json
import pathlib
import subprocess
import sys

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
        check=True, capture_output=True, text=True,
    ).stdout
    return out.split()


def run_vale(files: list[str]) -> dict:
    out = subprocess.run(
        ["vale", "--no-exit", "--config", ".vale-eval.ini", "--output=JSON", *files],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out) if out.strip() else {}


def word_count(path: str) -> int:
    return len(pathlib.Path(path).read_text().split())


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    package = sys.argv[1]
    out_dir = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else f"docs/prose/reports/{package}")
    out_dir.mkdir(parents=True, exist_ok=True)

    files = tracked_files()
    hits = run_vale(files)
    (out_dir / f"{package}.json").write_text(json.dumps(hits, indent=1) + "\n")

    words_per_area: collections.Counter[str] = collections.Counter()
    with (out_dir / "wordcount.tsv").open("w") as tsv:
        tsv.write("area\tfile\twords\n")
        for path in files:
            words = word_count(path)
            words_per_area[area(path)] += words
            tsv.write(f"{area(path)}\t{path}\t{words}\n")

    hits_per_rule: collections.Counter[str] = collections.Counter()
    for alerts in hits.values():
        for alert in alerts:
            hits_per_rule[alert["Check"]] += 1

    total_hits = sum(hits_per_rule.values())
    total_words = sum(words_per_area.values())
    print(f"{total_hits} hits in {len(hits)} files; {total_words} words")
    for rule, count in hits_per_rule.most_common():
        print(f"  {count:5d}  {rule}")
    print("words per area:", dict(words_per_area))


if __name__ == "__main__":
    main()
