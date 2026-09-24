"""Tests for scripts/prose_metrics.py, on fixture JSON rather than a Vale run."""

import pathlib
from collections.abc import Sequence

import pytest

import prose_metrics

# The tests run from any cwd, so the real config is found from this file.
REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

HITS = {
    "docs/spec/S01-dictionary.md": [
        {"Check": "Readability.FleschKincaid", "Message": "Grade level too high (12.4)."},
        {"Check": "Readability.SMOG", "Message": "SMOG score (9.0)."},
    ],
    "README.md": [
        {"Check": "Readability.FleschKincaid", "Message": "Grade level too high (7.5)."},
    ],
}


def test_parse_scores_strips_package_and_reads_the_number() -> None:
    assert prose_metrics.parse_scores("Readability", HITS) == {
        "docs/spec/S01-dictionary.md": {"FleschKincaid": 12.4, "SMOG": 9.0},
        "README.md": {"FleschKincaid": 7.5},
    }


def test_parse_scores_rejects_a_message_without_a_score() -> None:
    hits = {"a.md": [{"Check": "Readability.SMOG", "Message": "no number here"}]}
    with pytest.raises(ValueError, match=r"no score in a\.md"):
        prose_metrics.parse_scores("Readability", hits)


def test_unconditional_style_removes_the_threshold(tmp_path: pathlib.Path) -> None:
    styles = tmp_path / "styles"
    (styles / "Readability").mkdir(parents=True)
    (styles / "Readability" / "SMOG.yml").write_text(
        'extends: metric\nmessage: "SMOG (%s)"\ncondition: "> 10"\n'
    )
    (styles / "Readability" / "notes.txt").write_text("ignored\n")

    tmp = tmp_path / "tmp"
    tmp.mkdir()
    ini = prose_metrics.unconditional_style("Readability", tmp, styles_dir=styles)

    copied = tmp / "styles" / "Readability"
    assert sorted(p.name for p in copied.iterdir()) == ["SMOG.yml"]
    assert (copied / "SMOG.yml").read_text() == (
        f'extends: metric\nmessage: "SMOG (%s)"\n{prose_metrics.ALWAYS}\n'
    )
    text = ini.read_text()
    assert f"StylesPath = {tmp / 'styles'}" in text
    assert text.count("BasedOnStyles = Readability") == 2


def test_write_scores_one_row_per_scored_file(tmp_path: pathlib.Path) -> None:
    out = tmp_path / "scores.tsv"
    per_file = prose_metrics.parse_scores("Readability", HITS)
    files = ["README.md", "site/src/data/topics.yaml", "docs/spec/S01-dictionary.md"]

    skipped = prose_metrics.write_scores(
        out, ["FleschKincaid", "SMOG"], files, per_file, word_count=lambda path: 10
    )

    assert skipped == ["site/src/data/topics.yaml"]
    assert out.read_text().splitlines() == [
        "area\tfile\twords\tFleschKincaid\tSMOG",
        "repo-docs\tREADME.md\t10\t7.5\t",
        "spec\tdocs/spec/S01-dictionary.md\t10\t12.4\t9.0",
    ]


def test_main_without_package_exits_with_usage() -> None:
    with pytest.raises(SystemExit) as exc:
        prose_metrics.main(["prose_metrics.py"])
    assert "Usage" in str(exc.value)


def test_main_writes_scores(
    tmp_path: pathlib.Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    styles = tmp_path / "styles"
    (styles / "Readability").mkdir(parents=True)
    (styles / "Readability" / "SMOG.yml").write_text('condition: "> 10"\n')
    (styles / "Readability" / "FleschKincaid.yml").write_text('condition: "> 8"\n')
    monkeypatch.setattr(prose_metrics, "STYLES", styles)

    doc = tmp_path / "README.md"
    doc.write_text("four words right here\n")

    def fake_scores(package: str, ini: pathlib.Path, files: Sequence[str]) -> prose_metrics.Scores:
        return {str(doc): {"FleschKincaid": 7.5}}

    def synced(ini: pathlib.Path, styles: pathlib.Path) -> None:
        pass

    monkeypatch.setattr(prose_metrics.prose_eval, "check_packages_synced", synced)
    monkeypatch.setattr(prose_metrics.prose_eval, "tracked_files", lambda: [str(doc)])
    monkeypatch.setattr(prose_metrics, "scores", fake_scores)

    out_dir = tmp_path / "out"
    prose_metrics.main(["prose_metrics.py", "Readability", str(out_dir)])

    assert (out_dir / "scores.tsv").read_text().splitlines() == [
        "area\tfile\twords\tFleschKincaid\tSMOG",
        f"repo-docs\t{doc}\t4\t7.5\t",
    ]
    assert capsys.readouterr().out.startswith("1 of 1 files scored on 2 rules")


def test_main_stops_when_eval_packages_not_synced(
    tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(prose_metrics.prose_eval, "EVAL_INI", REPO_ROOT / ".vale-eval.ini")
    monkeypatch.setattr(prose_metrics, "STYLES", tmp_path / "styles")
    out_dir = tmp_path / "out"
    with pytest.raises(SystemExit) as exc:
        prose_metrics.main(["prose_metrics.py", "Readability", str(out_dir)])
    assert "vale sync --config .vale-eval.ini" in str(exc.value)
    assert not out_dir.exists()
