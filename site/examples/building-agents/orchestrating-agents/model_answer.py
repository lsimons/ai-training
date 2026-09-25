"""One answer to the exercise of "Orchestration in code or by a model".

It adds the check at the manager boundary and runs both faults with the
guarded loop. A reply with no worker calls and no answer text is an empty
plan, and the loop stops before it sends anything. A further boundary to
check is the writer's result: the loop could stop when the draft does not
name the order it is about, which catches a reply built from an error.
"""

import os
import sys
from typing import Optional

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent


def stop_on_empty_plan(reply: dict) -> Optional[str]:
    if not reply.get("calls") and not reply.get("answer"):
        return "the manager returned an empty plan"
    return None


if __name__ == "__main__":
    agent.stop_on_empty_plan = stop_on_empty_plan
    agent.STEPS["exercise"]()
