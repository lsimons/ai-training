"""The complete program behind the lesson "Stopping the loop on purpose".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The loop is the one from "When a tool fails", with the harness checks
gathered in one function that names the stop rule that fired, a repeated
round check, and a progress callback that runs while the loop is running.
"""

import sys
from typing import Callable, Optional

# The tools. Both work every time, so the error budget never moves.


def read_file(path: str) -> dict:
    return {"ok": True, "text": f"contents of {path}"}


def apply_fix(change: str) -> dict:
    """Applies a change and runs the tests. In this fixture the test never passes."""
    return {"ok": True, "tests": "1 failed: test_total"}


TOOLS = {
    "read_file": {
        "fn": read_file,
        "description": "The text of one file in the project. Args: path (str).",
    },
    "apply_fix": {
        "fn": apply_fix,
        "description": "Apply a change to the code and run the tests. Args: change (str).",
    },
}


def rounds(messages) -> list:
    """The (request, result) pair of every tool round in the message list, in order."""
    return [
        (messages[i]["content"], messages[i + 1]["content"]) for i in range(1, len(messages) - 1, 2)
    ]


# Three fake models that never answer.


def model_never_answers(messages):
    """Always finds one more file to read."""
    n = len(rounds(messages)) + 1
    return {"tool": "read_file", "args": {"path": f"notes/{n}.md"}}


def model_retries_forever(messages):
    """Asks for the same fix every round, whatever the tests said."""
    return {"tool": "apply_fix", "args": {"change": "round the total"}}


def model_alternates(messages):
    """Tries one fix, then the other, then the first again."""
    done = rounds(messages)
    if done and done[-1][0]["args"]["change"] == "round the total":
        return {"tool": "apply_fix", "args": {"change": "truncate the total"}}
    return {"tool": "apply_fix", "args": {"change": "round the total"}}


# The harness checks. Each reads the message list after the round was appended.


def is_error(result) -> bool:
    return isinstance(result, dict) and result.get("ok") is False


def errors_in_a_row(messages) -> int:
    count = 0
    for _, result in reversed(rounds(messages)):
        if not is_error(result):
            break
        count += 1
    return count


def repeated(messages) -> bool:
    """True when the last round asked the same thing and got the same result as the round before."""
    done = rounds(messages)
    return len(done) >= 2 and done[-1] == done[-2]


def check(messages, spent: int, max_errors: int, budget: int) -> Optional[str]:
    """The stop rule that fired after this round, or None to go on."""
    if errors_in_a_row(messages) >= max_errors:
        return "too_many_errors"
    if repeated(messages):
        return "repeated_state"
    if spent > budget:
        return "budget_spent"
    return None


def outcome(stop: str, answer, messages) -> dict:
    return {"stop": stop, "answer": answer, "messages": messages}


def run(
    question: str,
    model,
    tools=TOOLS,
    max_steps: int = 4,
    max_errors: int = 2,
    budget: int = 5000,
    progress: Optional[Callable[[int, dict, dict], None]] = None,
) -> dict:
    messages: list = [{"role": "user", "content": question}]
    spent = 0
    try:
        for step in range(1, max_steps + 1):
            reply = model(messages)
            if "answer" in reply:
                return outcome("end_turn", reply["answer"], messages)
            tool = tools[reply["tool"]]
            result = tool["fn"](**reply["args"])
            messages.append({"role": "assistant", "content": reply})
            messages.append({"role": "tool", "content": result, "is_error": is_error(result)})
            if progress is not None:
                progress(step, reply, result)
            spent += len(str(messages))
            reason = check(messages, spent, max_errors, budget)
            if reason is not None:
                return outcome(reason, None, messages)
    except KeyboardInterrupt:
        return outcome("interrupted", None, messages)
    return outcome("max_steps", None, messages)


# Printing.


def line(step: int, request: dict, result: dict) -> str:
    args = ", ".join(f"{key}={value!r}" for key, value in request["args"].items())
    return f"round {step}: {request['tool']}({args}) -> {result!r}"


def show(result: dict) -> None:
    """Prints the whole run, after run has returned."""
    print(f"user: {result['messages'][0]['content']!r}")
    for step, (request, tool_result) in enumerate(rounds(result["messages"]), 1):
        print(line(step, request, tool_result))
    print(f"stop: {result['stop']}")
    if result["answer"] is not None:
        print(f"answer: {result['answer']}")


def print_round(step: int, request: dict, result: dict) -> None:
    """Prints one line per round while the loop runs."""
    print(line(step, request, result), flush=True)


def watch_and_stop(step: int, request: dict, result: dict) -> None:
    """Stands in for a person who reads the progress lines and presses Ctrl-C after round 2."""
    print_round(step, request, result)
    if step == 2:
        raise KeyboardInterrupt


def step_never_answers() -> None:
    show(run("Summarize the notes.", model=model_never_answers))


def step_retries() -> None:
    show(run("Make the failing test pass.", model=model_retries_forever))


def step_alternates() -> None:
    show(run("Make the failing test pass.", model=model_alternates))


def step_interrupted() -> None:
    result = run("Summarize the notes.", model=model_never_answers, progress=watch_and_stop)
    print(f"stop: {result['stop']}")


STEPS = {
    "never_answers": step_never_answers,
    "retries": step_retries,
    "alternates": step_alternates,
    "interrupted": step_interrupted,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
