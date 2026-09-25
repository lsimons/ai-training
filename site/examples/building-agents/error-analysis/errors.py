"""The complete program behind the lesson "Reading failures one by one".

Run a step with:  python3 errors.py <step>
  week1        list the failed runs of week 1
  week2        list the failed runs of week 2, for the exercise
  show <id>    print the full transcript of one run, for example: python3 errors.py show a03

agent.py holds the tools, the loop and the scripted runs of both weeks.
"""

import json
import os
import sys

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent


def day_text(day) -> str:
    return f"{day.strftime('%A')} {day.day} {day.strftime('%B')}"


def list_failures(week: int) -> None:
    runs = agent.week_runs(week)
    failed = [r for r in runs if not r["passed"]]
    first, last = runs[0]["day"], runs[-1]["day"]
    print(
        f"week {week}, {first.day} {first.strftime('%B')} to {last.day} {last.strftime('%B')}: "
        f"{len(runs)} runs, {len(runs) - len(failed)} passed, {len(failed)} failed"
    )
    for r in failed:
        print(f"{r['id']} {r['day'].strftime('%a')}  {r['question']}")
        print(f"    answer: {r['answer']}")


def show(run_id: str) -> None:
    r = agent.find_run(run_id)
    if r is None:
        print(f"no run {run_id}")
        return
    print(f"transcript {r['id']}, {day_text(r['day'])}")
    print(f"  user: {r['question']}")
    for step in r["steps"]:
        print(f"  {step['tool']} {json.dumps(step['args'])}")
        print(f"    -> {json.dumps(step['result'])}")
    last = r["last_reply"]
    if "tool" in last and last.get("text"):
        request = f"{last['tool']} {json.dumps(last['args'])}"
        print(f"  model reply: text {json.dumps(last['text'])} and a request for {request}")
        print("    -> the loop ended the run on the text")
    print(f"  answer: {r['answer']}")
    grade = "pass" if r["passed"] else "fail"
    print(f'  graded: {grade}, a correct answer contains "{r["expected"]}"')


STEPS = {
    "week1": lambda: list_failures(1),
    "week2": lambda: list_failures(2),
}

if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == "show":
        show(args[1])
    elif len(args) == 1 and args[0] in STEPS:
        STEPS[args[0]]()
    else:
        print(__doc__)
        sys.exit(2)
