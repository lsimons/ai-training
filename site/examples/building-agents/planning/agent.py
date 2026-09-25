"""The complete program behind the lesson "Writing the plan before taking the steps".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The tools belong to the small shop from "Reasoning before each action",
with three new ones: check_stock, send_replacement and email_customer.
The fake model writes a numbered plan for a goal before any tool runs.
`follow` runs the plan as written. `work` runs one step at a time and,
after each step, gives the plan and the results back to the model, which
may change the steps still to come.
"""

import sys
from typing import Optional

# The tools.

ORDERS = {
    "1042": {"item": "kettle", "days_since_delivery": 12},
    "1090": {"item": "toaster", "days_since_delivery": 8},
}

POLICY = {"returns": "Returns and refunds within 30 days of delivery."}

STOCK = {
    "kettle": {"in_stock": 0, "restock_days": 21},
    "toaster": {"in_stock": 6, "recalled": True},
}


def get_order(order_id: str) -> dict:
    return {"ok": True, **ORDERS[order_id]}


def get_policy(topic: str) -> dict:
    return {"ok": True, "text": POLICY[topic]}


def check_stock(item: str) -> dict:
    return {"ok": True, "item": item, **STOCK[item]}


def send_replacement(order_id: str) -> dict:
    """Books a replacement. An item that is out of stock goes on back order."""
    item = ORDERS[order_id]["item"]
    status = "shipped" if STOCK[item]["in_stock"] > 0 else "backordered"
    return {"ok": True, "replacement_for": order_id, "status": status}


def issue_refund(order_id: str) -> dict:
    return {"ok": True, "refunded": order_id}


def email_customer(order_id: str, message: str) -> dict:
    return {"ok": True, "sent_to": f"customer of {order_id}"}


TOOLS = {
    "get_order": get_order,
    "get_policy": get_policy,
    "check_stock": check_stock,
    "send_replacement": send_replacement,
    "issue_refund": issue_refund,
    "email_customer": email_customer,
}


# A plan is a list of steps. Each step says what it does, in words a person
# can read, and which tool call does it.


def make_step(text: str, tool: str, **args) -> dict:
    return {"text": text, "tool": tool, "args": args}


def order_id_in(goal: str) -> str:
    return goal.split("order ")[1].rstrip(".")


def write_plan(goal: str) -> list:
    """The fake model's first reply: the whole plan, before any tool runs."""
    order_id = order_id_in(goal)
    item = ORDERS[order_id]["item"]
    return [
        make_step(f"Look up order {order_id}", "get_order", order_id=order_id),
        make_step("Read the returns policy", "get_policy", topic="returns"),
        make_step(f"Check that a {item} is in stock", "check_stock", item=item),
        make_step(f"Send a replacement {item}", "send_replacement", order_id=order_id),
        make_step(
            f"Email the customer that a new {item} has shipped",
            "email_customer",
            order_id=order_id,
            message=f"Your new {item} has shipped.",
        ),
    ]


def revise_plan(plan: list, results: list) -> Optional[list]:
    """The fake model's reply after each step: a new plan, or None to keep this one.

    `results` holds the result of every step that has run, in order. The
    steps that have run stay as they are, and only the rest may change.
    """
    latest = results[-1]
    if "in_stock" in latest and latest["in_stock"] == 0:
        order_id = plan[0]["args"]["order_id"]
        item, days = latest["item"], latest["restock_days"]
        return [
            *plan[: len(results)],
            make_step(f"Refund order {order_id}", "issue_refund", order_id=order_id),
            make_step(
                f"Email the customer that the {item} is refunded",
                "email_customer",
                order_id=order_id,
                message=f"The {item} is out of stock for {days} days, so we refunded you.",
            ),
        ]
    return None


# Printing.


def call(s: dict) -> str:
    args = ", ".join(f"{key}={value!r}" for key, value in s["args"].items())
    return f"{s['tool']}({args})"


