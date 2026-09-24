"""The fixture behind the lesson "What every token costs" matches the page.

The lesson is a foundations page (spec S03 "Foundations audience"), so it
shows the fixture's output in `text` fences and carries no `<Predict run=>`
tag for `mise run examples` to check. This test runs the fixture and
asserts that every line it prints is a line of the page, so a change to the
prompts, the prices or the format shows up in CI.
"""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "site/examples/concepts/what-tokens-cost/price_prompts.py"
PAGE = ROOT / "site/src/content/docs/concepts/what-tokens-cost.mdx"


@pytest.fixture(scope="module")
def fixture() -> ModuleType:
    spec = importlib.util.spec_from_file_location("what_tokens_cost_price_prompts", FIXTURE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_page_shows_every_line_the_fixture_prints(fixture: ModuleType) -> None:
    report: str = fixture.report(
        {"short prompt": fixture.SHORT_PROMPT, "long prompt": fixture.LONG_PROMPT}
    )
    page_lines = PAGE.read_text(encoding="utf-8").splitlines()
    missing = [line for line in report.splitlines() if line and line not in page_lines]
    assert missing == []


def test_page_shows_the_short_prompt(fixture: ModuleType) -> None:
    short: str = fixture.SHORT_PROMPT
    assert short.rstrip("\n") in PAGE.read_text(encoding="utf-8")


def test_page_shows_the_example_prices(fixture: ModuleType) -> None:
    page = PAGE.read_text(encoding="utf-8")
    prices: dict[str, tuple[float, float]] = fixture.PRICES
    for model, (input_price, output_price) in prices.items():
        assert f"| A {model}" in page
        assert f"${input_price:g}" in page
        assert f"${output_price:g}" in page


def test_main_reads_a_file(
    fixture: ModuleType, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    prompt = tmp_path / "prompt.txt"
    prompt.write_text("Summarize this.\n", encoding="utf-8")
    fixture.main(["price_prompts.py", str(prompt)])
    out = capsys.readouterr().out
    assert out.startswith("your prompt: 5 tokens (estimate)\n")
    assert "difference" not in out
