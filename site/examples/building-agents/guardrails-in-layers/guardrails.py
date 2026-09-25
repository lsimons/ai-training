"""The complete program behind the lesson "Guardrails in layers".

Run any step with:  python3 guardrails.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

agent.py holds the shop's data, the eight tools, the fake model, the loop and
its layers, and the four runs a to d.
"""

import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent


def outbound(run_id: str) -> None:
    """One line per call that tried to send: the tool, where to, and what the layers did."""
    for send in agent.run_one(run_id)["sends"]:
        print(f"{send['tool']} {send['to']}: {', '.join(send['events'])}")


def step_trace() -> None:
    """Every record of run d, the model calls, the tool calls and the layers that acted."""
    run = agent.run_one("d")
    print(f"trace {run['id']}: {agent.RUNS['d']['title']}")
    for r in run["trace"]:
        print(f"  {r['span']} {r['name']}  {r['detail']}")
    print(f"  answer: {run['answer']}")


def step_reply() -> None:
    """The reply that run c posted on ticket 1188, after the filter."""
    send = next(s for s in agent.run_one("c")["sends"] if s["tool"] == "post_reply")
    print(f"{send['to']}:")
    print(send["text"])


def step_alerts() -> None:
    """A monitor over the four runs: it raises an alert for every record a layer wrote."""
    for run_id in agent.RUNS:
        guards = [r["detail"] for r in agent.run_one(run_id)["trace"] if r["kind"] == "guard"]
        alerts = [g for g in guards if not g.startswith("approved")]
        print(f"run {run_id}: {'; '.join(alerts) if alerts else 'no alert'}")


STEPS = {
    "prompt_only": lambda: outbound("a"),
    "permissions": lambda: outbound("b"),
    "output_filter": lambda: outbound("c"),
    "approval": lambda: outbound("d"),
    "trace": step_trace,
    "reply": step_reply,
    "alerts": step_alerts,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
