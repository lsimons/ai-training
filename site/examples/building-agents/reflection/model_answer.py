"""Model answer for the exercise in "A second pass that critiques the first".

A critic with the three criteria of the model answer in "Turning good into
a rubric" (correct, asked-for actions, answer format), capped at two
rounds, on the four drafts of agent.py. Run it with:  python3 model_answer.py
Your checks may differ. Compare the round counts and the final drafts.
"""

import os
import sys
from typing import Optional

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent


def check_covered(item: dict, draft: str) -> Optional[str]:
    """Correct, second half: no answer where the passage has none."""
    if draft == agent.NOT_FOUND or item["subject"] in item["passage"].lower():
        return None
    return "Answer exactly: not found. The passage does not cover the question."


def check_asked_for(item: dict, draft: str) -> Optional[str]:
    """Asked-for actions: no ticket unless the question asks for one."""
    if "ticket" in draft and "ticket" not in item["question"]:
        return "Remove the ticket. The user did not ask for one."
    return None


def critic_rubric(item: dict, draft: str) -> list[str]:
    requests = []
    checks = (agent.check_numbers, check_covered, check_asked_for, agent.check_quote)
    for check in checks:
        request = check(item, draft)
        if request is not None:
            requests.append(request)
    return requests


if __name__ == "__main__":
    agent.show_table(critic_rubric, max_rounds=2)
