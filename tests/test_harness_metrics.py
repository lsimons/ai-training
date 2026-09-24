"""Tests for scripts/harness_metrics.py, on the fixture transcripts in
tests/fixtures/harness-transcripts/: s1 is a session with a builder
subagent, and s0 is an older transcript without `origin` fields.
"""

import json
import pathlib
from typing import cast

import pytest

import harness_metrics

FIXTURES = pathlib.Path(__file__).resolve().parent / "fixtures" / "harness-transcripts"


def collect(since: str = "") -> dict[str, object]:
    return harness_metrics.collect([("laptop-a", FIXTURES)], since)


def section(data: dict[str, object], key: str) -> dict[str, object]:
    return cast("dict[str, object]", data[key])


def sessions(data: dict[str, object]) -> dict[str, dict[str, object]]:
    rows = cast("list[dict[str, object]]", data["sessions"])
    return {str(row["session"]): row for row in rows}


def test_discover_finds_main_sessions_and_subagents_with_their_roles() -> None:
    found = harness_metrics.discover("laptop-a", FIXTURES)
    assert [(t.session, t.role, t.subagent) for t in found] == [
        ("s0", "main", False),
        ("s1", "main", False),
        ("s0", "subagent", True),
        ("s1", "builder", True),
    ]


def test_usage_counts_once_per_message_id() -> None:
    data = collect("2026-09-24")
    s1 = sessions(data)["s1"]
    # m1 is two lines with the same id and usage, so it counts once: three
    # messages of 1112 tokens each, and the synthetic one has none.
    assert s1["main_tokens"] == 3 * 1112
    assert s1["sub_tokens"] == 556
    assert section(data, "totals")["total"] == 3 * 1112 + 556


def test_since_drops_older_records_and_sessions() -> None:
    data = collect("2026-09-24")
    assert set(sessions(data)) == {"s1"}
    assert list(section(data, "by_day")) == ["2026-09-24", "2026-09-25"]
    everything = collect()
    assert set(sessions(everything)) == {"s0", "s1"}


def test_tokens_by_model_role_and_day() -> None:
    data = collect("2026-09-24")
    by_model = cast("dict[str, dict[str, int]]", data["by_model"])
    assert by_model["claude-opus-5-5"]["turns"] == 3
    assert by_model["claude-fable-5-1"]["total"] == 1112
    assert "<synthetic>" not in by_model
    by_role = cast("dict[str, dict[str, int]]", data["by_role"])
    assert by_role["main"]["transcripts"] == 1
    assert by_role["main"]["turns"] == 4
    assert by_role["builder"] == {
        "transcripts": 1,
        "turns": 1,
        "input": 1,
        "output": 50,
        "cache_write": 5,
        "cache_read": 500,
        "total": 556,
    }
    by_day = cast("dict[str, dict[str, int]]", data["by_day"])
    assert by_day["2026-09-24"]["subagents"] == 1
    assert by_day["2026-09-24"]["human"] == 2


def test_tools_bash_commands_sleep_and_chimes() -> None:
    data = collect("2026-09-24")
    assert data["tools"] == {"Bash": 4, "Read": 2}
    assert data["bash_top"] == {"git status": 1, "gh pr": 1, "afplay": 1, "mise run": 1}
    assert data["sleep"] == {"calls": 2, "total_hours": round(150 / 3600, 2), "max_seconds": 120.0}
    assert data["chimes"] == 1
    assert data["most_read"] == {"/repo/AGENTS.md": 2}


def test_human_messages_interruptions_and_waits() -> None:
    human = section(collect("2026-09-24"), "human")
    # The task notification is not human. The wait before "merge it" is the
    # ten minutes since the last assistant message.
    assert human["messages"] == 2
    assert human["interruptions"] == 1
    assert human["waits"] == 1
    assert human["wait_median_minutes"] == 10.0


def test_old_transcripts_without_origin_count_typed_text_only() -> None:
    s0 = sessions(collect())["s0"]
    assert s0["human"] == 1
    assert s0["subagents"] == 1


