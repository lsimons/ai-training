"""Tests for scripts/prose_eval.py, on fixture JSON rather than a Vale run."""

import collections
import json
import pathlib
from collections.abc import Sequence

import pytest

import prose_eval

HITS: prose_eval.Hits = {
    "docs/spec/S01-dictionary.md": [
        {"Check": "ai-tells.Delve", "Message": "Avoid 'delve'.", "Line": 3},
        {"Check": "write-good.Passive", "Message": "'is written' may be passive.", "Line": 9},
    ],
    "README.md": [
        {"Check": "ai-tells.Delve", "Message": "Avoid 'delve'.", "Line": 1},
    ],
}


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("site/src/content/docs/basics/what-is-ai.mdx", "lessons"),
        ("docs/spec/S01-dictionary.md", "spec"),
        ("docs/agents/writing-a-lesson.md", "agent-docs"),
        ("docs/prose/README.md", "agent-docs"),
        (".claude/skills/tutor/SKILL.md", "agent-docs"),
        ("site/src/data/topics.yaml", "data"),
        ("README.md", "repo-docs"),
    ],
)
def test_area(path: str, expected: str) -> None:
    assert prose_eval.area(path) == expected


def test_parse_hits_empty_output_is_no_hits() -> None:
    assert prose_eval.parse_hits("") == {}
    assert prose_eval.parse_hits("  \n") == {}


def test_parse_hits_reads_vale_json() -> None:
    assert prose_eval.parse_hits(json.dumps(HITS)) == HITS


def test_hits_per_rule_counts_across_files() -> None:
    assert prose_eval.hits_per_rule(HITS) == collections.Counter(
        {"ai-tells.Delve": 2, "write-good.Passive": 1}
    )


def test_word_count(tmp_path: pathlib.Path) -> None:
    doc = tmp_path / "a.md"
    doc.write_text("one two\n\nthree  four\n")
    assert prose_eval.word_count(str(doc)) == 4


def test_words_per_area_totals_and_rows() -> None:
    files = ["README.md", "docs/spec/S01-dictionary.md", "docs/spec/S02-sources.md"]
    totals, rows = prose_eval.words_per_area(files, count=lambda path: len(path))
    assert totals == collections.Counter({"repo-docs": 9, "spec": 27 + 24})
    assert rows == [
        ("repo-docs", "README.md", 9),
        ("spec", "docs/spec/S01-dictionary.md", 27),
        ("spec", "docs/spec/S02-sources.md", 24),
    ]


def test_write_wordcount(tmp_path: pathlib.Path) -> None:
    prose_eval.write_wordcount(tmp_path, [("spec", "docs/spec/a.md", 12)])
    assert (
        tmp_path / "wordcount.tsv"
    ).read_text() == "area\tfile\twords\nspec\tdocs/spec/a.md\t12\n"


def test_summary_lists_rules_most_common_first() -> None:
    totals = collections.Counter({"spec": 100, "repo-docs": 50})
    text = prose_eval.summary(HITS, totals)
    assert text.splitlines() == [
        "3 hits in 2 files; 150 words",
        "      2  ai-tells.Delve",
        "      1  write-good.Passive",
        "words per area: {'spec': 100, 'repo-docs': 50}",
    ]


def test_main_without_package_exits_with_usage() -> None:
    with pytest.raises(SystemExit) as exc:
        prose_eval.main(["prose_eval.py"])
    assert "Usage" in str(exc.value)


def test_main_writes_report(
    tmp_path: pathlib.Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    doc = tmp_path / "README.md"
    doc.write_text("five words are in here\n")

    def fake_vale(files: Sequence[str]) -> prose_eval.Hits:
        return HITS

    monkeypatch.setattr(prose_eval, "tracked_files", lambda: [str(doc)])
    monkeypatch.setattr(prose_eval, "run_vale", fake_vale)

    out_dir = tmp_path / "out"
    prose_eval.main(["prose_eval.py", "ai-tells", str(out_dir)])

    assert json.loads((out_dir / "ai-tells.json").read_text()) == HITS
    assert (out_dir / "wordcount.tsv").read_text().splitlines()[1] == f"repo-docs\t{doc}\t5"
    assert capsys.readouterr().out.startswith("3 hits in 2 files; 5 words\n")
