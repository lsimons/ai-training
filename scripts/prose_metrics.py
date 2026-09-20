#!/usr/bin/env python3
"""Score every file on every rule of a Vale *metric* package.

Metric rules (the Readability package) give one score per file and Vale only
reports the files that fail the threshold, so a normal `prose-eval` run
hides the passing files and the distribution. This script copies the
package's rules into a temporary style with the threshold removed, runs Vale
over the same files as `mise run prose`, and writes one row per file with
every score. This script makes no judgment. The reading is in docs/prose/.

Usage: scripts/prose_metrics.py <package> [out-dir]
Writes <out-dir>/scores.tsv (default out-dir: docs/prose/reports/<package>).
The package must already be synced into .vale/styles (`vale sync --config
.vale-eval.ini`).
"""

import pathlib
import re
import subprocess
import sys
import tempfile
from collections.abc import Callable, Sequence

# The file list and the area mapping of the hit-based evaluation, so the two
# reports describe the same files. pytest and `uv run` both put scripts/ on
# the path; run as a script, the directory of the script itself is on it.
import prose_eval

STYLES = pathlib.Path(".vale/styles")
# Anything is greater than this, so every file reports its score.
ALWAYS = 'condition: "> -99999"'

# {path: {rule: score}}
Scores = dict[str, dict[str, float]]


def unconditional_style(
    package: str, tmp: pathlib.Path, styles_dir: pathlib.Path = STYLES
) -> pathlib.Path:
    """Copy the package's rules with the threshold removed; return the .ini."""
    styles = tmp / "styles"
    style = styles / package
    style.mkdir(parents=True)
    for rule in (styles_dir / package).glob("*.yml"):
        text = re.sub(r"^condition: .*$", ALWAYS, rule.read_text(), flags=re.M)
        (style / rule.name).write_text(text)
    ini = tmp / "metrics.ini"
    ini.write_text(
        f"StylesPath = {styles}\n"
        "MinAlertLevel = suggestion\n"
        "[*.{md,mdx}]\n"
        f"BasedOnStyles = {package}\n"
        "[*.{yaml,yml}]\n"
        f"BasedOnStyles = {package}\n"
    )
    return ini


def parse_scores(package: str, hits: prose_eval.Hits) -> Scores:
    result: Scores = {}
    for path, alerts in hits.items():
        for alert in alerts:
            rule = alert["Check"].removeprefix(package + ".")
            # The score is the number in parentheses in the message.
            match = re.search(r"\(([-\d.]+)\)", alert["Message"])
            if match is None:
                raise ValueError(f"no score in {path} {alert['Check']}: {alert['Message']!r}")
            result.setdefault(path, {})[rule] = float(match.group(1))
    return result


def scores(package: str, ini: pathlib.Path, files: Sequence[str]) -> Scores:
    out = subprocess.run(
        ["vale", "--no-exit", "--config", str(ini), "--output=JSON", *files],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    return parse_scores(package, prose_eval.parse_hits(out))


def write_scores(
    out_path: pathlib.Path,
    rules: Sequence[str],
    files: Sequence[str],
    per_file: Scores,
    word_count: Callable[[str], int] = prose_eval.word_count,
) -> list[str]:
    """Write one row per scored file. Returns the files that got no score."""
    skipped: list[str] = []
    with out_path.open("w") as tsv:
        tsv.write("area\tfile\twords\t" + "\t".join(rules) + "\n")
        for path in files:
            if path not in per_file:
                # Vale's metric rules skip this format (YAML).
                skipped.append(path)
                continue
            row = per_file[path]
            cells = [f"{row[r]:.1f}" if r in row else "" for r in rules]
            head = f"{prose_eval.area(path)}\t{path}\t{word_count(path)}\t"
            tsv.write(head + "\t".join(cells) + "\n")
    return skipped


def main(argv: Sequence[str]) -> None:
    if len(argv) < 2:
        sys.exit(__doc__)
    package = argv[1]
    out_dir = pathlib.Path(argv[2] if len(argv) > 2 else f"docs/prose/reports/{package}")
    out_dir.mkdir(parents=True, exist_ok=True)
    rules = sorted(p.stem for p in (STYLES / package).glob("*.yml"))

    files = prose_eval.tracked_files()
    with tempfile.TemporaryDirectory() as tmp:
        ini = unconditional_style(package, pathlib.Path(tmp))
        per_file = scores(package, ini, files)

    out_path = out_dir / "scores.tsv"
    skipped = write_scores(out_path, rules, files, per_file)
    print(f"{len(per_file)} of {len(files)} files scored on {len(rules)} rules -> {out_path}")
    if skipped:
        print(
            f"{len(skipped)} files got no score (Vale does not apply metric rules to their format)"
        )


if __name__ == "__main__":
    main(sys.argv)
