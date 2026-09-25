"""One answer to the exercise of "Writing the plan before taking the steps".

Run it with:  python3 model_answer.py

The reviser keeps the rule of agent.py for an item that is out of stock,
and adds one for a recalled item: a replacement of the same model would
send the customer another recalled toaster, so the rest of the plan
becomes a refund and an email that names the recall.
"""

import os
import sys
from typing import Optional

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agent


def revise_plan(plan: list, results: list) -> Optional[list]:
    latest = results[-1]
    if latest.get("recalled"):
        order_id = plan[0]["args"]["order_id"]
        item = latest["item"]
        return [
            *plan[: len(results)],
            agent.make_step(f"Refund order {order_id}", "issue_refund", order_id=order_id),
            agent.make_step(
                f"Email the customer that the {item} is recalled and refunded",
                "email_customer",
                order_id=order_id,
                message=f"This {item} model is recalled, so we refunded you. Please stop using it.",
            ),
        ]
    return agent.revise_plan(plan, results)


if __name__ == "__main__":
    agent.show_revision(agent.TOASTER, reviser=revise_plan)
    print()
    agent.show_revision(agent.KETTLE, reviser=revise_plan)
