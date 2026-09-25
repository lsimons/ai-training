"""The complete program behind the lesson "Reasoning before each action".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The loop is the one from "Stopping the loop on purpose", unchanged. The
tools are new: a small shop with orders, a return policy and refunds. Two
fake models work the same tasks. model_acts replies with a tool request
only. model_reasons adds a `thought` field, one line of reasoning, to each
tool request, and `show` prints that line before the round.
"""

import sys
from typing import Callable, Optional

# The tools.

ORDERS = {
    "1042": {"item": "kettle", "days_since_delivery": 12},
    "1077": {"item": "lamp", "days_since_delivery": 45},
}

POLICY = {"returns": "Returns and refunds within 30 days of delivery."}


def get_order(order_id: str) -> dict:
    return {"ok": True, **ORDERS[order_id]}


def get_policy(topic: str) -> dict:
    return {"ok": True, "text": POLICY[topic]}


def issue_refund(order_id: str) -> dict:
    return {"ok": True, "refunded": order_id}


TOOLS = {
    "get_order": {
        "fn": get_order,
        "description": "The item and the days since delivery of one order. Args: order_id (str).",
    },
    "get_policy": {
        "fn": get_policy,
        "description": "The text of one shop policy. Args: topic (str), for example 'returns'.",
    },
    "issue_refund": {
        "fn": issue_refund,
        "description": "Refund an order in full. Args: order_id (str).",
    },
}


def rounds(messages) -> list:
    """The (request, result) pair of every tool round in the message list, in order."""
    return [
        (messages[i]["content"], messages[i + 1]["content"]) for i in range(1, len(messages) - 1, 2)
    ]


# Two fake models. Both read the order id from the question.


def order_id_in(messages) -> str:
    return messages[0]["content"].split("order ")[1].rstrip("?.")


def window_in(policy_text: str) -> int:
    """The number of days in 'within 30 days'."""
    return int(policy_text.split("within ")[1].split()[0])


def inside_window(done) -> bool:
    """True when the order from round 1 arrived inside the window from round 2."""
    order, policy = done[0][1], done[1][1]
    return order["days_since_delivery"] <= window_in(policy["text"])


def verdict(done) -> str:
    order, policy = done[0][1], done[1][1]
    days, window = order["days_since_delivery"], window_in(policy["text"])
    side = "inside" if inside_window(done) else "outside"
    return f"The {order['item']} arrived {days} days ago, {side} the {window}-day window."


def return_answer(done) -> str:
    return ("Yes. " if inside_window(done) else "No. ") + verdict(done)


def model_acts(messages):
    """Picks each tool from the words of the question, and writes no reasoning."""
    question = messages[0]["content"]
    order_id = order_id_in(messages)
    done = rounds(messages)
    if question.startswith("Refund"):
        if not done:
            return {"tool": "issue_refund", "args": {"order_id": order_id}}
        return {"answer": f"Done. Order {order_id} is refunded."}
    if len(done) == 0:
        return {"tool": "get_order", "args": {"order_id": order_id}}
    if len(done) == 1:
        return {"tool": "get_policy", "args": {"topic": "returns"}}
    return {"answer": return_answer(done)}


def model_reasons(messages):
    """Writes one line of reasoning, then the tool request that follows from it."""
    question = messages[0]["content"]
    order_id = order_id_in(messages)
    done = rounds(messages)
    if len(done) == 0:
        if question.startswith("Refund"):
            thought = (
                "A refund is allowed only inside the return window, so I check the order first."
            )
        else:
            thought = "A return depends on when the order arrived, so I look up the order."
        return {"thought": thought, "tool": "get_order", "args": {"order_id": order_id}}
    if len(done) == 1:
        days = done[0][1]["days_since_delivery"]
        thought = f"It arrived {days} days ago. I need the return window to compare."
        return {"thought": thought, "tool": "get_policy", "args": {"topic": "returns"}}
    if not question.startswith("Refund"):
        return {"answer": return_answer(done)}
    if not inside_window(done):
        return {"answer": verdict(done) + " I did not refund it."}
    if len(done) == 2:
        thought = "It is inside the window, so the refund is allowed."
        return {"thought": thought, "tool": "issue_refund", "args": {"order_id": order_id}}
    return {"answer": verdict(done) + " I refunded it."}


# The loop from "Stopping the loop on purpose", unchanged.


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
    done = rounds(messages)
    return len(done) >= 2 and done[-1] == done[-2]


def check(messages, spent: int, max_errors: int, budget: int) -> Optional[str]:
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


# Printing. The one change from "Stopping the loop on purpose" is the thought line.


def line(step: int, request: dict, result: dict) -> str:
    args = ", ".join(f"{key}={value!r}" for key, value in request["args"].items())
    return f"round {step}: {request['tool']}({args}) -> {result!r}"


def show(result: dict) -> None:
    """Prints the whole run, after run has returned."""
    print(f"user: {result['messages'][0]['content']!r}")
    for step, (request, tool_result) in enumerate(rounds(result["messages"]), 1):
        if "thought" in request:
            print(f"thought: {request['thought']}")
        print(line(step, request, tool_result))
    print(f"stop: {result['stop']}")
    if result["answer"] is not None:
        print(f"answer: {result['answer']}")


RETURN = "Can I still return order 1042?"
REFUND = "Refund order 1077."


def step_return_reasons() -> None:
    show(run(RETURN, model=model_reasons))


def step_return_acts() -> None:
    show(run(RETURN, model=model_acts))


def step_refund_acts() -> None:
    show(run(REFUND, model=model_acts))


def step_refund_reasons() -> None:
    show(run(REFUND, model=model_reasons))


def step_cost() -> None:
    """The size of the message list the loop sends back after the last round, per model."""
    for name, model in (("model_acts", model_acts), ("model_reasons", model_reasons)):
        messages = run(RETURN, model=model)["messages"]
        print(f"{name}: {len(str(messages))} characters")


STEPS = {
    "return_reasons": step_return_reasons,
    "return_acts": step_return_acts,
    "refund_acts": step_refund_acts,
    "refund_reasons": step_refund_reasons,
    "cost": step_cost,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
