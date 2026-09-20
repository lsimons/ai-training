#!/usr/bin/env sh
# Collect the data for evaluating a Vale style package: every hit as JSON,
# plus word counts per area so rules compare as hits per thousand words.
# Judgement-free; the per-rule reports and decisions live in docs/prose/.
#
# Usage: scripts/prose-eval.sh <package-name> [out-dir]
# Writes <out-dir>/<package>.json and <out-dir>/wordcount.tsv
# (default out-dir: docs/prose/reports/<package>).
set -eu
pkg=${1:?package name, e.g. write-good}
out=${2:-docs/prose/reports/$pkg}
mkdir -p "$out"
# Same file set as `mise run prose`, minus the reports themselves, which
# quote the flagged sentences and would otherwise flag again, and minus
# CLAUDE.md, a symlink to AGENTS.md that would count twice.
files=$(git ls-files -- '*.md' '*.mdx' 'site/src/data/**/*.yaml' 'site/src/data/*.yaml' ':!site/examples/**' ':!docs/prose/reports/**' ':!CLAUDE.md')
# shellcheck disable=SC2086
vale --no-exit --config .vale-eval.ini --output=JSON $files > "$out/$pkg.json"
# Areas: where a sentence lives says who reads it and how much it matters.
area() {
  case "$1" in
    site/src/content/docs/*) echo lessons ;;
    docs/plan/*) echo plan ;;
    docs/spec/*) echo spec ;;
    docs/agents/*|docs/prose/*|.claude/*) echo agent-docs ;;
    site/src/data/*) echo data ;;
    *) echo repo-docs ;;
  esac
}
{
  printf 'area\tfile\twords\n'
  for f in $files; do
    printf '%s\t%s\t%s\n' "$(area "$f")" "$f" "$(wc -w < "$f" | tr -d ' ')"
  done
} > "$out/wordcount.tsv"
python3 - "$out/$pkg.json" "$out/wordcount.tsv" <<'PY'
import json, sys, collections
hits = json.load(open(sys.argv[1]))
words = collections.Counter()
for line in open(sys.argv[2]).read().splitlines()[1:]:
    area, f, n = line.split('\t'); words[area] += int(n)
by_rule = collections.Counter()
for f, alerts in hits.items():
    for a in alerts: by_rule[a['Check']] += 1
print(f"{sum(by_rule.values())} hits in {len(hits)} files; {sum(words.values())} words")
for r, n in by_rule.most_common(): print(f"  {n:5d}  {r}")
print("words per area:", dict(words))
PY
