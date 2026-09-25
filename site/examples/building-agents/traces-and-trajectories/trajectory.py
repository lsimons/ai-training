"""The complete program behind the lesson "Recording and grading the path the agent took".

Run any step with:  python3 trajectory.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

agent.py holds the tools, the traced loop and the eight runs. grade.py holds
the answer grader and the two path rules. my_rule.py is yours to edit in the
exercise.
"""

import json
import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent
import grade
import my_rule


def verdict(ok: bool) -> str:
    return "pass" if ok else "fail"


def path_verdict(failures: list) -> str:
    return "pass" if not failures else "fail " + ", ".join(failures)


def args_text(args: dict) -> str:
    return " ".join(f"{key}={value}" for key, value in args.items())


def step_outline() -> None:
    """One line per record of run r1: what the model asked for, or the tool and its arguments."""
    for record in agent.run_one("r1")["trace"]:
        if record["kind"] == "model":
            print(f"chat -> {record['asked']}")
        else:
            print(f"execute_tool {record['tool']} {args_text(record['args'])}")


def step_trace() -> None:
    """Every record of run r1, with its latency and cost, and the totals of the run."""
    run = agent.run_one("r1")
    print(f"trace {run['id']}: {run['question']}")
    for r in run["trace"]:
        if r["kind"] == "model":
            detail = f"-> {r['asked']}, {r['input_tokens']} in, {r['output_tokens']} out"
        else:
            detail = args_text(r["args"])
        print(f"  {r['span']} {r['name']}  {detail}  {r['latency_ms']} ms  ${r['cost']:.5f}")
    latency = sum(r["latency_ms"] for r in run["trace"])
    cost = sum(r["cost"] for r in run["trace"])
    print(f"  total {latency} ms, ${cost:.5f}")
    print(f"  answer: {run['answer']}")


def step_grade() -> None:
    """The answer grader and the path grader on runs r1 and r2."""
    for run_id in ["r1", "r2"]:
        run = agent.run_one(run_id)
        answer = verdict(grade.answer_passes(run))
        print(f"{run_id} answer: {answer}, path: {path_verdict(grade.path_failures(run['trace']))}")


def step_runs() -> None:
    """All eight runs: tool calls, latency, cost and both grades."""
    print("run  tools  latency   cost      answer  path")
    for run in agent.run_all():
        trace = run["trace"]
        tools = len(grade.tool_calls(trace))
        latency = sum(r["latency_ms"] for r in trace)
        cost = sum(r["cost"] for r in trace)
        answer = verdict(grade.answer_passes(run))
        path = path_verdict(grade.path_failures(trace))
        print(f"{run['id']:<4} {tools:<6} {latency:>5} ms  ${cost:.5f}  {answer:<7} {path}")


def transcript(run_id: str) -> None:
    run = agent.run_one(run_id)
    print(f"transcript {run_id}")
    print(f"  user: {run['question']}")
    for r in run["trace"]:
        if r["kind"] == "tool":
            print(f"  {r['tool']} {json.dumps(r['args'])}")
            print(f"    -> {json.dumps(r['result'])}")
    print(f"  answer: {run['answer']}")
    answer = verdict(grade.answer_passes(run))
    print(f"  graded answer: {answer}, path: {path_verdict(grade.path_failures(run['trace']))}")


def step_exercise() -> None:
    """Your rule in my_rule.py over the eight runs."""
    for run in agent.run_all():
        reasons = my_rule.expected_path(run["trace"])
        print(f"{run['id']} {'pass' if not reasons else 'fail: ' + '; '.join(reasons)}")


STEPS = {
    "outline": step_outline,
    "trace": step_trace,
    "grade": step_grade,
    "runs": step_runs,
    "show_r7": lambda: transcript("r7"),
    "show_r8": lambda: transcript("r8"),
    "exercise": step_exercise,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
