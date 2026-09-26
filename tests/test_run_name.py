"""Tests for scripts/run_name.py, on the real run-names file and planted runs."""

import json
import pathlib
import subprocess
from collections.abc import Sequence
from typing import cast

import pytest

import run_name
from run_name import Run, RunIssue

NAMES_TEXT = run_name.NAMES_FILE.read_text(encoding="utf-8")
SEQUENCE = run_name.run_name_sequence(NAMES_TEXT)
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
GOOD = [[f"{letter}one" for letter in LETTERS], [f"{letter}two" for letter in LETTERS]]


def run(number: int, name: str, is_open: bool, created_at: str) -> Run:
    return {
        "number": number,
        "name": name,
        "kind": "lessons",
        "open": is_open,
        "createdAt": created_at,
    }


def issue(number: int, title: str, created_at: str, state: str = "OPEN") -> RunIssue:
    return {
        "number": number,
        "title": title,
        "state": "OPEN" if state == "OPEN" else "CLOSED",
        "createdAt": created_at,
    }


def replaced(names: list[str], i: int, name: str) -> list[str]:
    copy = list(names)
    copy[i] = name
    return copy


# The run-names file


def test_file_holds_two_lists_of_26_names_one_per_letter_and_no_name_twice() -> None:
    assert run_name.check_run_names(run_name.parse_run_names(NAMES_TEXT)) == []
    assert len(SEQUENCE) == 52
    assert SEQUENCE[:3] == ["Axolotl", "Badger", "Capybara"]
    assert SEQUENCE[26] == "Alpaca"
    assert len(set(SEQUENCE)) == 52


def test_parse_skips_comments_and_splits_on_blank_lines() -> None:
    text = "# header\n\nAone\nBone\n\n\n# between\nAtwo\n  Btwo  \n"
    assert run_name.parse_run_names(text) == [["Aone", "Bone"], ["Atwo", "Btwo"]]


# check_run_names


def test_check_accepts_one_name_per_letter_in_both_lists() -> None:
    assert run_name.check_run_names(GOOD) == []


def test_check_rejects_a_missing_list() -> None:
    message = (
        "run-names: the file must hold two lists, first and second, separated by a blank line, not "
    )
    assert run_name.check_run_names([]) == [message + "0"]
    assert run_name.check_run_names([GOOD[0]]) == [message + "1"]


def test_check_rejects_a_third_list() -> None:
    assert run_name.check_run_names([*GOOD, ["Athree"]]) == [
        "run-names: the file must hold two lists, first and second, separated by a blank line, "
        "not 3"
    ]


def test_check_rejects_a_short_list() -> None:
    assert "run-names: second has 25 names, not 26" in run_name.check_run_names(
        [GOOD[0], GOOD[1][1:]]
    )


def test_check_rejects_a_wrong_letter() -> None:
    errors = run_name.check_run_names([replaced(GOOD[0], 1, "Cone"), GOOD[1]])
    assert "run-names: first[1] Cone does not start with B" in errors


def test_check_rejects_a_repeat() -> None:
    errors = run_name.check_run_names([GOOD[0], replaced(GOOD[1], 0, "Aone")])
    assert "run-names: Aone is in the lists twice" in errors


def test_check_rejects_a_name_that_is_not_one_capitalized_word() -> None:
    errors = run_name.check_run_names([replaced(GOOD[0], 0, "A one"), GOOD[1]])
    assert 'run-names: first[0] "A one" is not one capitalized word' in errors


def test_check_rejects_a_name_past_z() -> None:
    errors = run_name.check_run_names([[*GOOD[0], "Aextra"], GOOD[1]])
    assert errors == ["run-names: first has 27 names, not 26"]


def test_sequence_raises_on_a_wrong_file() -> None:
    with pytest.raises(run_name.RunNameError, match="blank line, not 0"):
        run_name.run_name_sequence("# only a comment\n")
    with pytest.raises(run_name.RunNameError, match="first has 1 names"):
        run_name.run_name_sequence("Aone\n\nAtwo\n")


# run_of


