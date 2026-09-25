"""The complete program behind the lesson "Orchestration in code or by a model".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

One customer message about the kettle from order 1042 is handled in two
arrangements. In the pipeline, the program runs three fake agents in a
fixed order: lookup, writer, checker. In the manager arrangement, a fake
manager model delegates to two workers, lookup and writer, which it calls
as tools, and the loop around the manager runs whatever it asks for. The
fault steps replace the manager or a worker with one that fails, and the
guarded loop checks each boundary and stops with a report.
"""

import sys
from typing import Callable, Optional

ORDERS = {"1042": {"item": "kettle", "days_since_delivery": 12}}

MESSAGE = (
    "My kettle from order 1042 stopped working. "
    "Please send the replacement to my office address this time."
)


def order_id_in(message: str) -> str:
    return message.split("order ")[1].split()[0]


# The three agents. Each one is a fake model call: text in, text out.


def lookup(message: str) -> str:
    """Reads the customer's message, looks up the order and writes a one-line brief."""
    order_id = order_id_in(message)
    order = ORDERS[order_id]
    wish = "refund" if "money back" in message else "replacement"
    days = order["days_since_delivery"]
    return f"order {order_id}, {order['item']}, delivered {days} days ago, wants a {wish}"


def writer(brief: str) -> str:
    """Writes the reply to the customer from the brief."""
    parts = brief.split(", ")
    if len(parts) == 4 and parts[0].startswith("order "):
        order, item, wish = parts[0], parts[1], parts[3].replace("wants a ", "")
        return (
            f"Dear customer, we are sorry that your {item} broke. "
            f"A {wish} for {order} is on its way."
        )
    return "Dear customer, we are sorry about the problem. We will get back to you soon."


def checker(draft: str) -> str:
    """Checks the tone of the draft. It sees the draft and nothing else."""
    if draft.startswith("Dear customer") and "sorry" in draft:
        return "approved"
    return "rejected: the reply needs a greeting and an apology"


# Arrangement one: the program decides who runs when.


def pipeline(message: str) -> list:
    """Runs lookup, then writer, then checker. Returns each message as (sender, receiver, text)."""
    messages = [("customer", "lookup", message)]
    brief = lookup(message)
    messages.append(("lookup", "writer", brief))
    draft = writer(brief)
    messages.append(("writer", "checker", draft))
    verdict = checker(draft)
    messages.append(("checker", "program", verdict))
    if verdict == "approved":
        messages.append(("program", "customer", draft))
    return messages


def show(sender: str, receiver: str, content) -> None:
    print(f"{sender} -> {receiver}: {content!r}")


# Arrangement two: a manager model decides, and the workers are its tools.


class WorkerError(Exception):
    """A worker that could not do its job, such as a lookup whose service timed out."""


WORKERS = {"lookup": lookup, "writer": writer}


def run_worker(workers: dict, name: str, task: str) -> dict:
    """Runs a worker the way a harness runs a tool: an exception becomes an error result."""
    try:
        return {"ok": True, "text": workers[name](task)}
    except WorkerError as exc:
        return {"ok": False, "error": str(exc)}


def manager(history: list) -> dict:
    """The fake manager model. It reads the conversation so far and returns its next reply.

    A reply either asks for worker calls or gives the answer for the customer.
    """
    last = history[-1]
    if last["from"] == "customer":
        return {"calls": [{"worker": "lookup", "task": last["text"]}]}
    if last["from"] == "lookup":
        # Like a real model, it passes on what it got, an error message included.
        brief = last["text"] if last["ok"] else last["error"]
        return {"calls": [{"worker": "writer", "task": brief}]}
    return {"answer": last["text"]}


def no_check(*args) -> Optional[str]:
    return None


def run_manager(
    message: str,
    model: Callable = manager,
    workers: dict = WORKERS,
    check_reply: Callable = no_check,
    check_result: Callable = no_check,
    max_turns: int = 5,
) -> None:
    """The loop around the manager. It runs each worker call the manager asks for.

    check_reply sees each manager reply, and check_result sees each worker
    result. A check that returns a text stops the run with that text.
    """
    history = [{"from": "customer", "text": message}]
    for _ in range(max_turns):
        reply = model(history)
        problem = check_reply(reply)
        if problem:
            stop(problem)
            return
        if "answer" in reply or not reply.get("calls"):
            show("manager", "customer", reply.get("answer", ""))
            return
        for call in reply["calls"]:
            show("manager", call["worker"], call["task"])
            result = run_worker(workers, call["worker"], call["task"])
            show(call["worker"], "manager", result)
            history.append({"from": call["worker"], **result})
            problem = check_result(call["worker"], result)
            if problem:
                stop(problem)
                return
    stop(f"no answer after {max_turns} manager turns")


def stop(problem: str) -> None:
    print(f"stopped: {problem}")
    print("nothing was sent to the customer")


# The faults, one per boundary.


def manager_empty_plan(history: list) -> dict:
    """A manager whose first reply asks for no worker and gives no answer."""
    return {"calls": []}


def lookup_times_out(message: str) -> str:
    raise WorkerError("order service timed out")


FAILING_WORKERS = {**WORKERS, "lookup": lookup_times_out}


# The checks at the boundaries.


def stop_on_error(worker: str, result: dict) -> Optional[str]:
    """Stops the run when a worker returns an error."""
    if not result["ok"]:
        return f"{worker} failed: {result['error']}"
    return None


def stop_on_empty_plan(reply: dict) -> Optional[str]:
    """Stops the run when the manager asks for nothing and answers nothing.

    The exercise: write this check. As it stands, it lets every reply through.
    """
    return None


def run_guarded(message: str, model: Callable = manager, workers: dict = WORKERS) -> None:
    run_manager(
        message,
        model=model,
        workers=workers,
        check_reply=stop_on_empty_plan,
        check_result=stop_on_error,
    )


# The steps.


def step_handoffs() -> None:
    """Only the messages from one agent to the next."""
    for sender, receiver, text in pipeline(MESSAGE):
        if sender in WORKERS and receiver in ("writer", "checker"):
            show(sender, receiver, text)


def step_pipeline() -> None:
    for sender, receiver, text in pipeline(MESSAGE):
        show(sender, receiver, text)


def step_manager() -> None:
    run_manager(MESSAGE)


def step_empty_plan() -> None:
    run_manager(MESSAGE, model=manager_empty_plan)


def step_tool_error() -> None:
    run_manager(MESSAGE, workers=FAILING_WORKERS)


def step_guarded() -> None:
    run_guarded(MESSAGE, workers=FAILING_WORKERS)


def step_exercise() -> None:
    """Both faults, with the guarded loop. The output is the two traces."""
    print("fault: empty plan from the manager")
    run_guarded(MESSAGE, model=manager_empty_plan)
    print("fault: tool error from the lookup worker")
    run_guarded(MESSAGE, workers=FAILING_WORKERS)


STEPS = {
    "handoffs": step_handoffs,
    "pipeline": step_pipeline,
    "manager": step_manager,
    "empty_plan": step_empty_plan,
    "tool_error": step_tool_error,
    "guarded": step_guarded,
    "exercise": step_exercise,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
