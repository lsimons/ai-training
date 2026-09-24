"""The fixture behind the lesson "Run a tiny agent" (concepts) matches the page.

The lesson is a foundations page (spec S03 "Foundations audience"), so it
shows the fixture's transcripts in `text` fences and carries no
`<Predict run=>` tag for `mise run examples` to check. This test runs each
scripted run and asserts that every line it prints is a line of the page,
so a change to the script, the notes or the format shows up in CI.
"""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "site/examples/concepts/agent-loop/tiny_agent.py"
PAGE = ROOT / "site/src/content/docs/concepts/agent-loop.mdx"


@pytest.fixture(scope="module")
def fixture() -> ModuleType:
    spec = importlib.util.spec_from_file_location("concepts_agent_loop_tiny_agent", FIXTURE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize("name", ["find", "count", "limit"])
def test_page_shows_every_line_of_the_transcript(fixture: ModuleType, name: str) -> None:
    text: str = fixture.transcript(name)
    page_lines = PAGE.read_text(encoding="utf-8").splitlines()
    missing = [line for line in text.splitlines() if line and line not in page_lines]
    assert missing == []


def test_page_shows_every_tool_description(fixture: ModuleType) -> None:
    page = PAGE.read_text(encoding="utf-8")
    descriptions: dict[str, str] = fixture.TOOL_DESCRIPTIONS
    for name, description in descriptions.items():
        assert name in page
        assert description in page


def test_find_run_ends_when_the_model_says_done(fixture: ModuleType) -> None:
    lines: list[str] = fixture.transcript("find").splitlines()
    assert lines[-1] == "loop: stopped, the model said it is done after 3 steps"


def test_limit_run_ends_on_the_step_limit_without_an_answer(fixture: ModuleType) -> None:
    lines: list[str] = fixture.transcript("limit").splitlines()
    assert lines[-1] == "loop: stopped, the step limit of 3 was reached, no answer"
    assert not any("done." in line for line in lines)


def test_tools_report_a_missing_path_as_a_result(fixture: ModuleType) -> None:
    assert fixture.list_dir("nowhere") == "error: nowhere is not a directory"
    assert fixture.read_file("notes") == "error: notes is not a file"


def test_loop_stops_when_the_script_runs_out(fixture: ModuleType) -> None:
    lines: list[str] = fixture.run("task", [("list_dir", "notes")], 5)
    assert lines[-1] == "loop: stopped, the script ran out"


def test_main_prints_the_named_run(fixture: ModuleType, capsys: pytest.CaptureFixture[str]) -> None:
    fixture.main(["tiny_agent.py", "limit"])
    out = capsys.readouterr().out
    assert out.startswith("task: Who confirms the delivery date?\n")
    fixture.main(["tiny_agent.py"])
    assert capsys.readouterr().out.startswith(
        "task: Which meeting note mentions the June delivery?\n"
    )