def test_run_of_reads_the_name_and_kind_from_a_run_title() -> None:
    assert run_name.run_of(issue(360, "Run: Capybara (lessons)", "2026-09-25T08:00:00Z")) == {
        "number": 360,
        "name": "Capybara",
        "kind": "lessons",
        "open": True,
        "createdAt": "2026-09-25T08:00:00Z",
    }
    closed = run_name.run_of(issue(361, "Run: Dingo (mixed)", "", state="CLOSED"))
    assert closed is not None
    assert closed["open"] is False


def test_run_of_ignores_an_issue_whose_title_is_not_a_run_title() -> None:
    assert run_name.run_of(issue(361, "Run Capybara", "")) is None
    assert run_name.run_of(issue(362, "Run: capybara (lessons)", "")) is None


# next_run_name


def test_next_starts_at_the_first_name_when_there_is_no_run_yet() -> None:
    assert run_name.next_run_name(SEQUENCE, []) == "Axolotl"


def test_next_takes_the_letter_after_the_newest_run_open_or_closed() -> None:
    runs = [
        run(1, "Axolotl", False, "2026-09-25T08:00:00Z"),
        run(2, "Badger", False, "2026-09-25T09:00:00Z"),
    ]
    assert run_name.next_run_name(SEQUENCE, runs) == "Capybara"


def test_next_goes_by_when_the_run_started_not_by_the_letter() -> None:
    runs = [
        run(5, "Zebu", False, "2026-09-20T08:00:00Z"),
        run(9, "Badger", True, "2026-09-25T08:00:00Z"),
    ]
    assert run_name.next_run_name(SEQUENCE, runs) == "Capybara"


def test_next_wraps_from_z_to_the_other_list() -> None:
    assert run_name.next_run_name(SEQUENCE, [run(1, "Zebra", False, "2026-09-25T08:00:00Z")]) == (
        "Alpaca"
    )
    assert run_name.next_run_name(SEQUENCE, [run(1, "Zebu", False, "2026-09-25T08:00:00Z")]) == (
        "Axolotl"
    )


def test_next_skips_a_name_an_open_run_holds_and_reuses_a_closed_one() -> None:
    runs = [
        run(1, "Capybara", True, "2026-09-01T08:00:00Z"),
        run(2, "Dingo", False, "2026-09-02T08:00:00Z"),
        run(3, "Badger", False, "2026-09-25T08:00:00Z"),
    ]
    assert run_name.next_run_name(SEQUENCE, runs) == "Dingo"


def test_next_starts_at_the_first_name_when_the_newest_name_is_not_in_the_lists() -> None:
    runs = [run(1, "Unicorn", False, "2026-09-25T08:00:00Z")]
    assert run_name.next_run_name(SEQUENCE, runs) == "Axolotl"


def test_next_raises_when_every_name_is_held() -> None:
    runs = [run(i + 1, name, True, f"2026-09-25T08:00:{i:02d}Z") for i, name in enumerate(SEQUENCE)]
    with pytest.raises(run_name.RunNameError, match="all 52 names are held"):
        run_name.next_run_name(SEQUENCE, runs)


# newest_run


def test_newest_breaks_a_tie_in_the_start_time_by_the_higher_issue_number() -> None:
    at = "2026-09-25T08:00:00Z"
    newest = run_name.newest_run([run(4, "Emu", True, at), run(7, "Ferret", True, at)])
    assert newest is not None
    assert newest["name"] == "Ferret"
    newest = run_name.newest_run([run(7, "Ferret", True, at), run(4, "Emu", True, at)])
    assert newest is not None
    assert newest["name"] == "Ferret"
    assert run_name.newest_run([]) is None


# name_taken_by


def test_taken_by_names_the_older_open_run_with_the_same_name() -> None:
    runs = [
        run(10, "Capybara", True, "2026-09-25T08:00:00Z"),
        run(11, "Capybara", True, "2026-09-25T08:00:05Z"),
    ]
    taken = run_name.name_taken_by(runs, 11)
    assert taken is not None
    assert taken["number"] == 10
    assert run_name.name_taken_by(runs, 10) is None