def test_largest_tool_results_name_the_tool_and_file() -> None:
    largest = cast("list[dict[str, object]]", collect("2026-09-24")["largest_results"])
    assert [(r["chars"], r["tool"], r["label"]) for r in largest] == [
        (2000, "Read", "/repo/AGENTS.md"),
        (500, "Bash", "git status && sleep 30"),
        (6, "Bash", "AI_TRAINING_ROLE=wave-lead gh pr merge 12 --rebase; sleep 2m"),
        (2, "Bash", "mise run fast"),
    ]


@pytest.mark.parametrize(
    ("command", "key"),
    [
        ("git -C x status", "git"),
        ("git push --force-with-lease", "git push"),
        ("FOO=1 BAR=2 mise run ci", "mise run"),
        ("/usr/bin/python3 -c 'x'", "python3"),
        ("cd site && bunx vitest", "cd"),
        ("ls -la | head", "ls"),
        ("   ", "(empty)"),
    ],
)
def test_bash_key(command: str, key: str) -> None:
    assert harness_metrics.bash_key(command) == key


def test_sleep_seconds_reads_units_and_ignores_other_words() -> None:
    assert harness_metrics.sleep_seconds("sleep 5; sleep 1.5m && (sleep 1h)") == [5, 90, 3600]
    assert harness_metrics.sleep_seconds("echo nosleep 5; sleepy 3; sleep $n") == []


def test_read_config_labels_and_comments(tmp_path: pathlib.Path) -> None:
    text = f"# this machine\nmain={tmp_path}\n\n{tmp_path}/b  # synced\n"
    assert harness_metrics.read_config(text) == [
        ("main", tmp_path),
        ("source-2", tmp_path / "b"),
    ]
    assert harness_metrics.parse_source("~/x", 1)[1] == pathlib.Path("~/x").expanduser()
    assert harness_metrics.parse_source("/a=b/c", 3) == ("source-3", pathlib.Path("/a=b/c"))


def test_tool_label() -> None:
    assert harness_metrics.tool_label("Grep", {"pattern": "foo"}) == "foo"
    assert harness_metrics.tool_label("Agent", {"description": "Build #12"}) == "Build #12"
    assert harness_metrics.tool_label("Bash", {}) == ""


def test_markdown_prints_every_table() -> None:
    text = harness_metrics.markdown(collect("2026-09-24"))
    for heading in (
        "## Totals",
        "## Sessions",
        "## By day (UTC)",
        "## By model",
        "## By role",
        "## Tool calls",
        "## Top Bash commands",
        "## Most-read files",
        "## Largest tool results",
    ):
        assert heading in text
    assert "| laptop-a | s1 | 2026-09-24T10:00 |" in text
    assert "sleep 2 calls" in text


def test_main_writes_json_and_prints_markdown(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    config = tmp_path / "dirs"
    config.write_text(f"laptop-a={FIXTURES}\n", encoding="utf-8")
    out = tmp_path / "metrics.json"
    code = harness_metrics.main(
        ["--config", str(config), "--since", "2026-09-24", "--json", str(out)]
    )
    assert code == 0
    assert "## Totals" in capsys.readouterr().out
    data = cast("dict[str, object]", json.loads(out.read_text(encoding="utf-8")))
    assert data["since"] == "2026-09-24"
    assert data["sources"] == [{"label": "laptop-a", "path": str(FIXTURES)}]


@pytest.mark.parametrize(
    ("argv", "message"),
    [
        ([], "name a transcript directory or --config"),
        (["--config", "/nonexistent/dirs"], "no config at"),
        (["/nonexistent/dir"], "not a directory"),
        ([str(FIXTURES), "--since", "24-09-2026"], "--since needs YYYY-MM-DD"),
    ],
)
def test_main_rejects_bad_input(
    argv: list[str], message: str, capsys: pytest.CaptureFixture[str]
) -> None:
    assert harness_metrics.main(argv) == 2
    assert message in capsys.readouterr().err
