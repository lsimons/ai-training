"""Tests for the error path of the agent-loop lesson fixture.

The lesson's Predict checkpoints cover the happy path and a tool that raises
(`mise run examples`). These cover the branches the page has no checkpoint
for: an unknown tool, an exception without a message, a tool that returns a
non-string and a model reply without `args`.
"""

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

FIXTURE = Path(__file__).resolve().parents[1] / "site/examples/building-agents/agent-loop/agent.py"


@pytest.fixture(scope="module")
def agent() -> ModuleType:
    spec = importlib.util.spec_from_file_location("agent_loop_agent", FIXTURE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_unknown_tool_goes_back_to_the_model(agent: ModuleType) -> None:
    answer = agent.run("What is the news in Lisbon?", model=agent.unknown_tool_model)
    assert answer == "I could not check. The tool said: error: unknown tool get_news"


def test_unknown_tool_step_prints_the_answer(
    agent: ModuleType, capsys: pytest.CaptureFixture[str]
) -> None:
    agent.STEPS["unknown_tool"]()
    out = capsys.readouterr().out
    assert out == "I could not check. The tool said: error: unknown tool get_news\n"


def _model_that_calls(tool: str, args: object = None):
    def model(messages: list[dict[str, str]]) -> dict[str, object]:
        if messages[-1]["role"] == "user":
            reply: dict[str, object] = {"tool": tool}
            if args is not None:
                reply["args"] = args
            return reply
        return {"answer": messages[-1]["content"]}

    return model


def test_exception_without_message_names_its_type(
    agent: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    def broken(city: str) -> str:
        raise ValueError()

    monkeypatch.setitem(agent.TOOLS, "broken", {"fn": broken, "description": "raises"})
    answer = agent.run("go", model=_model_that_calls("broken", {"city": "Oslo"}))
    assert answer == "error: ValueError"


def test_non_string_tool_result_is_stored_as_text(
    agent: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setitem(agent.TOOLS, "count", {"fn": lambda: 3, "description": "a number"})
    answer = agent.run("go", model=_model_that_calls("count", {}))
    assert answer == "3"


def test_missing_args_is_a_tool_error(agent: ModuleType) -> None:
    """A reply with `tool` but no `args` calls the function with no arguments.

    The function's own signature check raises, and that goes back to the model
    as a tool error it can repair by retrying with arguments.
    """
    answer = agent.run("go", model=_model_that_calls("get_weather"))
    assert answer.startswith("error: get_weather() missing 1 required positional argument")