def test_taken_by_ignores_a_closed_run_with_the_same_name_and_another_name() -> None:
    runs = [
        run(10, "Capybara", False, "2026-09-20T08:00:00Z"),
        run(11, "Badger", True, "2026-09-24T08:00:00Z"),
        run(12, "Capybara", True, "2026-09-25T08:00:00Z"),
    ]
    assert run_name.name_taken_by(runs, 12) is None


def test_taken_by_breaks_a_tie_in_the_start_time_by_the_lower_issue_number() -> None:
    at = "2026-09-25T08:00:00Z"
    taken = run_name.name_taken_by([run(10, "Dingo", True, at), run(11, "Dingo", True, at)], 11)
    assert taken is not None
    assert taken["number"] == 10


def test_taken_by_picks_the_lowest_number_of_several_older_rivals() -> None:
    runs = [
        run(12, "Dingo", True, "2026-09-25T08:00:01Z"),
        run(10, "Dingo", True, "2026-09-25T08:00:02Z"),
        run(13, "Dingo", True, "2026-09-25T08:00:09Z"),
    ]
    taken = run_name.name_taken_by(runs, 13)
    assert taken is not None
    assert taken["number"] == 10


def test_taken_by_raises_for_an_issue_that_is_not_a_run() -> None:
    with pytest.raises(run_name.RunNameError, match="#12 is not a run issue"):
        run_name.name_taken_by([], 12)


# parse_args


def test_parse_args_takes_no_arguments_or_check_with_an_issue_number() -> None:
    assert run_name.parse_args([]) is None
    assert run_name.parse_args(["--check", "#360"]) == 360
    assert run_name.parse_args(["--check", "360"]) == 360


@pytest.mark.parametrize(
    ("argv", "message"),
    [
        (["--check"], "run-name: --check needs an issue number, got undefined"),
        (["--check", "x"], 'run-name: --check needs an issue number, got "x"'),
        (["--check", "0"], 'run-name: --check needs an issue number, got "0"'),
        (["--resume", "Capybara"], "run-name: unknown arguments --resume Capybara"),
        (["--check", "1", "2"], "run-name: unknown arguments --check 1 2"),
    ],
)
def test_parse_args_rejects_anything_else(argv: list[str], message: str) -> None:
    with pytest.raises(run_name.UsageError) as caught:
        run_name.parse_args(argv)
    assert str(caught.value) == message


# with_issue

LISTED = issue(10, "Run: Axolotl (lessons)", "2026-09-25T08:00:00Z")
FRESH = issue(11, "Run: Badger (lessons)", "2026-09-25T08:00:05Z")


def test_with_issue_adds_an_issue_the_label_listing_has_not_shown_yet() -> None:
    assert run_name.with_issue([LISTED], FRESH) == [LISTED, FRESH]


def test_with_issue_keeps_the_list_as_it_is_when_the_issue_is_in_it() -> None:
    assert run_name.with_issue([LISTED, FRESH], FRESH) == [LISTED, FRESH]


# report and main


def fake_gh(listed: list[RunIssue], viewed: RunIssue | None = None) -> run_name.Gh:
    def gh(args: Sequence[str]) -> object:
        if args[:2] == ["issue", "list"]:
            assert run_name.RUN_LABEL in args
            return listed
        assert args[:2] == ["issue", "view"]
        return viewed

    return gh


def test_report_lists_open_runs_by_number_and_skips_other_titles() -> None:
    issues = [
        issue(12, "Run: Capybara (code)", "2026-09-25T10:00:00Z"),
        issue(10, "Run: Axolotl (lessons)", "2026-09-25T08:00:00Z"),
        issue(11, "Run: Badger (lessons)", "2026-09-25T09:00:00Z", state="CLOSED"),
        issue(13, "Not a run", "2026-09-25T11:00:00Z"),
    ]
    result = run_name.report(issues, SEQUENCE, None)
    assert list(result) == ["open", "next"]
    assert result["next"] == "Dingo"
    open_runs = cast("list[Run]", result["open"])
    assert [r["number"] for r in open_runs] == [10, 12]


