"""The cost table behind the lesson "Plan everything first or react step by step".

Run it with:  python3 costs.py

It counts the model calls and tool calls that five ways of running a task
of twelve tool steps make, and adds up the time when every call runs one
after the other. No model is called. The seconds per call are
assumptions written by hand, so the times show how the patterns compare
and not how fast a real model is. Change MODEL_SECONDS, TOOL_SECONDS or
STEPS and run it again.
"""

STEPS = 12
PHASES = 3
MODEL_SECONDS = 3
TOOL_SECONDS = 1


def plan_then_execute(steps: int) -> dict[str, int]:
    # One model call writes the whole plan, and code runs its steps.
    return {"model": 1, "tool": steps}


def plan_and_check(steps: int) -> dict[str, int]:
    # The plan, then one model call after each step to keep or change it.
    return {"model": 1 + steps, "tool": steps}


def reactive(steps: int) -> dict[str, int]:
    # One model call picks each step, and one more writes the answer.
    return {"model": steps + 1, "tool": steps}


def coarse_plan(steps: int) -> dict[str, int]:
    # One call writes a plan of phases. Inside a phase the model picks
    # each step, and one call at the end of each phase checks the plan.
    return {"model": 1 + steps + PHASES, "tool": steps}


def reactive_with_critic(steps: int) -> dict[str, int]:
    # The reactive loop, and a critic call that reads each step's result.
    return {"model": steps + 1 + steps, "tool": steps}


PATTERNS: list[tuple[str, dict[str, int]]] = [
    ("plan then execute", plan_then_execute(STEPS)),
    ("plan, check after each step", plan_and_check(STEPS)),
    ("reactive", reactive(STEPS)),
    (f"coarse plan of {PHASES} phases", coarse_plan(STEPS)),
    ("reactive with a critic", reactive_with_critic(STEPS)),
]


def seconds(calls: dict[str, int]) -> int:
    return calls["model"] * MODEL_SECONDS + calls["tool"] * TOOL_SECONDS


def main() -> None:
    print(f"{STEPS} tool steps, {MODEL_SECONDS} s per model call, {TOOL_SECONDS} s per tool call")
    width = max(len(name) for name, _ in PATTERNS)
    print(f"{'pattern'.ljust(width)}  model  tool  seconds")
    for name, calls in PATTERNS:
        print(f"{name.ljust(width)}  {calls['model']:>5}  {calls['tool']:>4}  {seconds(calls):>7}")


if __name__ == "__main__":
    main()
