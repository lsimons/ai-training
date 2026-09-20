#!/usr/bin/env python3
"""Score every file on every rule of a Vale *metric* package.

Metric rules (the Readability package) give one score per file and Vale only
reports the files that fail the threshold, so a normal `prose-eval` run
hides the passing files and the distribution. This script copies the
package's rules into a temporary style with the threshold removed, runs Vale
over the same files as `mise run prose`, and writes one row per file with
every score. Judgement-free; the reading is in docs/prose/.

Usage: scripts/prose-metrics.py <package> [out-dir]
Writes <out-dir>/scores.tsv (default out-dir: docs/prose/reports/<package>).
The package must already be synced into .vale/styles (`vale sync --config
.vale-eval.ini`).
"""

import json
import pathlib
import re
import subprocess
import sys
import tempfile
from importlib import util

# Reuse the file list and the area mapping of the hit-based evaluation so
# the two reports describe the same files.
_spec = util.spec_from_file_location("prose_eval", pathlib.Path(__file__).with_name("prose-eval.py"))
prose_eval = util.module_from_spec(_spec)
_spec.loader.exec_module(prose_eval)

STYLES = pathlib.Path(".vale/styles")
# Anything is greater than this, so every file reports its score.
ALWAYS = 'condition: "> -99999"'


def unconditional_style(package: str, tmp: pathlib.Path) -> pathlib.Path:
    styles = tmp / "styles"
    style = styles / package
    style.mkdir(parents=True)
    for rule in (STYLES / package).glob("*.yml"):
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


def scores(package: str, ini: pathlib.Path, files: list[str]) -> dict[str, dict[str, float]]:
    out = subprocess.run(
        ["vale", "--no-exit", "--config", str(ini), "--output=JSON", *files],
        check=True, capture_output=True, text=True,
    ).stdout
    hits = json.loads(out) if out.strip() else {}
    result: dict[str, dict[str, float]] = {}
    for path, alerts in hits.items():
        for alert in alerts:
            rule = alert["Check"].removeprefix(package + ".")
            # The score is the number in parentheses in the message.
            value = re.search(r"\(([-\d.]+)\)", alert["Message"]).group(1)
            result.setdefault(path, {})[rule] = float(value)
    return result


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    package = sys.argv[1]
    out_dir = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else f"docs/prose/reports/{package}")
    out_dir.mkdir(parents=True, exist_ok=True)
    rules = sorted(p.stem for p in (STYLES / package).glob("*.yml"))

    files = prose_eval.tracked_files()
    with tempfile.TemporaryDirectory() as tmp:
        ini = unconditional_style(package, pathlib.Path(tmp))
        per_file = scores(package, ini, files)

    with (out_dir / "scores.tsv").open("w") as tsv:
        tsv.write("area\tfile\twords\t" + "\t".join(rules) + "\n")
        for path in files:
            if path not in per_file:
                continue  # Vale's metric rules skip this format (YAML).
            row = per_file[path]
            cells = [f"{row[r]:.1f}" if r in row else "" for r in rules]
            tsv.write(f"{prose_eval.area(path)}\t{path}\t{prose_eval.word_count(path)}\t" + "\t".join(cells) + "\n")
    print(f"{len(per_file)} of {len(files)} files scored on {len(rules)} rules -> {out_dir / 'scores.tsv'}")
    skipped = [f for f in files if f not in per_file]
    if skipped:
        print(f"{len(skipped)} files got no score (Vale does not apply metric rules to their format)")


if __name__ == "__main__":
    main()