def test_format_report_matches_the_javascript_json_format() -> None:
    result = run_name.report(
        [issue(513, "Run: Ocelot (harness)", "2026-09-26T08:53:16Z")], SEQUENCE, 513
    )
    assert run_name.format_report(result) == (
        "{\n"
        '  "open": [\n'
        "    {\n"
        '      "number": 513,\n'
        '      "name": "Ocelot",\n'
        '      "kind": "harness",\n'
        '      "open": true,\n'
        '      "createdAt": "2026-09-26T08:53:16Z"\n'
        "    }\n"
        "  ],\n"
        '  "next": "Panda",\n'
        '  "takenBy": null\n'
        "}\n"
    )
    assert run_name.format_report({"open": [], "next": "Axolotl"}) == (
        '{\n  "open": [],\n  "next": "Axolotl"\n}\n'
    )


def test_main_prints_the_report(capsys: pytest.CaptureFixture[str]) -> None:
    listed = [issue(10, "Run: Axolotl (lessons)", "2026-09-25T08:00:00Z")]
    assert run_name.main([], gh=fake_gh(listed)) == 0
    assert json.loads(capsys.readouterr().out) == {
        "open": [run_name.run_of(listed[0])],
        "next": "Badger",
    }


def test_main_check_merges_the_viewed_issue_and_names_the_older_rival(
    capsys: pytest.CaptureFixture[str],
) -> None:
    older = issue(10, "Run: Axolotl (lessons)", "2026-09-25T08:00:00Z")
    mine = issue(11, "Run: Axolotl (code)", "2026-09-25T08:00:05Z")
    assert run_name.main(["--check", "11"], gh=fake_gh([older], mine)) == 0
    out = json.loads(capsys.readouterr().out)
    assert out["takenBy"]["number"] == 10
    assert [r["number"] for r in out["open"]] == [10, 11]


def test_main_exits_2_with_usage_for_bad_arguments(capsys: pytest.CaptureFixture[str]) -> None:
    assert run_name.main(["--check", "x"], gh=fake_gh([])) == 2
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == (
        'run-name: --check needs an issue number, got "x"\n' + run_name.USAGE + "\n"
    )


def test_main_exits_1_for_an_issue_that_is_not_a_run(capsys: pytest.CaptureFixture[str]) -> None:
    viewed = issue(372, "Move run-name out of site/", "2026-09-25T08:00:00Z")
    assert run_name.main(["--check", "372"], gh=fake_gh([], viewed)) == 1
    assert capsys.readouterr().err == "run-name: issue #372 is not a run issue\n"


def test_main_exits_1_for_a_wrong_names_file(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    names = tmp_path / "run-names.txt"
    names.write_text("Aone\n", encoding="utf-8")
    assert run_name.main([], gh=fake_gh([]), names_file=names) == 1
    assert "not 1" in capsys.readouterr().err
    assert run_name.main([], gh=fake_gh([]), names_file=tmp_path / "missing.txt") == 1


def test_gh_json_parses_the_output(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_run(cmd: list[str], **_: object) -> subprocess.CompletedProcess[str]:
        assert cmd[:3] == ["gh", "issue", "list"]
        return subprocess.CompletedProcess(cmd, 0, stdout='[{"number": 1}]')

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert run_name.gh_json(["issue", "list"]) == [{"number": 1}]


@pytest.mark.parametrize(
    "failure",
    [
        subprocess.CalledProcessError(1, ["gh"]),
        FileNotFoundError("gh"),
    ],
)
def test_gh_json_raises_run_name_error_when_gh_fails(
    monkeypatch: pytest.MonkeyPatch, failure: Exception
) -> None:
    def fake_run(cmd: list[str], **_: object) -> subprocess.CompletedProcess[str]:
        raise failure

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(run_name.RunNameError, match="run-name: gh issue view failed"):
        run_name.gh_json(["issue", "view", "1"])


def test_gh_json_raises_run_name_error_on_output_that_is_not_json(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_run(cmd: list[str], **_: object) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(cmd, 0, stdout="not json")

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(run_name.RunNameError, match="failed"):
        run_name.gh_json(["issue", "list"])
