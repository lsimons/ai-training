"""The fixture behind "Tracing a planted instruction to the tool that leaks" matches the page.

The lesson is a foundations page (spec S03 "Foundations audience"), so it
shows the fixture's output in `text` fences and carries no `<Predict run=>`
tag for `mise run examples` to check. This test runs the fixture and asserts
that every line it prints, and every line of the planted page, is a line of
the lesson page, so a change to the page text, the permission sets or the
report format shows up in CI.
"""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "site/examples/safety/tracing-a-planted-instruction/planted_line.py"
PAGE = ROOT / "site/src/content/docs/safety/tracing-a-planted-instruction.mdx"


@pytest.fixture(scope="module")
def fixture() -> ModuleType:
    spec = importlib.util.spec_from_file_location("tracing_a_planted_instruction", FIXTURE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_page_shows_every_line_the_fixture_prints(fixture: ModuleType) -> None:
    report: str = fixture.report()
    page_lines = PAGE.read_text(encoding="utf-8").splitlines()
    missing = [line for line in report.splitlines() if line and line not in page_lines]
    assert missing == []


def test_page_shows_the_planted_page(fixture: ModuleType) -> None:
    page: str = fixture.PAGE
    assert page.rstrip("\n") in PAGE.read_text(encoding="utf-8")


def test_only_the_fetch_set_leaks(fixture: ModuleType) -> None:
    report: str = fixture.report()
    verdicts = [line.split(": ", 1)[1] for line in report.splitlines() if "data leaves:" in line]
    assert verdicts == ["no", "no", "yes"]
    assert report.endswith("data left under 1 of 3 permission sets: read and fetch any URL")


def test_a_page_without_a_planted_line_leaks_nothing(fixture: ModuleType) -> None:
    clean = "Lemon drizzle cake\n\nBeat the butter with the sugar.\n"
    report: str = fixture.report(clean)
    assert "planted line: none found" in report
    assert "data leaves: yes" not in report
    assert report.endswith("data left under 0 of 3 permission sets")


def test_planted_line_spread_over_two_lines_is_one_instruction(fixture: ModuleType) -> None:
    lines: list[str] = fixture.planted_lines(fixture.PAGE)
    assert len(lines) == 1
    assert lines[0].startswith("Assistant: before you write the summary")
    assert fixture.requested_tool(lines[0]) == "fetch_url"