def show_plan(plan: list, done: int, version: int) -> None:
    print(f"plan v{version}:")
    for number, s in enumerate(plan, 1):
        mark = "x" if number <= done else " "
        print(f"  {number}. [{mark}] {s['text']}")


def show_step(number: int, s: dict, result: dict) -> None:
    print(f"step {number}: {call(s)} -> {result!r}")


# Two ways to run a plan.


def follow(goal: str, quiet: bool = False) -> dict:
    """Runs every step of the first plan, in order. One model call in all."""
    plan = write_plan(goal)
    calls = 1
    results: list = []
    for number, s in enumerate(plan, 1):
        result = TOOLS[s["tool"]](**s["args"])
        results.append(result)
        if not quiet:
            show_step(number, s, result)
    return {"plan": plan, "results": results, "calls": calls, "version": 1}


def work(goal: str, reviser=revise_plan, quiet: bool = False) -> dict:
    """Runs one step at a time and gives the model the plan back after each one."""
    plan = write_plan(goal)
    calls = 1
    version = 1
    results: list = []
    while len(results) < len(plan):
        number = len(results) + 1
        s = plan[number - 1]
        result = TOOLS[s["tool"]](**s["args"])
        results.append(result)
        if not quiet:
            show_step(number, s, result)
        new_plan = reviser(plan, results)
        calls += 1
        if new_plan is not None:
            plan = new_plan
            version += 1
            if not quiet:
                print(f"revised after step {number}")
                show_plan(plan, len(results), version)
    return {"plan": plan, "results": results, "calls": calls, "version": version}


def show_end(run: dict) -> None:
    show_plan(run["plan"], len(run["results"]), run["version"])
    print(f"model calls: {run['calls']}")


KETTLE = "Replace the broken kettle from order 1042."
TOASTER = "Replace the broken toaster from order 1090."


def step_plan() -> None:
    print(f"goal: {KETTLE}")
    show_plan(write_plan(KETTLE), 0, 1)


def step_progress() -> None:
    """The first plan with the first two steps run, as `work` sees it then."""
    plan = write_plan(KETTLE)
    for number, s in enumerate(plan[:2], 1):
        show_step(number, s, TOOLS[s["tool"]](**s["args"]))
    show_plan(plan, 2, 1)


def show_revision(goal: str, reviser=revise_plan) -> None:
    """Runs the first three steps, then prints the plan before and after the model revisits it."""
    plan = write_plan(goal)
    results = [TOOLS[s["tool"]](**s["args"]) for s in plan[:3]]
    print("before:")
    show_plan(plan, 3, 1)
    print(f"step 3 returned: {results[-1]!r}")
    new_plan = reviser(plan, results)
    print("after:")
    if new_plan is None:
        print("  the model kept plan v1")
    else:
        show_plan(new_plan, 3, 2)


def step_follow() -> None:
    show_end(follow(KETTLE))


def step_revise() -> None:
    show_revision(KETTLE)


def step_revise_only() -> None:
    """Runs the first three steps and prints only the plan the model returns."""
    plan = write_plan(KETTLE)
    results = [TOOLS[s["tool"]](**s["args"]) for s in plan[:3]]
    new_plan = revise_plan(plan, results)
    if new_plan is not None:
        show_plan(new_plan, 3, 2)


def step_cost() -> None:
    """Model calls and tool calls for the kettle goal, per way of running the plan."""
    for name, run in (("follow", follow(KETTLE, quiet=True)), ("work", work(KETTLE, quiet=True))):
        calls, tools = run["calls"], len(run["results"])
        print(f"{name}: {calls} model call{'' if calls == 1 else 's'}, {tools} tool calls")


def step_exercise() -> None:
    """The toaster goal, with this file's reviser."""
    show_revision(TOASTER)


STEPS = {
    "plan": step_plan,
    "progress": step_progress,
    "follow": step_follow,
    "revise_only": step_revise_only,
    "revise": step_revise,
    "cost": step_cost,
    "exercise": step_exercise,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
