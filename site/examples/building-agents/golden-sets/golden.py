"""The complete program behind the lesson "A golden set is the agent's regression suite".

Run any step with:  python3 golden.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

`golden-set.csv` holds the golden set, one item per row:
  id, group      the item and its group: routine, ambiguous or refuse
  question       what a user asks the handbook assistant
  source         the handbook file a good answer comes from (empty for refuse)
  mentions       text a good answer contains (empty for refuse)
  may_decline    yes when "not found" is also a good answer
  held_out       yes for an item that runs at release time only
  origin         where the item came from, for an item added after a failure

The agent under test is in agent.py.
"""

import csv
import os
import sys
from pathlib import Path

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent

HERE = Path(__file__).resolve().parent
GROUPS = ["routine", "ambiguous", "refuse"]


def load_set() -> list[dict[str, str]]:
    with (HERE / "golden-set.csv").open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def passes(item: dict[str, str], result: dict) -> bool:
    """Checks the qualities the item expects, not one exact answer."""
    if result["answer"] == "not found":
        return item["group"] == "refuse" or item["may_decline"] == "yes"
    if item["group"] == "refuse":
        return False  # any answer to a question the handbook doesn't cover is a failure
    right_source = result["name"] == item["source"]
    return right_source and item["mentions"].lower() in result["answer"].lower()


def run(items: list[dict[str, str]], prompt_lines: list[str]) -> list[str]:
    """Runs every item, prints the pass count per group, and returns the failed ids."""
    failed = []
    for group in GROUPS:
        in_group = [item for item in items if item["group"] == group]
        passed = 0
        for item in in_group:
            if passes(item, agent.answer(item["question"], prompt_lines)):
                passed += 1
            else:
                failed.append(item["id"])
        print(f"{group}: {passed} of {len(in_group)}")
    return failed


def show_failed(items: list[dict[str, str]], failed: list[str], prompt_lines: list[str]) -> None:
    for item in items:
        if item["id"] in failed:
            result = agent.answer(item["question"], prompt_lines)
            print(f"failed {item['id']}: {item['question']}")
            print(f"  answer: {result['answer']}")


def step_run() -> None:
    """The run the team does after every change: the held-out items stay out."""
    items = [item for item in load_set() if item["held_out"] != "yes"]
    failed = run(items, agent.PROMPT_LINES)
    show_failed(items, failed, agent.PROMPT_LINES)


def step_changed() -> None:
    """The same run with the last line of the prompt removed."""
    items = [item for item in load_set() if item["held_out"] != "yes"]
    prompt_lines = agent.PROMPT_LINES[:-1]
    failed = run(items, prompt_lines)
    show_failed(items, failed, prompt_lines)


def step_release() -> None:
    """The run before a release: every item, and the held-out part on its own."""
    items = load_set()
    failed = run(items, agent.PROMPT_LINES)
    held_out = [item for item in items if item["held_out"] == "yes"]
    held_out_passed = sum(1 for item in held_out if item["id"] not in failed)
    print(f"held out: {held_out_passed} of {len(held_out)}")
    show_failed(items, failed, agent.PROMPT_LINES)


STEPS = {
    "run": step_run,
    "changed": step_changed,
    "release": step_release,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
